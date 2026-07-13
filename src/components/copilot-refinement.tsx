"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Brain, Wand2, Check, X, ArrowRight, MessageSquare, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClarifyingQuestion {
  title: string;
  options: string[];
}

interface RefinementData {
  motivation: string;
  clarifyingQuestions: ClarifyingQuestion[];
  refinedSuggestions: string[];
}

interface CopilotRefinementProps {
  query: string;
  focusMode: string;
  onRefineComplete: (refinedQuery: string) => void;
  onCancel: () => void;
}

export default function CopilotRefinement({
  query,
  focusMode,
  onRefineComplete,
  onCancel,
}: CopilotRefinementProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [additionalContext, setAdditionalContext] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;

    const fetchRefinement = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, focusMode }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch refinement data");
        }

        const data = await res.json();
        if (active) {
          setRefinementData(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching refinement:", err);
        // Direct Client-Side Fallback as last resort
        if (active) {
          const fallback = getClientFallback(query, focusMode);
          setRefinementData(fallback);
          setIsLoading(false);
        }
      }
    };

    fetchRefinement();

    return () => {
      active = false;
    };
  }, [query, focusMode]);

  // Adjust textarea height
  const handleInputHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  };

  const handleOptionSelect = (qIdx: number, option: string) => {
    setSelectedOptions((prev) => {
      const next = { ...prev };
      if (next[qIdx] === option) {
        // Deselect if clicked again
        delete next[qIdx];
      } else {
        next[qIdx] = option;
      }
      return next;
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || !refinementData) return;

    // Compile refined query
    const optionsArray = Object.entries(selectedOptions)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([_, val]) => val)
      .filter(Boolean);

    let refinedQuery = query;
    if (optionsArray.length > 0) {
      refinedQuery += ` (${optionsArray.join(", ")})`;
    }
    if (additionalContext.trim()) {
      refinedQuery += ` - ${additionalContext.trim()}`;
    }

    onRefineComplete(refinedQuery);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Outer Card Container with glowing premium border */}
      <div className="relative bg-card/75 border border-border/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-indigo-500/5 overflow-hidden">
        {/* Glow lights behind the card */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-theme-from/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[45%] h-[45%] rounded-full bg-theme-to/10 blur-[80px] pointer-events-none" />

        {/* Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-theme-from to-theme-to text-white shadow-md shadow-theme-from/10">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <span>Copilot 질문 정교화</span>
                <span className="text-[10px] text-theme bg-theme/10 border border-theme/20 px-1.5 py-0.5 rounded font-bold font-sans">
                  GUIDE
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                AI 협업 가이드를 통해 질문을 최적화하고 명확한 결과를 얻어보세요
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="취소"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Original Query Display */}
        <div className="mb-6 p-3 bg-muted/30 border border-border/40 rounded-xl">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            원래 질문
          </span>
          <p className="text-sm font-semibold text-foreground truncate">{query}</p>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Premium Loading State with Skeleton UI */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-theme/10 blur-xl animate-ping" />
                <div className="p-4 rounded-2xl bg-muted/80 border border-border/80 text-theme shadow-md">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-1.5 max-w-sm">
                <p className="text-sm font-bold text-foreground">Copilot 질문 분석 중...</p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed animate-pulse">
                  질문의 의도를 정확히 파악하여 세부 검색 옵션과 추천 가이드라인을 구성하고 있습니다.
                </p>
              </div>

              {/* Skeletons */}
              <div className="w-full space-y-4 pt-4">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="h-9 bg-muted animate-pulse rounded-xl" />
                  <div className="h-9 bg-muted animate-pulse rounded-xl" />
                  <div className="h-9 bg-muted animate-pulse rounded-xl" />
                </div>
              </div>
            </motion.div>
          ) : refinementData ? (
            /* Loaded State */
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Motivation Alert Box */}
              {refinementData.motivation && (
                <div className="p-3.5 rounded-xl border border-theme/10 bg-theme/5 text-theme text-xs leading-relaxed flex gap-2">
                  <span className="select-none font-bold text-[14px]">💡</span>
                  <div>
                    <span className="font-bold mr-1">검색 조언:</span>
                    {refinementData.motivation}
                  </div>
                </div>
              )}

              {/* 1. Clarifying Questions */}
              {refinementData.clarifyingQuestions && refinementData.clarifyingQuestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-theme" />
                    <span>세부 사항 구체화 (다중 선택)</span>
                  </h3>

                  <div className="space-y-4">
                    {refinementData.clarifyingQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/80">
                          {qIdx + 1}. {q.title}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => {
                            const isSelected = selectedOptions[qIdx] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleOptionSelect(qIdx, opt)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-theme/10 text-theme border-theme/30 shadow-sm"
                                    : "bg-card hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 text-theme" />}
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Refined Suggestions (직접 선택 검색) */}
              {refinementData.refinedSuggestions && refinementData.refinedSuggestions.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-theme" />
                    <span>추천 질문 바로 검색 (클릭 시 즉시 시작)</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {refinementData.refinedSuggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => onRefineComplete(suggestion)}
                        className="flex items-center justify-between text-left text-xs py-3 px-4 rounded-xl border border-border/60 bg-card hover:bg-muted text-foreground/80 hover:text-foreground hover:border-border font-medium transition duration-200 group cursor-pointer"
                      >
                        <span className="truncate pr-4 leading-snug">{suggestion}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/35 group-hover:text-theme group-hover:translate-x-0.5 transition duration-200 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Additional Context Textbox */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  추가하고 싶은 구체적인 맥락 (선택 사항)
                </label>
                <div className="relative border border-border/80 bg-card rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-theme/20 focus-within:border-theme transition-all">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    onInput={handleInputHeight}
                    placeholder="예: 특정 라이브러리 사용 환경, 오류 메시지, 제약 조건 등..."
                    className="w-full bg-transparent outline-none resize-none border-none text-xs text-foreground placeholder:text-muted-foreground/60 p-3 pr-10 min-h-[42px] max-h-[100px] leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-theme-from to-theme-to hover:brightness-110 shadow-md shadow-theme-from/15 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>질문 정교화 완료 & 검색</span>
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Full Client Fallback data if server-side refinement fetch fails completely
function getClientFallback(query: string, focusMode: string): RefinementData {
  const lowerQuery = query.toLowerCase();
  
  if (focusMode === "code" || /next|react|vue|javascript|typescript|js|ts|python|code|develop|server/.test(lowerQuery)) {
    return {
      motivation: "개발 관련 키워드를 사용하셨습니다. 프레임워크나 최적화 의도 등을 지정하면 더욱 적합한 코드 모범 사례를 추천해 드릴 수 있습니다.",
      clarifyingQuestions: [
        {
          title: "개발 버전을 선택해 주세요.",
          options: ["최신 정식 버전", "구 버전 (레거시)", "무관 / 알 수 없음"]
        },
        {
          title: "어떤 목적의 정보를 원하시나요?",
          options: ["작성 예제 코드", "핵심 작동 원리", "성능 향상 / 보안"]
        }
      ],
      refinedSuggestions: [
        `실무 관점에서의 "${query}" 모범 구현 사례 및 에러 해결`,
        `"${query}"의 핵심 구조 분석 및 아키텍처 원리`,
        `"${query}" 사용 시 권장되는 모범 사례(Best Practices)`
      ]
    };
  }

  return {
    motivation: "질문하시는 주제에 대해 어떤 성격의 정보를 중점적으로 조사할지 명확히 선택하시면 최적의 답변을 생성할 수 있습니다.",
    clarifyingQuestions: [
      {
        title: "리서치의 중점 대상을 선택해 볼까요?",
        options: ["개념적인 개요", "실제 활용 가이드", "장단점 및 쟁점"]
      },
      {
        title: "원하시는 설명의 형식을 선택해 주세요.",
        options: ["간결한 핵심 요약", "체계적인 상세 분석", "상호 비교표 포함"]
      }
    ],
    refinedSuggestions: [
      `"${query}"의 정의와 핵심 동작 원리 쉽게 설명해줘`,
      `"${query}" 도입 시의 기대 이점 및 주요 리스크 대책`,
      `초보자도 이해하기 쉬운 "${query}" 기본 가이드라인`
    ]
  };
}
