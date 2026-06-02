"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search, Globe, Sparkles, Compass, Lightbulb } from "lucide-react";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const SUGGESTIONS = [
  { text: "Next.js 15 App Router의 주요 변경점", icon: Sparkles },
  { text: "초전도체의 정의와 최근 연구 현황", icon: Globe },
  { text: "양자 컴퓨터의 동작 원리 쉽게 설명해줘", icon: Compass },
  { text: "개발 생산성을 높여주는 최고의 AI 도구들", icon: Lightbulb },
];

export default function SearchBox({ onSearch, isLoading = false }: SearchBoxProps) {
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

        {/* Action Bar inside search box */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-muted transition"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>실시간 검색</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-muted transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>심층 분석</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={`p-2 rounded-xl transition ${
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
