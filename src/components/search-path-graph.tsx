"use client";

import React, { useState } from "react";
import { isToolUIPart, getToolName } from "ai";
import {
  Compass,
  Search,
  Globe,
  Sparkles,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
  Activity,
  FileText,
  Brain,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SourceData {
  title: string;
  url: string;
  site: string;
  content?: string;
}

interface Node {
  id: string;
  type: "root" | "search" | "source" | "more" | "final";
  label: string;
  x: number;
  y: number;
  data?: any;
}

interface Edge {
  id: string;
  from: string;
  to: string;
  type: "main" | "branch";
  animated: boolean;
}

interface SearchPathGraphProps {
  messageParts: any[];
  isLoading: boolean;
  isCurrentMessage: boolean;
  userQuestion: string;
  onSelectFinalAnswer?: () => void;
}

export default function SearchPathGraph({
  messageParts,
  isLoading,
  isCurrentMessage,
  userQuestion,
  onSelectFinalAnswer,
}: SearchPathGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [inspectingNode, setInspectingNode] = useState<Node | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "timeline">("tree");

  // 1. Filter out searchWeb tool calls
  const searchParts =
    messageParts?.filter(
      (part) => isToolUIPart(part) && getToolName(part) === "searchWeb"
    ) || [];

  if (searchParts.length === 0) return null;

  const N = searchParts.length;
  const isComplete = !isLoading;

  // Collect all unique sources across all steps for header statistics
  const allUniqueSources: SourceData[] = [];
  const globalUrlSet = new Set<string>();

  searchParts.forEach((part) => {
    const isStepCompleted =
      part.state === "output-available" || (part as any).state === "result";
    let rawSources: any[] = [];
    if (isStepCompleted && "output" in part && part.output) {
      if (Array.isArray(part.output)) {
        rawSources = part.output;
      } else if (typeof part.output === "object" && "results" in part.output) {
        rawSources = (part.output as any).results || [];
      }
    }
    rawSources.forEach((src) => {
      if (src && src.url && !globalUrlSet.has(src.url)) {
        globalUrlSet.add(src.url);
        let site = src.site;
        if (!site) {
          try {
            site = new URL(src.url).hostname.replace("www.", "");
          } catch {
            site = "web";
          }
        }
        allUniqueSources.push({
          title: src.title || "웹 출처",
          url: src.url,
          site,
          content: src.content,
        });
      }
    });
  });

  // 2. Build layout coordinates for SVG Tree
  const centerY = 185;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Root Node (User Question)
  nodes.push({
    id: "root",
    type: "root",
    label: userQuestion,
    x: 90,
    y: centerY,
  });

  searchParts.forEach((part, i) => {
    const query = part.args?.query || "";
    const cx = 290 + i * 270;
    const cy = centerY;
    const isStepCompleted =
      part.state === "output-available" || (part as any).state === "result";

    // Extract sources for this step
    let rawSources: any[] = [];
    if (isStepCompleted && "output" in part && part.output) {
      if (Array.isArray(part.output)) {
        rawSources = part.output;
      } else if (typeof part.output === "object" && "results" in part.output) {
        rawSources = (part.output as any).results || [];
      }
    }

    const uniqueUrls = new Set();
    const sources: SourceData[] = [];
    rawSources.forEach((src) => {
      if (src && src.url && !uniqueUrls.has(src.url)) {
        uniqueUrls.add(src.url);
        let site = src.site;
        if (!site) {
          try {
            site = new URL(src.url).hostname.replace("www.", "");
          } catch {
            site = "web";
          }
        }
        sources.push({
          title: src.title || "출처",
          url: src.url,
          site,
          content: src.content,
        });
      }
    });

    // Add Search Step Node
    nodes.push({
      id: `search-${i}`,
      type: "search",
      label: query,
      x: cx,
      y: cy,
      data: {
        stepNum: i + 1,
        status: isStepCompleted ? "completed" : "loading",
        sources,
      },
    });

    // Main horizontal edge
    const prevId = i === 0 ? "root" : `search-${i - 1}`;
    edges.push({
      id: `edge-${prevId}-to-search-${i}`,
      from: prevId,
      to: `search-${i}`,
      type: "main",
      animated: isCurrentMessage && !isStepCompleted,
    });

    const maxVisibleSources = 3;
    const displaySources = sources.slice(0, maxVisibleSources);
    const hasMore = sources.length > maxVisibleSources;

    const positions = [
      { dx: -60, dy: -90 },
      { dx: 60, dy: -90 },
      { dx: -60, dy: 90 },
      { dx: 60, dy: 90 },
    ];

    displaySources.forEach((src, j) => {
      const pos = positions[j];
      const srcId = `src-${i}-${j}`;

      nodes.push({
        id: srcId,
        type: "source",
        label: src.site,
        x: cx + pos.dx,
        y: cy + pos.dy,
        data: src,
      });

      edges.push({
        id: `edge-search-${i}-to-${srcId}`,
        from: `search-${i}`,
        to: srcId,
        type: "branch",
        animated: false,
      });
    });

    if (hasMore) {
      const pos = positions[3];
      const moreId = `more-${i}`;

      nodes.push({
        id: moreId,
        type: "more",
        label: `+${sources.length - maxVisibleSources}개 출처`,
        x: cx + pos.dx,
        y: cy + pos.dy,
        data: {
          count: sources.length - maxVisibleSources,
          sources: sources.slice(maxVisibleSources),
        },
      });

      edges.push({
        id: `edge-search-${i}-to-${moreId}`,
        from: `search-${i}`,
        to: moreId,
        type: "branch",
        animated: false,
      });
    }
  });

  // Final Synthesis Node
  const finalX = 290 + N * 270;
  const finalY = centerY;

  nodes.push({
    id: "final",
    type: "final",
    label: "지식 종합",
    x: finalX,
    y: finalY,
  });

  const lastSearchId = N === 0 ? "root" : `search-${N - 1}`;
  edges.push({
    id: `edge-${lastSearchId}-to-final`,
    from: lastSearchId,
    to: "final",
    type: "main",
    animated: isCurrentMessage && !isComplete,
  });

  const svgWidth = finalX + 120;
  const svgHeight = 370;

  const getHorizontalBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1);
    const cx1 = x1 + dx * 0.4;
    const cx2 = x2 - dx * 0.4;
    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
  };

  const getBranchBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  return (
    <div className="relative border border-indigo-500/20 bg-card/60 backdrop-blur-xl rounded-2xl p-4 md:p-5 my-5 shadow-lg select-none overflow-hidden transition-all duration-300">
      {/* Glow ambient header background */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

      {/* Header bar: Deep Research status & View switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-wide uppercase text-foreground">
                Deep Research 탐색 경로
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isComplete
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 animate-pulse"
                }`}
              >
                {isComplete ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{N}단계 탐색 완료</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>심층 추론 중 ({N}단계)</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              총 {allUniqueSources.length}개 웹 출처 교차 검증 중
            </p>
          </div>
        </div>

        {/* View Switcher: Tree View vs Timeline View */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-200 ${
              viewMode === "tree"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>트리 맵</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-200 ${
              viewMode === "timeline"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>사고 타임라인</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SVG TREE GRAPH VIEW */}
      {viewMode === "tree" && (
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <div style={{ width: svgWidth, height: svgHeight }} className="relative mx-auto">
            {/* SVG Lines */}
            <svg
              width={svgWidth}
              height={svgHeight}
              className="absolute inset-0 pointer-events-none"
            >
              <defs>
                <linearGradient id="blue-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="indigo-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="emerald-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>

              {edges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                const fromWidth =
                  fromNode.type === "root"
                    ? 170
                    : fromNode.type === "search"
                    ? 200
                    : fromNode.type === "final"
                    ? 140
                    : 130;

                const toWidth =
                  toNode.type === "root"
                    ? 170
                    : toNode.type === "search"
                    ? 200
                    : toNode.type === "final"
                    ? 140
                    : 130;

                const x1 = edge.type === "main" ? fromNode.x + fromWidth / 2 : fromNode.x;
                const y1 = fromNode.y;
                const x2 = edge.type === "main" ? toNode.x - toWidth / 2 : toNode.x;
                const y2 = toNode.y;

                const pathD =
                  edge.type === "main"
                    ? getHorizontalBezier(x1, y1, x2, y2)
                    : getBranchBezier(x1, y1, x2, y2);

                const isEdgeGlowing =
                  hoveredNode?.id === edge.from || hoveredNode?.id === edge.to;

                return (
                  <g key={edge.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        edge.type === "main"
                          ? "rgba(99, 102, 241, 0.25)"
                          : "rgba(16, 185, 129, 0.2)"
                      }
                      strokeWidth={isEdgeGlowing ? 8 : 4}
                      className="transition-all duration-300"
                      opacity={isEdgeGlowing ? 0.8 : 0.3}
                    />

                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        edge.type === "main"
                          ? "var(--border)"
                          : "rgba(16, 185, 129, 0.35)"
                      }
                      strokeWidth={2}
                    />

                    {edge.animated ? (
                      <motion.path
                        d={pathD}
                        fill="none"
                        stroke={
                          edge.type === "main"
                            ? "url(#indigo-purple)"
                            : "url(#emerald-teal)"
                        }
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        animate={{ strokeDashoffset: [0, -20] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          ease: "linear",
                        }}
                      />
                    ) : isEdgeGlowing ? (
                      <motion.path
                        d={pathD}
                        fill="none"
                        stroke={
                          edge.type === "main"
                            ? "url(#indigo-purple)"
                            : "url(#emerald-teal)"
                        }
                        strokeWidth={2}
                        initial={{ strokeDasharray: "4 4", strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: [0, -20] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "linear",
                        }}
                      />
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              let nodeWidth = 130;
              let nodeHeight = 44;

              if (node.type === "root") {
                nodeWidth = 170;
                nodeHeight = 72;
              } else if (node.type === "search") {
                nodeWidth = 200;
                nodeHeight = 72;
              } else if (node.type === "final") {
                nodeWidth = 140;
                nodeHeight = 72;
              }

              return (
                <div
                  key={node.id}
                  className="absolute transition-all duration-300"
                  style={{
                    left: node.x - nodeWidth / 2,
                    top: node.y - nodeHeight / 2,
                    width: nodeWidth,
                    height: nodeHeight,
                  }}
                  onClick={() => {
                    setSelectedNode(node);
                    setInspectingNode(node);
                    if (node.type === "final" && onSelectFinalAnswer) {
                      onSelectFinalAnswer();
                    }
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* 1. ROOT NODE */}
                  {node.type === "root" && (
                    <div
                      className={`w-full h-full flex flex-col justify-center px-3.5 border transition duration-200 rounded-2xl relative shadow-sm cursor-pointer ${
                        selectedNode?.id === node.id
                          ? "border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/30"
                          : "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 dark:bg-blue-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 select-none">
                        <Compass className="w-3.5 h-3.5" />
                        <span>탐색 질문</span>
                      </div>
                      <div className="text-xs font-semibold text-foreground/90 truncate mt-1 leading-snug">
                        {node.label}
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                      </span>
                    </div>
                  )}

                  {/* 2. SEARCH STEP NODE */}
                  {node.type === "search" && (
                    <div
                      className={`w-full h-full flex flex-col justify-center px-3.5 border transition duration-200 rounded-2xl relative shadow-sm cursor-pointer ${
                        selectedNode?.id === node.id
                          ? "border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/30"
                          : node.data?.status === "loading"
                          ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20"
                          : "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60 dark:bg-indigo-500/10"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400 select-none">
                        <div className="flex items-center gap-1.5">
                          {node.data?.status === "loading" ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>탐색 {node.data?.stepNum}단계</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wide uppercase ${
                            node.data?.status === "loading"
                              ? "bg-indigo-500 text-white animate-pulse"
                              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {node.data?.sources?.length > 0
                            ? `${node.data.sources.length}개 소스`
                            : node.data?.status === "loading"
                            ? "수행중"
                            : "완료"}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-foreground/90 truncate mt-1 leading-snug">
                        {node.label}
                      </div>
                    </div>
                  )}

                  {/* 3. SOURCE NODE */}
                  {node.type === "source" && (
                    <a
                      href={node.data?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-full flex items-center gap-2 px-3 border border-emerald-500/25 bg-card hover:border-emerald-500 hover:bg-muted text-foreground transition-all duration-200 rounded-xl shadow-xs cursor-pointer select-none group"
                    >
                      <div className="p-1 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 shrink-0 group-hover:scale-105 transition-transform">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 pr-1 select-none">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                          출처
                        </span>
                        <span
                          className="text-[10px] font-semibold text-foreground/80 truncate leading-normal"
                          title={node.label}
                        >
                          {node.label}
                        </span>
                      </div>
                    </a>
                  )}

                  {/* 4. MORE SOURCES BADGE */}
                  {node.type === "more" && (
                    <div className="w-full h-full flex items-center justify-center gap-1.5 px-3 border border-border bg-card/75 hover:bg-muted hover:border-border-hover text-muted-foreground transition duration-200 rounded-xl shadow-xs cursor-help">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="text-[10px] font-bold tracking-tight truncate">
                        {node.label}
                      </span>
                    </div>
                  )}

                  {/* 5. FINAL SYNTHESIS NODE */}
                  {node.type === "final" && (
                    <div
                      className={`w-full h-full flex flex-col justify-center px-4 border transition duration-200 rounded-2xl shadow-sm relative cursor-pointer ${
                        selectedNode?.id === node.id
                          ? "border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/30"
                          : "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60 dark:bg-purple-500/10"
                      } ${
                        isCurrentMessage && !isComplete
                          ? "animate-pulse border-purple-500 bg-purple-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 select-none">
                        <Sparkles
                          className={`w-3.5 h-3.5 ${
                            isCurrentMessage && !isComplete ? "animate-spin" : ""
                          }`}
                        />
                        <span>지식 종합</span>
                      </div>
                      <div className="text-xs font-bold text-foreground/90 mt-1 leading-snug select-none flex items-center justify-between">
                        <span>{node.label}</span>
                        <span className="text-[9px] text-purple-500 underline font-normal">
                          답변 이동 ↓
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Hover Tooltip Card */}
            <AnimatePresence>
              {hoveredNode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 p-3.5 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl text-xs w-72 max-w-sm pointer-events-none select-none"
                  style={{
                    left: `${hoveredNode.x}px`,
                    top: `${hoveredNode.y - 12}px`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  {hoveredNode.type === "root" && (
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                        <HelpCircle className="w-3 h-3" />
                        탐색 출발 질문
                      </span>
                      <p className="text-xs font-semibold text-foreground/90 leading-relaxed font-sans">
                        "{hoveredNode.label}"
                      </p>
                    </div>
                  )}

                  {hoveredNode.type === "search" && (
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                        <Search className="w-3 h-3" />⚡ 탐색 {hoveredNode.data?.stepNum}단계
                        검색어
                      </span>
                      <p className="text-xs font-semibold text-foreground/90 leading-relaxed font-mono">
                        "{hoveredNode.label}"
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        클릭 시 수집된 {hoveredNode.data?.sources?.length || 0}개 출처 상세
                        정보를 확인할 수 있습니다.
                      </p>
                    </div>
                  )}

                  {hoveredNode.type === "source" && (
                    <div className="space-y-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                        <Globe className="w-3 h-3" />
                        참고 출처 ({hoveredNode.data?.site})
                      </span>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-foreground leading-snug line-clamp-2">
                          {hoveredNode.data?.title}
                        </p>
                        {hoveredNode.data?.content && (
                          <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed font-normal">
                            {hoveredNode.data.content}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {hoveredNode.type === "more" && (
                    <div className="space-y-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />
                        추가 출처 리스트 (+{hoveredNode.data?.count}개)
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                        {hoveredNode.data?.sources?.map((src: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-[10px] border-b border-border/40 pb-1 last:border-0"
                          >
                            <p className="font-semibold text-foreground/80 truncate">
                              {src.title}
                            </p>
                            <p className="text-[9px] text-muted-foreground truncate">
                              {src.site}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hoveredNode.type === "final" && (
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-purple-500">
                        <Sparkles className="w-3.5 h-3.5" />
                        지식 종합 & 답변 생성
                      </span>
                      <p className="text-xs font-semibold text-foreground/90 leading-relaxed">
                        수집된 모든 정보의 교차 검증을 완료하고 답변을 구성했습니다.
                      </p>
                    </div>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-card/95 pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* VIEW 2: TIMELINE REASONING VIEW */}
      {viewMode === "timeline" && (
        <div className="py-2 space-y-3">
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-500/20">
            {searchParts.map((part, idx) => {
              const query = part.args?.query || "";
              const isStepCompleted =
                part.state === "output-available" || (part as any).state === "result";

              let rawSources: any[] = [];
              if (isStepCompleted && "output" in part && part.output) {
                if (Array.isArray(part.output)) rawSources = part.output;
                else if (typeof part.output === "object" && "results" in part.output)
                  rawSources = (part.output as any).results || [];
              }

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="relative group"
                >
                  {/* Dot */}
                  <span className="absolute -left-[21px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-card border-2 border-indigo-500 text-indigo-500 shadow-sm">
                    {isStepCompleted ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    )}
                  </span>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-indigo-500/40 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                          Step {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground font-mono">
                          "{query}"
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {rawSources.length}개 웹 페이지 탐색
                      </span>
                    </div>

                    {/* Sources preview tags */}
                    {rawSources.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {rawSources.slice(0, 4).map((src: any, sIdx: number) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-card border border-border text-[10px] text-foreground/80 hover:text-blue-500 transition"
                          >
                            <Globe className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="truncate max-w-[140px]">
                              {src.site || src.title}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                          </a>
                        ))}
                        {rawSources.length > 4 && (
                          <span className="text-[10px] font-semibold text-muted-foreground self-center px-1">
                            +{rawSources.length - 4}개 더보기
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Node Briefing Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border/50 text-xs text-foreground/90 space-y-2 bg-muted/30 p-3.5 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] flex items-center gap-1.5 text-indigo-500">
                <Zap className="w-3.5 h-3.5" />
                선택된 노드 분석 브리핑
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
              >
                닫기 ✕
              </button>
            </div>
            {selectedNode.type === "root" && (
              <p className="text-muted-foreground leading-relaxed">
                출발 질문: <span className="font-semibold text-foreground">"{selectedNode.label}"</span>
                <br />
                사용자의 요청을 기초로 multi-step 탐색 서브 쿼리를 도출하였습니다.
              </p>
            )}
            {selectedNode.type === "search" && (
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">
                  {selectedNode.data?.stepNum}단계 서브 쿼리: "{selectedNode.label}"
                </p>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  이 키워드로 수집된 지식들이 아래 최종 보고서에 직접 교차 검증 반영되었습니다.
                </p>
              </div>
            )}
            {selectedNode.type === "final" && (
              <div className="space-y-1.5">
                <p className="font-semibold text-purple-600 dark:text-purple-400 flex items-center justify-between">
                  <span>✨ 지식 종합 완료 (최종 보고서 작성됨)</span>
                  {onSelectFinalAnswer && (
                    <button
                      type="button"
                      onClick={onSelectFinalAnswer}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700 transition shadow-sm"
                    >
                      상세 답변으로 바로 이동 ↓
                    </button>
                  )}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* INSPECTION MODAL / DRAWER */}
      <AnimatePresence>
        {inspectingNode && inspectingNode.type === "search" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl max-h-[80vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      탐색 {inspectingNode.data?.stepNum}단계 세부 수집 결과
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      "{inspectingNode.label}"
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingNode(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
                <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  수집된 원문 출처 ({inspectingNode.data?.sources?.length || 0}개)
                </h4>

                {inspectingNode.data?.sources?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    수집된 웹 출처 정보가 없습니다.
                  </p>
                ) : (
                  inspectingNode.data?.sources?.map((src: SourceData, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1.5 hover:border-emerald-500/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {src.site}
                        </span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:underline"
                        >
                          원문 보기 <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug">
                        {src.title}
                      </p>
                      {src.content && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4 font-normal bg-card p-2 rounded-lg border border-border/40">
                          "{src.content}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingNode(null)}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
