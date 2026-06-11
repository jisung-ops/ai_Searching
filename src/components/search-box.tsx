"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search, Globe, GraduationCap, Code, Users, Sparkles, Compass, Lightbulb } from "lucide-react";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  focusMode: string;
  setFocusMode: (mode: string) => void;
}

const SUGGESTIONS = [
  { text: "Next.js 15 App Router의 주요 변경점", icon: Sparkles },
  { text: "초전도체의 정의와 최근 연구 현황", icon: Globe },
  { text: "양자 컴퓨터의 동작 원리 쉽게 설명해줘", icon: Compass },
  { text: "개발 생산성을 높여주는 최고의 AI 도구들", icon: Lightbulb },
];

const FOCUS_MODES = [
  { id: "all", label: "전체 웹", icon: Globe, desc: "모든 웹사이트 검색" },
  { id: "academic", label: "학술 자료", icon: GraduationCap, desc: "논문, 학계 자료 및 위키백과 검색" },
  { id: "code", label: "코드/개발", icon: Code, desc: "GitHub, StackOverflow 등 개발 기술 사이트 검색" },
  { id: "social", label: "소셜/유튜브", icon: Users, desc: "Reddit, 유튜브 등 소셜 커뮤니티 검색" },
];

export default function SearchBox({ onSearch, isLoading = false, focusMode, setFocusMode }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
          AI Searching
        </h1>
        <p className="text-sm text-muted-foreground">
          웹의 실시간 지식을 지능적으로 검색하고 요약하여 답합니다
        </p>
      </div>

      {/* Main Search Input Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full relative bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 overflow-hidden"
      >
        <div className="p-4 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 것을 질문해 보세요..."
            className="w-full bg-transparent outline-none resize-none border-none text-foreground placeholder:text-muted-foreground/70 pr-12 min-h-[44px] max-h-[200px]"
            style={{ height: "auto" }}
          />
        </div>

        {/* Action Bar inside search box with Focus Selector */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {FOCUS_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = focusMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFocusMode(mode.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm"
                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  title={mode.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-blue-500" : ""}`} />
                  <span className="hidden sm:inline">{mode.label}</span>
                  <span className="sm:hidden">{mode.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={`p-2 rounded-xl transition cursor-pointer ${
              query.trim() && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                : "bg-muted text-muted-foreground/50 cursor-not-allowed"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
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
                <div className="p-1.5 rounded-lg bg-blue-500/5 text-blue-500 group-hover:bg-blue-500/10 transition-colors">
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
