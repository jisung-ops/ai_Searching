"use client";

import React, { useState } from "react";
import { isToolUIPart, getToolName } from "ai";
import { Compass, Search, Globe, Sparkles, RefreshCw, BookOpen, HelpCircle } from "lucide-react";
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
}

export default function SearchPathGraph({
  messageParts,
  isLoading,
  isCurrentMessage,
  userQuestion,
}: SearchPathGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // 1. Filter out searchWeb tool calls
  const searchParts = messageParts?.filter(
    (part) => isToolUIPart(part) && getToolName(part) === "searchWeb"
  ) || [];

  if (searchParts.length === 0) return null;

  const N = searchParts.length;
  const isComplete = !isLoading;

  // 2. Build layout coordinates
  const centerY = 185;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Add Root Node (User Question)
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
    const isStepCompleted = part.state === "output-available" || (part as any).state === "result";

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

    // Extract sources
    let rawSources: any[] = [];
    if (isStepCompleted && "output" in part && part.output) {
      if (Array.isArray(part.output)) {
        rawSources = part.output;
      } else if (typeof part.output === "object" && "results" in part.output) {
        rawSources = (part.output as any).results || [];
      }
    }

    // Deduplicate sources
    const uniqueUrls = new Set();
    const sources: SourceData[] = [];
    rawSources.forEach((src) => {
      if (src && src.url && !uniqueUrls.has(src.url)) {
        uniqueUrls.add(src.url);
        sources.push({
          title: src.title || "출처",
          url: src.url,
          site: src.site || new URL(src.url).hostname.replace("www.", ""),
          content: src.content,
        });
      }
    });

    const maxVisibleSources = 3;
    const displaySources = sources.slice(0, maxVisibleSources);
    const hasMore = sources.length > maxVisibleSources;

    // Fan-out coordinate offsets for source nodes:
    // 0: Top Left (-60, -90)
    // 1: Top Right (60, -90)
    // 2: Bottom Left (-60, 90)
    // 3 (More): Bottom Right (60, 90)
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
    label: "종합 답변",
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

  // SVG Width Calculation
  const svgWidth = finalX + 110;
  const svgHeight = 370;

  // Bezier curve calculations
  const getHorizontalBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1);
    const cx1 = x1 + dx * 0.4;
    const cx2 = x2 - dx * 0.4;
    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
  };

  const getBranchBezier = (x1: number, y1: number, x2: number, y2: number) => {
    // S-curve branching outwards
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  return (
    <div className="relative border border-border/50 bg-muted/15 rounded-2xl p-4 overflow-hidden my-4 shadow-sm select-none">
      {/* Background decoration grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main horizontally scrollable area */}
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div style={{ width: svgWidth, height: svgHeight }} className="relative mx-auto">
          {/* SVG Elements underneath HTML Nodes */}
          <svg
            width={svgWidth}
            height={svgHeight}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Gradients definitions */}
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
              <linearGradient id="purple-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Render Edges */}
            {edges.map((edge) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              // Node dimensions to adjust connection points
              const fromWidth = fromNode.type === "root" ? 170 : fromNode.type === "search" ? 200 : fromNode.type === "final" ? 140 : 130;
              
              const toWidth = toNode.type === "root" ? 170 : toNode.type === "search" ? 200 : toNode.type === "final" ? 140 : 130;

              // Connection coordinates from center-left/center-right
              const x1 = edge.type === "main" ? fromNode.x + fromWidth / 2 : fromNode.x;
              const y1 = fromNode.y;
              const x2 = edge.type === "main" ? toNode.x - toWidth / 2 : toNode.x;
              const y2 = toNode.y;

              const pathD = edge.type === "main" 
                ? getHorizontalBezier(x1, y1, x2, y2)
                : getBranchBezier(x1, y1, x2, y2);

              const isEdgeGlowing = hoveredNode?.id === edge.from || hoveredNode?.id === edge.to;

              return (
                <g key={edge.id}>
                  {/* Thick Glow underlay when hovered */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      edge.type === "main"
                        ? "rgba(99, 102, 241, 0.2)"
                        : "rgba(16, 185, 129, 0.15)"
                    }
                    strokeWidth={isEdgeGlowing ? 8 : 4}
                    className="transition-all duration-300"
                    opacity={isEdgeGlowing ? 0.7 : 0.2}
                  />

                  {/* Base path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      edge.type === "main" 
                        ? "var(--border)" 
                        : "rgba(16, 185, 129, 0.3)"
                    }
                    strokeWidth={2}
                  />

                  {/* Flow animation overlay */}
                  {edge.animated ? (
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke={edge.type === "main" ? "url(#indigo-purple)" : "url(#emerald-teal)"}
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
                      stroke={edge.type === "main" ? "url(#indigo-purple)" : "url(#emerald-teal)"}
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

          {/* Render Nodes as HTML Elements overlaying the SVG */}
          {nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            
            // Width/Height matches layout sizes
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
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* 1. ROOT NODE */}
                {node.type === "root" && (
                  <div className="w-full h-full flex flex-col justify-center px-3.5 border border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 dark:bg-blue-500/10 rounded-2xl transition duration-200 shadow-sm relative group cursor-help">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 select-none">
                      <Compass className="w-3.5 h-3.5" />
                      <span>탐색 질문</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground/90 truncate mt-1 leading-snug">
                      {node.label}
                    </div>
                    {/* Pulsing indicator */}
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                  </div>
                )}

                {/* 2. SEARCH STEP NODE */}
                {node.type === "search" && (
                  <div className={`w-full h-full flex flex-col justify-center px-3.5 border transition duration-200 rounded-2xl relative shadow-sm ${
                    node.data?.status === "loading"
                      ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20"
                      : "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60 dark:bg-indigo-500/10 cursor-help"
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400 select-none">
                      <div className="flex items-center gap-1.5">
                        {node.data?.status === "loading" ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>탐색 {node.data?.stepNum}단계</span>
                      </div>
                      <span className={`px-1 rounded-[4px] text-[8px] font-bold tracking-wide uppercase ${
                        node.data?.status === "loading" 
                          ? "bg-indigo-500 text-white animate-pulse" 
                          : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      }`}>
                        {node.data?.status === "loading" ? "수행중" : "완료"}
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
                    className="w-full h-full flex items-center gap-2 px-3 border border-emerald-500/25 bg-card hover:border-emerald-500 hover:bg-muted text-foreground transition-all duration-200 rounded-xl shadow-xs cursor-pointer select-none group"
                  >
                    <div className="p-1 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0 pr-1 select-none">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">출처</span>
                      <span className="text-[10px] font-semibold text-foreground/80 truncate leading-normal" title={node.label}>
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
                  <div className={`w-full h-full flex flex-col justify-center px-4 border border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60 dark:bg-purple-500/10 rounded-2xl transition duration-200 shadow-sm relative cursor-help ${
                    isCurrentMessage && !isComplete ? "animate-pulse border-purple-500 bg-purple-500/10" : ""
                  }`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 select-none">
                      <Sparkles className={`w-3.5 h-3.5 ${isCurrentMessage && !isComplete ? "animate-spin" : ""}`} />
                      <span>지식 종합</span>
                    </div>
                    <div className="text-xs font-bold text-foreground/90 mt-1 leading-snug select-none">
                      {node.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Interactive Tooltip Card Overlay */}
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
                {/* TOOLTIP: ROOT NODE */}
                {hoveredNode.type === "root" && (
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                      <HelpCircle className="w-3 h-3" />
                      질문 주제
                    </span>
                    <p className="text-xs font-semibold text-foreground/90 leading-relaxed font-sans">
                      "{hoveredNode.label}"
                    </p>
                    <p className="text-[9px] text-muted-foreground">이 질문을 출발점으로 심층 검색을 시작했습니다.</p>
                  </div>
                )}

                {/* TOOLTIP: SEARCH STEP NODE */}
                {hoveredNode.type === "search" && (
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                      <Search className="w-3 h-3" />
                      ⚡ 탐색 {hoveredNode.data?.stepNum}단계 검색어
                    </span>
                    <p className="text-xs font-semibold text-foreground/90 leading-relaxed font-mono">
                      "{hoveredNode.label}"
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {hoveredNode.data?.status === "loading"
                        ? "서브 키워드 추출 후 자료 검색을 진행하고 있습니다."
                        : "수집한 지식을 교차 검증하기 위해 세부 주제를 탐색했습니다."}
                    </p>
                  </div>
                )}

                {/* TOOLTIP: SOURCE NODE */}
                {hoveredNode.type === "source" && (
                  <div className="space-y-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                      <Globe className="w-3 h-3" />
                      참고한 웹사이트 ({hoveredNode.data?.site})
                    </span>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-foreground hover:text-blue-500 leading-snug line-clamp-2">
                        {hoveredNode.data?.title}
                      </p>
                      {hoveredNode.data?.content && (
                        <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed font-normal">
                          {hoveredNode.data.content}
                        </p>
                      )}
                    </div>
                    <span className="block text-[9px] text-blue-500 font-semibold text-right">
                      클릭하면 원본 웹사이트로 이동 ↗
                    </span>
                  </div>
                )}

                {/* TOOLTIP: MORE SOURCES BADGE */}
                {hoveredNode.type === "more" && (
                  <div className="space-y-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" />
                      추가 출처 리스트 (+{hoveredNode.data?.count}개)
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {hoveredNode.data?.sources?.map((src: any, idx: number) => (
                        <div key={idx} className="text-[10px] border-b border-border/40 pb-1 last:border-0">
                          <p className="font-semibold text-foreground/80 truncate">{src.title}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{src.site}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TOOLTIP: FINAL SYNTHESIS NODE */}
                {hoveredNode.type === "final" && (
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-500">
                      <Sparkles className="w-3.5 h-3.5" />
                      지식 종합 & 답변 생성
                    </span>
                    <p className="text-xs font-semibold text-foreground/90 leading-relaxed select-none">
                      {isCurrentMessage && !isComplete
                        ? "각 단계에서 발굴한 정보들을 종합하여 심층 답변을 작성하고 있습니다..."
                        : "발굴된 모든 출처의 핵심 지식을 교차 분석하여 신뢰성 높은 최종 종합 보고서를 완성했습니다."}
                    </p>
                  </div>
                )}

                {/* Small indicator pointing downwards */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-card/95 pointer-events-none" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
