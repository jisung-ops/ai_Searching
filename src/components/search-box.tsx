"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Search, Globe, GraduationCap, Code, Users, Sparkles, Compass, Lightbulb, Brain, Link2, X, ChevronDown, Cpu, Zap, Bot, MessageSquare } from "lucide-react";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  badge: string;
  badgeColor: string;
  desc: string;
  icon: any;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google AI",
    badge: "초고속 / 기본",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    desc: "초고속 실시간 웹 검색 통합 및 추천 엔진",
    icon: Zap,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    badge: "플래그십",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    desc: "범용 인공지능 & 복잡한 문제 정밀 분석",
    icon: Bot,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    badge: "고성능 코딩",
    badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    desc: "논리적인 보고서 작성 & 프로그래밍 코드 특화",
    icon: Cpu,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    badge: "심층 추론",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    desc: "고도화된 사고 프로세스(Reasoning) 및 심층 추론",
    icon: MessageSquare,
  },
];

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  isProMode: boolean;
  setIsProMode: (mode: boolean) => void;
  isCopilotMode: boolean;
  setIsCopilotMode: (mode: boolean) => void;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
}

const SUGGESTIONS = [
  { text: "Next.js 15 App Router의 주요 변경점", icon: Sparkles },
  { text: "https://wikipedia.org/wiki/Artificial_intelligence 이 문서 요약하고 최신 소식 비교해줘", icon: Globe },
  { text: "양자 컴퓨터의 동작 원리 쉽게 설명해줘", icon: Compass },
  { text: "개발 생산성을 높여주는 최고의 AI 도구들", icon: Lightbulb },
];

const FOCUS_MODES = [
  { id: "all", label: "전체 웹", icon: Globe, desc: "모든 웹사이트 검색" },
  { id: "academic", label: "학술 자료", icon: GraduationCap, desc: "논문, 학계 자료 및 위키백과 검색" },
  { id: "code", label: "코드/개발", icon: Code, desc: "GitHub, StackOverflow 등 개발 기술 사이트 검색" },
  { id: "social", label: "소셜/유튜브", icon: Users, desc: "Reddit, 유튜브 등 소셜 커뮤니티 검색" },
];

export default function SearchBox({
  onSearch,
  isLoading = false,
  focusMode,
  setFocusMode,
  isProMode,
  setIsProMode,
  isCopilotMode,
  setIsCopilotMode,
  selectedModel,
  setSelectedModel,
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const activeModelObj = useMemo(() => {
    return AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];
  }, [selectedModel]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Detect URLs in query text
  const detectedUrls = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s<">]+)/g;
    const matches = query.match(urlRegex) || [];
    return Array.from(new Set(matches));
  }, [query]);

  const removeUrl = (urlToRemove: string) => {
    setQuery((prev) => prev.replace(urlToRemove, "").trim());
  };

  const handleAddUrlPrompt = () => {
    const inputUrl = prompt("실시간으로 본문을 분석할 웹페이지 URL(예: https://...)을 입력하세요:");
    if (inputUrl && inputUrl.trim()) {
      let cleanUrl = inputUrl.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }
      setQuery((prev) => (prev ? `${prev} ${cleanUrl}` : cleanUrl));
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center">
      {/* Title / Brand Logo */}
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-theme-from to-theme-to bg-clip-text text-transparent">
          AI Searching
        </h1>
        <p className="text-sm text-muted-foreground">
          웹의 실시간 지식과 지정 웹페이지 본문을 지능적으로 통합 검색합니다
        </p>
      </div>

      {/* Main Search Input Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full relative bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-theme/20 focus-within:border-theme overflow-hidden"
      >
        {/* Detected URL Chips Display */}
        {detectedUrls.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-1 border-b border-border/30 bg-cyan-500/5">
            <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
              지정 웹페이지 실시간 결합:
            </span>
            {detectedUrls.map((url, idx) => {
              let hostname = url;
              try {
                hostname = new URL(url).hostname;
              } catch {}
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 shadow-xs"
                >
                  <span className="max-w-[180px] truncate" title={url}>
                    {hostname}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeUrl(url)}
                    className="hover:bg-cyan-500/20 p-0.5 rounded-full text-cyan-600 dark:text-cyan-400 cursor-pointer transition-colors"
                    title="URL 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="p-4 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="질문이나 웹페이지 URL(https://...)을 함께 입력해 보세요..."
            className="w-full bg-transparent outline-none resize-none border-none text-foreground placeholder:text-muted-foreground/70 pr-12 min-h-[44px] max-h-[200px]"
            style={{ height: "auto" }}
          />
        </div>

        {/* Action Bar inside search box with Focus Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 pb-3 pt-1 border-t border-border/40 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {FOCUS_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = focusMode === mode.id;
              
              const getModeClasses = () => {
                if (!isSelected) return "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground";
                switch (mode.id) {
                  case "academic":
                    return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-sm";
                  case "code":
                    return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-sm";
                  case "social":
                    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm";
                  default: // all
                    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm";
                }
              };

              const getIconColorClass = () => {
                if (!isSelected) return "";
                switch (mode.id) {
                  case "academic":
                    return "text-violet-500";
                  case "code":
                    return "text-orange-500";
                  case "social":
                    return "text-rose-500";
                  default:
                    return "text-blue-500";
                }
              };

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFocusMode(mode.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${getModeClasses()}`}
                  title={mode.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${getIconColorClass()}`} />
                  <span className="hidden sm:inline">{mode.label}</span>
                  <span className="sm:hidden">{mode.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Multi-LLM Model Switcher Dropdown */}
            <div className="relative" ref={modelMenuRef}>
              <button
                type="button"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-card hover:bg-muted/80 text-foreground border border-border/80 shadow-xs transition-all cursor-pointer select-none"
                title="AI 응답 엔진 모델 변경"
              >
                <activeModelObj.icon className="w-3.5 h-3.5 text-theme" />
                <span>{activeModelObj.name}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded border font-mono ${activeModelObj.badgeColor}`}>
                  {activeModelObj.badge}
                </span>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isModelMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isModelMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 z-50 w-72 p-2 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl space-y-1 text-xs select-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground border-b border-border/40 flex items-center justify-between">
                    <span>AI 모델 선택 (Multi-LLM)</span>
                    <span className="text-[10px] font-normal text-theme">OmniSeek AI Engine</span>
                  </div>
                  {AI_MODELS.map((model) => {
                    const Icon = model.icon;
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-theme/10 text-foreground border border-theme/30 font-semibold"
                            : "hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-transparent"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-theme text-white" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs truncate">{model.name}</span>
                            <span className={`px-1.5 py-0.2 text-[9px] rounded border font-mono shrink-0 ${model.badgeColor}`}>
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[10px] leading-tight text-muted-foreground/80 line-clamp-2">
                            {model.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add URL Link Direct Button */}
            <button
              type="button"
              onClick={handleAddUrlPrompt}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer select-none"
              title="특정 웹페이지 URL을 붙여넣어 실시간 본문 수집 및 웹 결합 분석을 수행합니다"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>웹 링크 결합</span>
            </button>

            {/* Copilot Refinement Toggle Button */}
            <button
              type="button"
              onClick={() => setIsCopilotMode(!isCopilotMode)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border cursor-pointer select-none ${
                isCopilotMode
                  ? "bg-gradient-to-r from-theme-from to-theme-to text-white border-transparent shadow-md shadow-theme-from/20"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
              }`}
              title="AI가 질문을 분석하여 맞춤형 질문 가이드를 구성합니다"
            >
              <Brain className={`w-3.5 h-3.5 ${isCopilotMode ? "animate-pulse text-cyan-300" : "text-muted-foreground"}`} />
              <span>Copilot 질문 가이드</span>
              {isCopilotMode && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              )}
            </button>

            {/* Pro / Deep Research Toggle Button */}
            <button
              type="button"
              onClick={() => setIsProMode(!isProMode)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border cursor-pointer select-none ${
                isProMode
                  ? "bg-gradient-to-r from-theme-from to-theme-to text-white border-transparent shadow-md shadow-theme-from/20"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isProMode ? "animate-pulse text-yellow-300" : "text-muted-foreground"}`} />
              <span>프로 / 심층 탐구</span>
              {isProMode && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
              )}
            </button>

            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={`p-2 rounded-xl transition cursor-pointer ${
                query.trim() && !isLoading
                  ? "bg-theme text-white hover:brightness-110 shadow-md shadow-theme/20"
                  : "bg-muted text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Keywords */}
      <div className="mt-10 w-full">
        <p className="text-xs font-semibold text-muted-foreground/75 mb-3 text-center">
          이런 질문은 어떠세요?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(item.text);
                  textareaRef.current?.focus();
                }}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border hover:shadow-sm text-left transition duration-200 group text-sm"
              >
                <div className="p-1.5 rounded-lg bg-theme/5 text-theme group-hover:bg-theme/10 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 font-medium text-foreground/80 group-hover:text-foreground">
                  {item.text}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

