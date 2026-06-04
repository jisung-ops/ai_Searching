"use client";

import React, { useRef, useEffect, useState } from "react";
import { UIMessage, isToolUIPart, getToolName } from "ai";
import { Search, Compass, Share2, CornerDownLeft, Sparkles, Globe, User, BookOpen, RefreshCw, Copy, Check, Menu } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatInterfaceProps {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onReset: () => void;
  onOpenSidebar: () => void;
}

// Standalone CodeBlock component to prevent unmounting and state loss during streaming
interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
}

const CodeBlock = ({ className, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, "");
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (match) {
    return (
      <div className="relative group my-4 rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/60 text-xs font-mono text-muted-foreground border-b border-border/60">
          <span className="font-semibold text-foreground/75 uppercase">{language}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors px-1.5 py-1 rounded bg-muted/80 hover:bg-muted font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>코드 복사</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-muted/20 text-foreground/90 max-w-full">
          <code className={className}>{children}</code>
        </pre>
      </div>
    );
  }

  return (
    <code className="bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
      {children}
    </code>
  );
};

const MARKDOWN_COMPONENTS = {
  code: ({ className, children, ...props }: any) => (
    <CodeBlock className={className} {...props}>
      {children}
    </CodeBlock>
  ),
  h1: ({ children }: any) => <h1 className="text-xl font-bold mt-6 mb-2 border-b pb-1 text-foreground">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold mt-5 mb-2 text-foreground">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-bold mt-4 mb-1.5 text-foreground">{children}</h3>,
  p: ({ children }: any) => <p className="mb-3.5 leading-7 text-foreground/90 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3.5 space-y-1 text-foreground/90">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3.5 space-y-1 text-foreground/90">{children}</ol>,
  li: ({ children }: any) => <li className="leading-7">{children}</li>,
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:text-blue-600 underline font-medium transition-colors"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-4">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-border bg-card">{children}</tbody>,
  tr: ({ children }: any) => <tr>{children}</tr>,
  th: ({ children }: any) => <th className="px-4 py-2 text-left font-semibold text-foreground">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-2 text-foreground/80">{children}</td>,
};

export default function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onReset,
  onOpenSidebar,
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
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition md:hidden"
            aria-label="메뉴 열기"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
          <span
            onClick={onReset}
            className="text-lg font-bold cursor-pointer hover:opacity-80 transition bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300"
          >
            AI Searching
          </span>
          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
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
          const searchPart = message.parts?.find(
            (part) => isToolUIPart(part) && getToolName(part) === "searchWeb" && part.state === "output-available"
          );
          const sources = searchPart && "output" in searchPart ? (searchPart.output as any[]) : [];

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
                    {message.parts
                      .filter((p) => p.type === "text")
                      .map((p: any) => p.text)
                      .join("")}
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Render dynamic web search sources above the AI Response */}
                    {sources && sources.length > 0 && (
                      <div className="space-y-2.5 animate-fade-in">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                          <span>참고한 출처 ({sources.length}개)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted hover:border-border hover:shadow-sm transition text-left group"
                            >
                              <div className="text-xs font-medium text-foreground truncate group-hover:text-blue-500" title={src.title}>
                                {src.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5 text-blue-500" />
                                <span className="truncate">{src.site || new URL(src.url).hostname.replace("www.", "")}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI streamed answer content with markdown rendering */}
                    <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/90 leading-7">
                      {message.parts && message.parts.length > 0 &&
                        message.parts.map((part, pIdx) => {
                          if (part.type === "text") {
                            return (
                              <ReactMarkdown
                                key={pIdx}
                                remarkPlugins={[remarkGfm]}
                                components={MARKDOWN_COMPONENTS}
                              >
                                {part.text}
                              </ReactMarkdown>
                            );
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
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading / Searching Steps Indicator */}
        {(() => {
          const lastMessage = messages[messages.length - 1];
          if (!isLoading) return null;

          const isSearching = lastMessage?.role === "user" || 
            (lastMessage?.role === "assistant" && lastMessage.parts?.some(part => isToolUIPart(part) && part.state !== "output-available" && part.state !== "output-error" && part.state !== "output-denied"));

          const lastMessageText = lastMessage?.parts
            .filter((p) => p.type === "text")
            .map((p: any) => p.text)
            .join("");

          const isThinking = lastMessage?.role === "assistant" && 
            !lastMessageText && 
            !lastMessage.parts?.some(part => isToolUIPart(part) && part.state !== "output-available");

          return (
            <div className="flex flex-col gap-4">
              {isSearching && (
                <div className="flex items-center gap-3 text-xs text-blue-500 font-semibold animate-pulse">
                  <Search className="w-4 h-4 animate-spin" />
                  <span>관련 정보 검색 중...</span>
                </div>
              )}
              
              {isThinking && (
                <div className="flex items-center gap-1 text-muted-foreground p-3 rounded-xl bg-card border border-border w-24">
                  <span className="text-xs font-medium mr-1.5">답변 준비</span>
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-dot-1" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-dot-2" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-dot-3" />
                </div>
              )}
            </div>
          );
        })()}
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
