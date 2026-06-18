"use client";

import React, { useRef, useEffect, useState } from "react";
import { UIMessage, isToolUIPart, getToolName } from "ai";
import { Search, Compass, Share2, CornerDownLeft, Sparkles, Globe, User, BookOpen, RefreshCw, Copy, Check, Menu, ArrowRight, FileText, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";

interface ChatInterfaceProps {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onReset: () => void;
  onOpenSidebar: () => void;
  focusMode: string;
  onSendFollowup: (question: string) => void;
  isProMode: boolean;
}

const parseMessageText = (text: string) => {
  const tagStart = text.indexOf("<followup>");
  if (tagStart === -1) {
    return { cleanText: text, followups: [] as string[] };
  }
  
  const cleanText = text.substring(0, tagStart).trim();
  const followupSection = text.substring(tagStart);
  
  const match = followupSection.match(/<followup>([\s\S]*?)(?:<\/followup>|$)/);
  const followupContent = match ? match[1] : "";
  
  const followups = followupContent
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*•\d+\.\s]+/, "").trim())
    .filter((line) => line.length > 0);
    
  return { cleanText, followups };
};

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
  focusMode,
  onSendFollowup,
  isProMode,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];
  const isSearching = isLoading && (lastMessage?.role === "user" || 
    (lastMessage?.role === "assistant" && lastMessage.parts?.some(part => isToolUIPart(part) && part.state !== "output-available" && part.state !== "output-error" && part.state !== "output-denied")));

  const lastMessageText = lastMessage?.parts
    ?.filter((p) => p.type === "text")
    .map((p: any) => p.text)
    .join("") || "";

  const isThinking = isLoading && (lastMessage?.role === "assistant" && 
    !lastMessageText && 
    !lastMessage.parts?.some(part => isToolUIPart(part) && part.state !== "output-available"));

  // Calculate search steps for Pro Mode
  const assistantSearchParts = lastMessage?.parts?.filter(
    (part) => isToolUIPart(part) && getToolName(part) === "searchWeb"
  ) || [];
  const completedSearchCount = assistantSearchParts.filter(
    (part) => isToolUIPart(part) && (part as any).state === "output-available"
  ).length;

  let searchLabel = "관련 정보 검색 중...";
  if (isProMode) {
    if (completedSearchCount === 0) {
      searchLabel = "⚡ 심층 탐구: 1단계 - 핵심 주제 웹 검색 및 관련 정보 수집 중...";
    } else if (completedSearchCount === 1) {
      searchLabel = "⚡ 심층 탐구: 2단계 - 관련 서브 주제 추가 탐색 및 출처 교차 분석 중...";
    } else {
      searchLabel = `⚡ 심층 탐구: ${completedSearchCount + 1}단계 - 추가 세부사항 탐색 및 자료 종합 중...`;
    }
  }

  let writingLabel = "답변 작성 중...";
  if (isProMode) {
    writingLabel = "⚡ 심층 탐구: 수집된 모든 웹 데이터를 종합하여 상세 심층 보고서 작성 중...";
  }

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleShare = async () => {
    if (messages.length === 0) return;

    // Build the share text in Markdown format
    let markdownText = `# 🔍 OmniSeek AI 검색 결과 공유\n\n`;

    messages.forEach((msg, idx) => {
      if (msg.role === "user") {
        const text = msg.parts
          ?.filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("") || "";
        markdownText += `### ❓ 질문\n> ${text}\n\n`;
      } else if (msg.role === "assistant") {
        const text = msg.parts
          ?.filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("") || "";
        
        markdownText += `### 🤖 AI 답변\n${text}\n\n`;

        // Include sources if any
        const searchPart = msg.parts?.find(
          (part) => isToolUIPart(part) && getToolName(part) === "searchWeb" && part.state === "output-available"
        );
        const sources = searchPart && "output" in searchPart ? (searchPart.output as any[]) : [];
        if (sources && sources.length > 0) {
          markdownText += `#### 🔗 참고 출처\n`;
          sources.forEach((src) => {
            markdownText += `- [${src.title}](${src.url}) (${src.site || new URL(src.url).hostname.replace("www.", "")})\n`;
          });
          markdownText += `\n`;
        }
      }
    });

    markdownText += `--- \n*공유됨: [OmniSeek AI](${window.location.origin})*`;

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: "OmniSeek AI 검색 결과",
          text: "OmniSeek AI에서 검색한 결과를 확인해 보세요.",
          url: window.location.href,
        });
        showToast("공유하기 완료!");
        return;
      } catch (err) {
        console.log("Web share failed/cancelled, falling back to clipboard copy", err);
      }
    }

    // Fallback Clipboard
    try {
      await navigator.clipboard.writeText(markdownText);
      showToast("대화 내용이 마크다운으로 복사되었습니다!");
    } catch (err) {
      console.error("Failed to copy share text: ", err);
      showToast("복사에 실패했습니다.");
    }
  };

  const handleExportMarkdown = () => {
    if (messages.length === 0) return;

    let markdownText = `# 🔍 OmniSeek AI 검색 결과\n\n`;

    messages.forEach((msg, idx) => {
      if (msg.role === "user") {
        const text = msg.parts
          ?.filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("") || "";
        markdownText += `## ❓ 질문\n> ${text}\n\n`;
      } else if (msg.role === "assistant") {
        const text = msg.parts
          ?.filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("") || "";
        
        const { cleanText } = parseMessageText(text);
        if (cleanText) {
          markdownText += `## 🤖 AI 답변\n${cleanText}\n\n`;
        }

        // Include sources if any
        const searchPart = msg.parts?.find(
          (part) => isToolUIPart(part) && getToolName(part) === "searchWeb" && part.state === "output-available"
        );
        const sources = searchPart && "output" in searchPart ? (searchPart.output as any[]) : [];
        if (sources && sources.length > 0) {
          markdownText += `### 🔗 참고 출처\n`;
          sources.forEach((src) => {
            markdownText += `- [${src.title}](${src.url}) (${src.site || new URL(src.url).hostname.replace("www.", "")})\n`;
          });
          markdownText += `\n`;
        }
      }
    });

    markdownText += `--- \n*생성됨: [OmniSeek AI](${window.location.origin})*`;

    try {
      const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      
      const firstUserMsg = messages.find((m) => m.role === "user");
      const firstQuery = firstUserMsg
        ? firstUserMsg.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("") || "search_result"
        : "search_result";
      
      const safeFilename = firstQuery
        .slice(0, 20)
        .replace(/[^a-zA-Z0-9가-힣\s]/g, "")
        .trim()
        .replace(/\s+/g, "_") || "omniseek_report";

      a.href = url;
      a.download = `${safeFilename}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("마크다운 파일 다운로드가 시작되었습니다.");
    } catch (err) {
      console.error("Failed to export Markdown: ", err);
      showToast("마크다운 내보내기에 실패했습니다.");
    }
  };

  const handleExportPDF = () => {
    if (messages.length === 0) return;

    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) {
      showToast("인쇄 영역을 찾을 수 없습니다.");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      showToast("PDF 인쇄창을 생성하지 못했습니다.");
      return;
    }

    const firstUserMsg = messages.find((m) => m.role === "user");
    const firstQuery = firstUserMsg
      ? firstUserMsg.parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("") || "OmniSeek AI 검색 결과"
      : "OmniSeek AI 검색 결과";

    let printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${firstQuery}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.7;
            color: #1f2937;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            background: #ffffff;
          }
          .header {
            margin-bottom: 40px;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
          }
          .brand {
            font-weight: 800;
            color: #2563eb;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          h1 {
            color: #111827;
            font-size: 28px;
            font-weight: 800;
            margin: 0 0 10px 0;
            line-height: 1.3;
          }
          .meta {
            font-size: 12px;
            color: #6b7280;
          }
          .message-pair {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .user-bubble {
            background-color: #f3f4f6;
            padding: 18px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            color: #111827;
            margin-bottom: 20px;
          }
          .assistant-bubble {
            padding: 0 4px;
          }
          .prose p {
            margin: 0 0 16px 0;
            color: #374151;
            font-size: 15px;
          }
          .prose h1, .prose h2, .prose h3 {
            color: #111827;
            font-weight: 700;
            margin: 24px 0 12px 0;
          }
          .prose h1 { font-size: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
          .prose h2 { font-size: 18px; }
          .prose h3 { font-size: 16px; }
          .prose ul, .prose ol {
            margin: 0 0 20px 0;
            padding-left: 24px;
          }
          .prose li {
            margin-bottom: 6px;
            color: #374151;
            font-size: 15px;
          }
          .prose pre {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
          }
          .prose code {
            font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
            background-color: #f1f5f9;
            color: #4f46e5;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 13.5px;
            font-weight: 600;
          }
          .prose pre code {
            background-color: transparent;
            color: #1e293b;
            padding: 0;
            border-radius: 0;
            font-size: 13px;
            font-weight: 400;
          }
          .prose table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
          }
          .prose th, .prose td {
            border: 1px solid #e2e8f0;
            padding: 10px 14px;
            text-align: left;
          }
          .prose th {
            background-color: #f8fafc;
            font-weight: 600;
            color: #1e293b;
          }
          .prose blockquote {
            border-left: 4px solid #cbd5e1;
            padding-left: 16px;
            margin: 20px 0;
            font-style: italic;
            color: #64748b;
          }
          .sources-box {
            background-color: #fafafa;
            border: 1px solid #eaeaea;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 24px;
          }
          .sources-header {
            font-size: 12px;
            font-weight: 700;
            color: #10b981;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: 0.05em;
          }
          .sources-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .source-link-card {
            font-size: 12.5px;
            color: #2563eb;
            text-decoration: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding: 6px;
            border-radius: 6px;
            background: #ffffff;
            border: 1px solid #f0f0f0;
          }
          .reasoning-box {
            background-color: #f9f8ff;
            border-left: 3px solid #8b5cf6;
            border-radius: 4px;
            padding: 12px 16px;
            font-size: 12.5px;
            color: #6d28d9;
            margin-bottom: 20px;
          }
          .reasoning-box strong {
            display: block;
            margin-bottom: 4px;
            color: #5b21b6;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #eaeaea;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
          @media print {
            body { margin: 20px auto; }
            .message-pair { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">🔍 OmniSeek AI Report</div>
          <h1>${firstQuery}</h1>
          <div class="meta">작성일시: ${new Date().toLocaleString("ko-KR")}</div>
        </div>
    `;

    const bubbles = messagesContainer.querySelectorAll(".message-bubble");
    bubbles.forEach((bubble) => {
      const role = bubble.getAttribute("data-role");
      if (role === "user") {
        const textElement = bubble.querySelector("p");
        if (textElement) {
          printHtml += `
            <div class="message-pair">
              <div class="user-bubble">
                ❓ 질문: ${textElement.innerText}
              </div>
          `;
        }
      } else if (role === "assistant") {
        printHtml += `<div class="assistant-bubble">`;

        const sourcesSection = bubble.querySelector(".grid");
        if (sourcesSection) {
          const links = sourcesSection.querySelectorAll("a");
          if (links.length > 0) {
            printHtml += `
              <div class="sources-box">
                <div class="sources-header">🔗 참고 출처 (${links.length}개)</div>
                <div class="sources-grid">
            `;
            links.forEach((link) => {
              const href = link.getAttribute("href") || "#";
              const title = link.querySelector(".truncate")?.textContent || link.textContent || "출처 링크";
              printHtml += `<a href="${href}" target="_blank" class="source-link-card">${title}</a>`;
            });
            printHtml += `
                </div>
              </div>
            `;
          }
        }

        const reasoningSection = bubble.querySelector(".border-l-2");
        if (reasoningSection) {
          const reasoningText = reasoningSection.textContent?.replace("AI 생각 흐름:", "").trim();
          if (reasoningText) {
            printHtml += `
              <div class="reasoning-box">
                <strong>💡 AI 사고 흐름 (Reasoning)</strong>
                ${reasoningText}
              </div>
            `;
          }
        }

        const proseSection = bubble.querySelector(".prose");
        if (proseSection) {
          const cleanProse = proseSection.cloneNode(true) as HTMLElement;
          cleanProse.querySelectorAll("button").forEach(btn => btn.remove());
          
          printHtml += `
              <div class="prose">
                ${cleanProse.innerHTML}
              </div>
            </div>
          </div>
          `;
        } else {
          printHtml += `</div></div>`;
        }
      }
    });

    printHtml += `
        <div class="footer">
          본 보고서는 OmniSeek AI에 의해 실시간 웹 지식을 토대로 생성되었습니다.<br>
          © ${new Date().getFullYear()} OmniSeek AI. All rights reserved.
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(printHtml);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // Auto-scroll to bottom of chat when messages update
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
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
      <header className="relative flex items-center justify-between py-3 border-b border-border mb-4">
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
          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
            {focusMode === "all" && "🌐 전체 웹 검색"}
            {focusMode === "academic" && "🎓 학술 자료 검색"}
            {focusMode === "code" && "💻 코드/개발 검색"}
            {focusMode === "social" && "📱 소셜/유튜브 검색"}
          </span>
          {isProMode && (
            <span className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm shadow-indigo-500/15 animate-fade-in select-none">
              <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300 animate-pulse animate-duration-1000" />
              <span>프로 / 심층 탐구</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border bg-card transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새 검색</span>
          </button>
          <button 
            onClick={handleShare}
            disabled={messages.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs transition ${
              messages.length === 0 
                ? "text-muted-foreground/35 cursor-not-allowed" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
            title="링크 복사 및 공유하기"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">공유</span>
          </button>
          
          <button 
            onClick={handleExportPDF}
            disabled={messages.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs transition ${
              messages.length === 0 
                ? "text-muted-foreground/35 cursor-not-allowed" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
            title="PDF 보고서 인쇄 및 내보내기"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">PDF</span>
          </button>

          <button 
            onClick={handleExportMarkdown}
            disabled={messages.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs transition ${
              messages.length === 0 
                ? "text-muted-foreground/35 cursor-not-allowed" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
            title="Markdown 파일 다운로드"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium font-sans">MD</span>
          </button>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] overflow-hidden bg-blue-500/10">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out"
              style={{
                width: isSearching ? "35%" : isThinking ? "75%" : "100%"
              }}
            />
          </div>
        )}
      </header>

      {/* Main Conversation Messages View */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto pr-2 space-y-8 py-4"
      >
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const searchParts = message.parts?.filter(
            (part) => isToolUIPart(part) && getToolName(part) === "searchWeb" && part.state === "output-available"
          ) || [];
          const rawSources = searchParts.flatMap((part) => ("output" in part ? (part.output as any[]) : []));
          const uniqueUrls = new Set();
          const sources = rawSources.filter((src) => {
            if (src && src.url && !uniqueUrls.has(src.url)) {
              uniqueUrls.add(src.url);
              return true;
            }
            return false;
          });

          // Extract followups
          const messageText = message.parts
            ?.filter((p) => p.type === "text")
            .map((p: any) => p.text)
            .join("") || "";
          const { followups } = parseMessageText(messageText);

          return (
            <div key={message.id || index} className="flex flex-col gap-3 message-bubble" data-role={message.role}>
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
                            const { cleanText } = parseMessageText(part.text);
                            if (!cleanText) return null;
                            return (
                              <ReactMarkdown
                                key={pIdx}
                                remarkPlugins={[remarkGfm]}
                                components={MARKDOWN_COMPONENTS}
                              >
                                {cleanText}
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

                    {/* Suggested follow-up questions */}
                    {!isLoading && index === messages.length - 1 && followups.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="mt-6 pt-4 border-t border-border/40 space-y-3"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          <span>추천 후속 질문</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {followups.map((q, qIdx) => (
                            <motion.button
                              key={qIdx}
                              whileHover={{ scale: 1.005, x: 4 }}
                              whileTap={{ scale: 0.995 }}
                              onClick={() => onSendFollowup(q)}
                              className="flex items-center justify-between text-left text-sm py-2.5 px-4 rounded-xl border border-border/60 bg-card hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer shadow-sm group font-medium"
                            >
                              <span>{q}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-indigo-500/80 group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ml-2" />
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading / Searching Steps Indicator with Premium Skeleton UI */}
        {isLoading && (isSearching || isThinking) && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Sender Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground/80">
              <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>AI 답변</span>
            </div>

            {/* Content Box */}
            <div className="space-y-6">
              {/* 1. Web Search Sources Skeleton (only during isSearching) */}
              {isSearching ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-blue-500 font-semibold animate-pulse">
                    <Search className="w-3.5 h-3.5 animate-spin" />
                    <span>{searchLabel}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-[68px] rounded-xl border border-border/50 bg-card p-3 flex flex-col justify-between animate-pulse"
                      >
                        <div className="h-3 bg-muted rounded w-11/12" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 2. Text Response Skeleton (during isSearching or isThinking) */}
              <div className="space-y-3.5">
                {isThinking && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>{writingLabel}</span>
                  </div>
                )}
                <div className="space-y-2.5 animate-pulse max-w-2xl">
                  <div className="h-4 bg-muted rounded-md w-11/12" />
                  <div className="h-4 bg-muted rounded-md w-full" />
                  <div className="h-4 bg-muted rounded-md w-8/12" />
                </div>
              </div>
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border border-border/80 bg-card text-foreground text-xs font-semibold shadow-xl flex items-center gap-2 max-w-sm w-auto text-center"
          >
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
