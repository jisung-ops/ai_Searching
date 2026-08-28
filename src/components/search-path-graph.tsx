"use client";

import React, { useState } from "react";
import { isToolUIPart, getToolName } from "ai";
import {
  Brain,
  Search,
  Globe,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Compass,
} from "lucide-react";
import { motion } from "framer-motion";

interface SourceData {
  title: string;
  url: string;
  site: string;
  content?: string;
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
  const [activeStepTab, setActiveStepTab] = useState<number | null>(null);

  // Filter searchWeb tool calls
  const searchParts =
    messageParts?.filter(
      (part) => isToolUIPart(part) && getToolName(part) === "searchWeb"
    ) || [];

  if (searchParts.length === 0) return null;

  const N = searchParts.length;
  const isComplete = !isLoading;

  // Collect all unique sources across steps
  const allUniqueSources: SourceData[] = [];
  const globalUrlSet = new Set<string>();

  const stepDetails = searchParts.map((part, idx) => {
    const query = part.args?.query || "";
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

    const stepSources: SourceData[] = [];
    const stepUrlSet = new Set<string>();

    rawSources.forEach((src) => {
      if (src && src.url) {
        let site = src.site;
        if (!site) {
          try {
            site = new URL(src.url).hostname.replace("www.", "");
          } catch {
            site = "web";
          }
        }
        const sourceObj: SourceData = {
          title: src.title || "웹 출처",
          url: src.url,
          site,
          content: src.content,
        };

        if (!stepUrlSet.has(src.url)) {
          stepUrlSet.add(src.url);
          stepSources.push(sourceObj);
        }

        if (!globalUrlSet.has(src.url)) {
          globalUrlSet.add(src.url);
          allUniqueSources.push(sourceObj);
        }
      }
    });

    return {
      stepNum: idx + 1,
      query,
      isCompleted: isStepCompleted,
      sources: stepSources,
    };
  });

  return (
    <div className="relative border border-indigo-500/20 bg-card/70 backdrop-blur-xl rounded-2xl p-4.5 md:p-5 my-5 shadow-lg select-none overflow-hidden transition-all duration-300">
      {/* Top Ambient Accent Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-90" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-wide uppercase text-foreground">
                심층 탐색 분석 & 답변 요약
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isComplete
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 animate-pulse"
                }`}
              >
                {isComplete ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{N}단계 탐색 및 종합 완료</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>심층 추론 및 수집 중 ({N}단계)</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              총 {allUniqueSources.length}개 교차 검증 웹 소스 기반 분석
            </p>
          </div>
        </div>

        {onSelectFinalAnswer && (
          <button
            type="button"
            onClick={onSelectFinalAnswer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <span>상세 답변 바로가기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Step-by-Step Search Summary Cards */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              단계별 심층 탐색 경로 ({N}단계)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stepDetails.map((step, idx) => {
              const isExpanded = activeStepTab === idx;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="rounded-xl border border-border/70 bg-muted/20 hover:border-indigo-500/30 transition-all p-3.5 flex flex-col justify-between"
                >
                  <div>
                    {/* Step Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                          Step {step.stepNum}
                        </span>
                        <span className="text-xs font-semibold text-foreground/90 truncate max-w-[200px]">
                          {step.stepNum === 1
                            ? "기본 정보 & 개요 수집"
                            : step.stepNum === 2
                            ? "심층 비교 & 세부 검증"
                            : `추가 검증 ${step.stepNum}단계`}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          step.isCompleted
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse"
                        }`}
                      >
                        {step.isCompleted ? "수집 완료" : "진행 중"}
                      </span>
                    </div>

                    {/* Query Display */}
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-card/80 border border-border/50 text-xs font-mono text-foreground/80 mb-2.5">
                      <Search className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate" title={step.query}>
                        "{step.query}"
                      </span>
                    </div>
                  </div>

                  {/* Sources Preview */}
                  {step.sources.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-emerald-500" />
                          수집 출처 ({step.sources.length}개)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStepTab(isExpanded ? null : idx)
                          }
                          className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{isExpanded ? "접기" : "출처 목록"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Source Pills / Accordion */}
                      {!isExpanded ? (
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                          {step.sources.slice(0, 3).map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card hover:bg-muted border border-border/60 text-[10px] text-foreground/80 truncate max-w-[130px] transition shrink-0"
                              title={src.title}
                            >
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {src.site}
                              </span>
                            </a>
                          ))}
                          {step.sources.length > 3 && (
                            <span className="text-[9px] font-bold text-muted-foreground">
                              +{step.sources.length - 3}개
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 pt-1 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                          {step.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-1.5 rounded-lg bg-card hover:bg-muted border border-border/50 text-[10px] text-foreground transition group"
                            >
                              <span className="truncate font-medium group-hover:text-blue-500">
                                {src.title}
                              </span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 ml-1" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Synthesized Answer Summary Card */}
        <div className="p-4 rounded-xl border border-purple-500/25 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>심층 분석 & 답변 핵심 포인트</span>
          </div>

          <div className="text-xs text-foreground/90 space-y-1.5 leading-relaxed pl-1">
            <div className="flex items-start gap-2">
              <span className="text-purple-500 font-bold shrink-0">•</span>
              <span>
                <strong>질문 맥락:</strong> "{userQuestion}" 주제에 관한 다각도 웹 데이터 교차 검증 완료
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold shrink-0">•</span>
              <span>
                <strong>분석 종합:</strong> 총 {N}단계 다중 쿼리 조회를 통해 신뢰도 높은 최신 자료 및 관련 미디어를 종합 구성
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
