"use client";

import React, { useRef, useEffect } from "react";
import { UIMessage } from "ai";
import { Search, Compass, Share2, CornerDownLeft, Sparkles, Globe, User, BookOpen, RefreshCw } from "lucide-react";

interface ChatInterfaceProps {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onReset: () => void;
}

// Mock search sources to make it look like a real search engine
const MOCK_SOURCES = [
  { title: "Next.js 공식 문서 - App Router 개요", url: "https://nextjs.org/docs", site: "nextjs.org" },
  { title: "Tailwind CSS v4.0 신기능 핵심 요약 및 리뷰", url: "https://tailwindcss.com", site: "tailwindcss.com" },
  { title: "Vercel AI SDK로 Next.js에 LLM 연동하기", url: "https://sdk.vercel.ai", site: "vercel.ai" },
  { title: "React 19 Server Components 이해하기", url: "https://react.dev", site: "react.dev" },
];

export default function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onReset,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Handle textarea height adjustment
  const handleInputHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = textareaRef.current?.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen max-w-4xl mx-auto w-full px-4 md:px-8 py-4">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between py-3 border-b border-border mb-4">
        <div className="flex items-center gap-3">
          <span
            onClick={onReset}
            className="text-lg font-bold cursor-pointer hover:opacity-80 transition bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300"
          >
            AI Searching
          </span>
          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
            Search Engine Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border bg-card transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새 검색</span>
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Conversation Messages View */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-4">
        {messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <div key={message.id || index} className="flex flex-col gap-3">
              {/* Sender Indicator */}
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground/80">
                {isUser ? (
                  <>
                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span>나의 질문</span>
                  </>
                ) : (
                  <>
                    <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span>AI 답변</span>
                  </>
                )}
              </div>

              {/* Message Content */}
              <div className={`text-base leading-7 text-foreground ${isUser ? "font-semibold text-lg" : ""}`}>
                {isUser ? (
                  <p className="whitespace-pre-wrap">
                    {message.content || (message.parts
                      ?.filter((p) => p.type === "text")
                      .map((p: any) => p.text)
                      .join(""))}
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Render Mock Sources above the AI Response (similar to Perplexity) */}
                    {index === 1 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                          <span>참고한 출처</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {MOCK_SOURCES.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted hover:border-border hover:shadow-sm transition text-left group"
                            >
                              <div className="text-xs font-medium text-foreground truncate group-hover:text-blue-500">
                                {src.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                <span>{src.site}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI streamed answer content */}
                    <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">
                      {message.parts && message.parts.length > 0 ? (
                        message.parts.map((part, pIdx) => {
                          if (part.type === "text") {
                            return <span key={pIdx}>{part.text}</span>;
                          }
                          if (part.type === "reasoning") {
                            return (
                              <div key={pIdx} className="text-xs text-muted-foreground/80 bg-muted/40 p-3.5 rounded-xl my-3.5 border-l-2 border-indigo-500/50">
                                <span className="font-semibold block mb-1 text-indigo-500 dark:text-indigo-400">AI 생각 흐름:</span>
                                {part.text}
                              </div>
                            );
                          }
                          return null;
                        })
                      ) : (
                        <span>{message.content}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading / Searching Steps Indicator */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex flex-col gap-4">
            {/* Search steps simulation */}
            <div className="flex items-center gap-3 text-xs text-blue-500 font-semibold animate-pulse">
              <Search className="w-4 h-4 animate-spin" />
              <span>관련 정보 검색 중...</span>
            </div>
            
            {/* Thinking / Streaming loader */}
            <div className="flex items-center gap-1 text-muted-foreground p-3 rounded-xl bg-card border border-border w-24">
              <span className="text-xs font-medium mr-1.5">답변 준비</span>
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-dot-1" />
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-dot-2" />
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-dot-3" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Bottom Sticky Input Area */}
      <footer className="mt-auto pt-4 border-t border-border">
        <form
          onSubmit={handleSubmit}
          className="relative bg-card border border-border rounded-xl shadow-md transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 overflow-hidden"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onInput={handleInputHeight}
            onKeyDown={handleKeyDown}
            placeholder="후속 질문을 입력해 보세요..."
            className="w-full bg-transparent outline-none resize-none border-none text-foreground placeholder:text-muted-foreground/60 p-3.5 pr-14 min-h-[50px] max-h-[150px] text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 bottom-3 p-1.5 rounded-lg transition ${
              input.trim() && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
            }`}
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2.5">
          AI Searching은 웹 검색 결과를 토대로 답변하므로 간혹 부정확한 정보가 포함될 수 있습니다.
        </p>
      </footer>
    </div>
  );
}
