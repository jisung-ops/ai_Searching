"use client";

import React, { useRef, useEffect, useState } from "react";
import { UIMessage, isToolUIPart, getToolName } from "ai";
import { Search, Compass, Share2, CornerDownLeft, Sparkles, Globe, User, BookOpen, RefreshCw, Copy, Check, Menu, ArrowRight, FileText, FileDown, Image as ImageIcon, ChevronLeft, ChevronRight, X, ExternalLink, Play, ZoomIn, ZoomOut, RotateCw, PlayCircle, PauseCircle, Info, Download } from "lucide-react";
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
    return { cleanText: text, followups: [] as { text: string; category: string }[] };
  }
  
  const cleanText = text.substring(0, tagStart).trim();
  const followupSection = text.substring(tagStart);
  
  const match = followupSection.match(/<followup>([\s\S]*?)(?:<\/followup>|$)/);
  const followupContent = match ? match[1] : "";
  
  const rawLines = followupContent
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*•\d+\.\s]+/, "").trim())
    .filter((line) => line.length > 0);

  const followups = rawLines.map((line) => {
    const categoryMatch = line.match(/^\[(concept|apply|warning|general)\]\s*(.*)/i);
    if (categoryMatch) {
      return {
        category: categoryMatch[1].toLowerCase(),
        text: categoryMatch[2].trim()
      };
    }
    return {
      category: "general",
      text: line
    };
  });
    
  return { cleanText, followups };
};

const getCategoryInfo = (category: string) => {
  switch (category) {
    case "concept":
      return {
        label: "💡 심화 개념",
        badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 dark:border-blue-400/10",
        buttonHoverStyle: "hover:bg-blue-500/5 dark:hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400",
        arrowHoverColor: "group-hover:text-blue-500/80"
      };
    case "apply":
      return {
        label: "🛠️ 실무 적용",
        badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-400/10",
        buttonHoverStyle: "hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400",
        arrowHoverColor: "group-hover:text-emerald-500/80"
      };
    case "warning":
      return {
        label: "⚠️ 주의 사항",
        badgeStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10 dark:border-amber-400/10",
        buttonHoverStyle: "hover:bg-amber-500/5 dark:hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400",
        arrowHoverColor: "group-hover:text-amber-500/80"
      };
    default:
      return {
        label: "🔍 일반",
        badgeStyle: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/10 dark:border-zinc-400/10",
        buttonHoverStyle: "hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400",
        arrowHoverColor: "group-hover:text-indigo-500/80"
      };
  }
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

interface CitationTooltipProps {
  source: {
    title: string;
    url: string;
    content?: string;
    site?: string;
  };
  index: number;
  href: string;
}

const CitationTooltip = ({ source, index, href }: CitationTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const domain = source.site || new URL(source.url).hostname.replace("www.", "");
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-4.5 h-4.5 ml-1 mr-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-400/10 dark:hover:bg-blue-400/20 border border-blue-500/15 dark:border-blue-400/15 rounded-full transition align-super cursor-pointer shadow-sm active:scale-95 font-sans"
        onClick={(e) => {
          // Normal click opens the link
        }}
      >
        {index}
      </a>

      <AnimatePresence>
        {isVisible && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 md:w-80 p-3.5 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl text-foreground text-xs leading-normal select-none pointer-events-auto flex flex-col gap-2 cursor-default"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header: domain info */}
            <span className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
                <img
                  src={faviconUrl}
                  alt={domain}
                  className="w-3.5 h-3.5 rounded-sm bg-white dark:bg-transparent shrink-0"
                  onError={(e) => {
                    // Hide if failed to load
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="truncate max-w-[150px] font-medium text-[11px] text-muted-foreground">
                  {domain}
                </span>
              </span>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 px-1.5 py-0.5 rounded font-mono">
                출처 [{index}]
              </span>
            </span>

            {/* Title */}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 text-[13px] leading-snug transition-colors line-clamp-2"
            >
              {source.title}
            </a>

            {/* Snippet / Content */}
            {source.content && (
              <span className="block text-muted-foreground text-[11px] leading-relaxed line-clamp-3 font-normal">
                {source.content}
              </span>
            )}

            {/* Footer button link */}
            <span className="flex items-center justify-end mt-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-2.5 py-1.5 rounded-lg transition shadow-sm active:scale-95 cursor-pointer"
              >
                <span>웹사이트 방문</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </span>

            {/* Arrow helper pointing to the badge */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-card/95 drop-shadow-[0_4px_4px_rgba(0,0,0,0.05)] pointer-events-none" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

const injectCitationLinks = (text: string, sources: any[]) => {
  if (!sources || sources.length === 0) return text;

  return text.replace(/\[(\d+)\]/g, (match, numStr) => {
    const index = parseInt(numStr, 10);
    const source = sources[index - 1];
    if (source && source.url) {
      return `[${index}](${source.url})`;
    }
    return match;
  });
};

const createMarkdownComponents = (sources: any[]) => {
  return {
    ...MARKDOWN_COMPONENTS,
    a: ({ href, children }: any) => {
      const text = String(children).trim();
      const isCitation = /^\d+$/.test(text);

      if (isCitation) {
        const index = parseInt(text, 10);
        let source = sources[index - 1];
        if (!source && href) {
          source = sources.find((s) => s.url === href);
        }

        if (source) {
          return <CitationTooltip source={source} index={index} href={href} />;
        }
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 underline font-medium transition-colors"
        >
          {children}
        </a>
      );
    },
  };
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

interface MediaItem {
  type: "image" | "video";
  url: string; // image thumbnail or source image URL
  videoUrl?: string; // YouTube/Vimeo video watch URL
  embedUrl?: string; // YouTube/Vimeo embed player URL
  description: string;
  title?: string;
  duration?: string;
  site?: string;
}

const ImageWithSkeleton = ({ 
  item, 
  onClick, 
  isMoreOverlay, 
  moreCount 
}: { 
  item: MediaItem; 
  onClick: () => void; 
  isMoreOverlay?: boolean; 
  moreCount?: number 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="relative aspect-video rounded-xl border border-border/50 bg-muted/30 overflow-hidden cursor-pointer group shadow-sm select-none"
    >
      {/* Skeleton screen */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
        </div>
      )}
      
      {/* Actual Image */}
      <img
        src={item.url}
        alt={item.description || item.title || "미디어"}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Video Overlay Play Indicator */}
      {item.type === "video" && isLoaded && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-colors group-hover:bg-black/35">
          <div className="p-2.5 rounded-full bg-white/90 text-black shadow-lg transition-transform duration-300 group-hover:scale-110 active:scale-95 flex items-center justify-center">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Video Duration Badge */}
      {item.type === "video" && item.duration && isLoaded && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 text-[10px] text-white font-mono font-semibold tracking-wider">
          {item.duration}
        </span>
      )}

      {/* blur overlay if last image */}
      {isMoreOverlay && moreCount && moreCount > 0 && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-colors group-hover:bg-black/50">
          <span className="text-lg font-bold">+{moreCount}</span>
          <span className="text-[10px] text-white/80 font-medium">더보기</span>
        </div>
      )}

      {/* Hover Glassmorphism Info Overlay (only if not 'more' overlay and not video) */}
      {!isMoreOverlay && item.type !== "video" && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="text-[10px] text-white truncate font-medium">
            {item.title || item.description || "이미지 보기"}
          </p>
        </div>
      )}
    </div>
  );
};

const MediaGallery = ({ 
  media, 
  onMediaClick 
}: { 
  media: MediaItem[]; 
  onMediaClick: (idx: number) => void 
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video">("all");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!media || media.length === 0) return null;

  // Filter media based on active tab
  const filteredMedia = media.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  const imagesCount = media.filter((m) => m.type === "image").length;
  const videosCount = media.filter((m) => m.type === "video").length;

  // Show up to 4 items in standard grid view
  const displayItems = filteredMedia.slice(0, 4);
  const remainingCount = filteredMedia.length - 3; 

  const colClass = 
    displayItems.length === 1 
      ? "grid-cols-1 max-w-md" 
      : displayItems.length === 2 
        ? "grid-cols-2 max-w-2xl" 
        : displayItems.length === 3 
          ? "grid-cols-3" 
          : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className="space-y-3.5 animate-fade-in my-5 p-4.5 rounded-2xl border border-border/50 bg-muted/20">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border/40">
        <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
          <span>관련 미디어 ({media.length}개)</span>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/65 text-[11px] w-fit border border-border/20">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            전체 ({media.length})
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === "image"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            이미지 ({imagesCount})
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === "video"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            동영상 ({videosCount})
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground bg-card/40 rounded-xl border border-dashed border-border/60">
          해당 타입의 미디어가 존재하지 않습니다.
        </div>
      ) : (
        <div className={`grid gap-2.5 ${colClass}`}>
          {displayItems.map((item, idx) => {
            const isLast = idx === 3 && filteredMedia.length > 4;
            const originalIndex = media.findIndex((m) => m.url === item.url && m.videoUrl === item.videoUrl);

            return (
              <ImageWithSkeleton
                key={idx}
                item={item}
                onClick={() => onMediaClick(originalIndex)}
                isMoreOverlay={isLast}
                moreCount={isLast ? remainingCount : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Expand trigger button */}
      {media.length > 4 && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline transition cursor-pointer"
          >
            <span>미디어 전체 보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Full Grid Overlay Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-card border border-border/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4.5 h-4.5 text-blue-500" />
                  <h3 className="font-bold text-base text-foreground">미디어 갤러리 전체 보기</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
                    {media.length}개
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Body (Scrollable Grid) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Image Grid */}
                {imagesCount > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">이미지 ({imagesCount})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {media
                        .filter((m) => m.type === "image")
                        .map((item) => {
                          const originalIndex = media.findIndex((m) => m.url === item.url);
                          return (
                            <ImageWithSkeleton
                              key={item.url}
                              item={item}
                              onClick={() => {
                                setIsExpanded(false);
                                onMediaClick(originalIndex);
                              }}
                            />
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Video Grid */}
                {videosCount > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">동영상 ({videosCount})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {media
                        .filter((m) => m.type === "video")
                        .map((item) => {
                          const originalIndex = media.findIndex((m) => m.url === item.url && m.videoUrl === item.videoUrl);
                          return (
                            <ImageWithSkeleton
                              key={item.url}
                              item={item}
                              onClick={() => {
                                setIsExpanded(false);
                                onMediaClick(originalIndex);
                              }}
                            />
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface LightboxProps {
  media: MediaItem[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (idx: number) => void;
}

const Lightbox = ({ media, activeIndex, onClose, onPrev, onNext, onSelectIndex }: LightboxProps) => {
  const currentItem = media[activeIndex];
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [localToast, setLocalToast] = useState<string | null>(null);

  // Reset controls on index change
  useEffect(() => {
    setScale(1);
    setRotate(0);
    setIsVideoLoading(true);
  }, [activeIndex]);

  // Slideshow interval handler
  useEffect(() => {
    if (!isSlideshowRunning) return;
    const interval = setInterval(() => {
      onNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [isSlideshowRunning, onNext]);

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrev, onNext, onClose]);

  // Toast auto-clear
  useEffect(() => {
    if (!localToast) return;
    const timer = setTimeout(() => setLocalToast(null), 2000);
    return () => clearTimeout(timer);
  }, [localToast]);

  if (!currentItem) return null;

  const isVideo = currentItem.type === "video";
  const domain = currentItem.site || (currentItem.videoUrl ? new URL(currentItem.videoUrl).hostname.replace("www.", "") : new URL(currentItem.url).hostname.replace("www.", ""));

  const handleDownload = async () => {
    if (isVideo && currentItem.videoUrl) {
      window.open(currentItem.videoUrl, "_blank");
      return;
    }

    try {
      setLocalToast("다운로드 시작 중...");
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = blobUrl;
      const filename = currentItem.title || currentItem.description || "image";
      const cleanFilename = filename.slice(0, 20).replace(/[^a-zA-Z0-9가-힣\s]/g, "").trim().replace(/\s+/g, "_") || "download";
      a.download = `${cleanFilename}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setLocalToast("다운로드 완료!");
    } catch (err) {
      console.error("Failed directly fetch image download:", err);
      window.open(currentItem.url, "_blank");
      setLocalToast("새 탭에서 원본을 열었습니다.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentItem.videoUrl || currentItem.url);
      setLocalToast("링크 주소가 복사되었습니다!");
    } catch (err) {
      console.error(err);
      setLocalToast("복사에 실패했습니다.");
    }
  };

  const handleShare = async () => {
    const shareUrl = currentItem.videoUrl || currentItem.url;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItem.title || "OmniSeek AI 미디어",
          text: currentItem.description || "",
          url: shareUrl,
        });
        setLocalToast("공유하기 완료!");
      } catch (err) {
        console.log("Share failed", err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-lg select-none text-white"
    >
      {/* Top Header Panel */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent text-white z-10">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold tracking-wider font-mono text-white/70">
            {isVideo ? "동영상" : "이미지"} 뷰어 ({activeIndex + 1} / {media.length})
          </span>
          {currentItem.title && (
            <span className="text-xs text-white/50 max-w-[200px] sm:max-w-md truncate font-medium">
              {currentItem.title}
            </span>
          )}
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Slideshow toggler */}
          {media.length > 1 && (
            <button
              onClick={() => setIsSlideshowRunning(!isSlideshowRunning)}
              className={`p-2 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1 text-xs cursor-pointer ${
                isSlideshowRunning ? "text-blue-400 bg-white/5 font-semibold" : "text-white/70"
              }`}
              title={isSlideshowRunning ? "슬라이드쇼 정지" : "슬라이드쇼 시작"}
            >
              {isSlideshowRunning ? <PauseCircle className="w-4.5 h-4.5 animate-pulse" /> : <PlayCircle className="w-4.5 h-4.5" />}
              <span className="hidden sm:inline">슬라이드쇼</span>
            </button>
          )}

          {/* Zoom & Rotation Controls (Image only) */}
          {!isVideo && (
            <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                title="축소"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setScale(1); setRotate(0); }}
                className="px-2 py-1 text-[10px] font-semibold text-white/60 hover:text-white hover:bg-white/10 rounded transition-all font-mono cursor-pointer"
                title="리셋"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                title="확대"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotate((r) => r + 90)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                title="90도 회전"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Action buttons */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer flex items-center justify-center"
            title={isVideo ? "비디오 원본보기" : "다운로드"}
          >
            <Download className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer flex items-center justify-center"
            title="공유"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            className={`p-2 rounded-xl hover:bg-white/10 transition cursor-pointer flex items-center justify-center ${
              isInfoOpen ? "text-blue-400 bg-white/5" : "text-white/80 hover:text-white"
            }`}
            title="상세 정보"
          >
            <Info className="w-4.5 h-4.5" />
          </button>
          <div className="w-px h-5 bg-white/15 mx-1" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer flex items-center justify-center border border-white/10 bg-white/5"
            title="닫기 (Esc)"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Main Slider Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Prev Button */}
        {media.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition z-20 active:scale-95 cursor-pointer flex items-center justify-center"
            title="이전 이미지 (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Display Wrapper */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-w-full max-h-[60vh] md:max-h-[65vh] flex items-center justify-center"
              style={{
                transform: !isVideo ? `scale(${scale}) rotate(${rotate}deg)` : undefined,
                transition: "transform 0.15s ease-out"
              }}
            >
              {isVideo && currentItem.embedUrl ? (
                <div className="relative aspect-video w-[80vw] max-w-[720px] rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl">
                  {isVideoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                        <span className="text-xs text-muted-foreground/80 font-medium">동영상 재생 로딩 중...</span>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={currentItem.embedUrl}
                    title={currentItem.title || "동영상 재생"}
                    onLoad={() => setIsVideoLoading(false)}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={currentItem.url}
                  alt={currentItem.description || "확대 이미지"}
                  className="max-w-[85vw] max-h-[60vh] md:max-h-[65vh] object-contain rounded-xl shadow-2xl select-none pointer-events-none"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next Button */}
        {media.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition z-20 active:scale-95 cursor-pointer flex items-center justify-center"
            title="다음 이미지 (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Details Sidebar Panel */}
        <AnimatePresence>
          {isInfoOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute md:relative right-0 top-0 bottom-0 z-30 w-72 md:w-80 bg-zinc-950/85 backdrop-blur-xl border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span>상세 정보</span>
                  </h4>
                  <button
                    onClick={() => setIsInfoOpen(false)}
                    className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Title */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">제목</span>
                    <p className="font-semibold text-white/90 text-sm leading-snug">
                      {currentItem.title || currentItem.description || "제목 없음"}
                    </p>
                  </div>

                  {/* Description */}
                  {currentItem.description && currentItem.title && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">설명</span>
                      <p className="text-white/70 leading-relaxed max-h-48 overflow-y-auto scrollbar-thin">
                        {currentItem.description}
                      </p>
                    </div>
                  )}

                  {/* Format & Duration */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">유형</span>
                      <p className="font-medium text-white/80">
                        {isVideo ? "동영상" : "이미지"}
                      </p>
                    </div>
                    {isVideo && currentItem.duration && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">길이</span>
                        <p className="font-medium text-white/80 font-mono">
                          {currentItem.duration}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Site Source */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">웹 소스</span>
                    <div className="flex items-center gap-1.5 font-medium text-blue-400">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="truncate">{domain}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action button inside panel */}
              <div className="pt-4 border-t border-white/10">
                <a
                  href={currentItem.videoUrl || currentItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-lg active:scale-95 cursor-pointer font-sans"
                >
                  <span>원본 웹사이트 방문</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Panel with Description & Thumbnails */}
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-6 pb-4.5 px-4 flex flex-col gap-3.5 items-center z-10 w-full">
        {/* Simple Description text */}
        {!isInfoOpen && currentItem.description && (
          <p className="text-xs text-white/80 text-center max-w-2xl px-6 truncate font-medium drop-shadow-sm">
            {currentItem.description}
          </p>
        )}

        {/* Thumbnails bar strip */}
        {media.length > 1 && (
          <div className="flex items-center justify-center gap-2 max-w-full overflow-x-auto py-1 scrollbar-thin px-8">
            {media.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectIndex(idx)}
                  className={`relative w-14 h-9 sm:w-16 sm:h-10 rounded-lg overflow-hidden border cursor-pointer shrink-0 transition-all ${
                    isActive
                      ? "border-blue-500 scale-105 shadow-md shadow-blue-500/25"
                      : "border-white/10 opacity-40 hover:opacity-75"
                  }`}
                >
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {item.type === "video" && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Play className="w-2.5 h-2.5 fill-current text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-white/30 font-mono font-medium">
          화살표 키(← →)와 스와이프를 지원하며, 슬라이드쇼 재생을 활성화할 수 있습니다.
        </p>
      </div>

      {/* Local Toast Alert */}
      <AnimatePresence>
        {localToast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-full text-xs font-semibold shadow-2xl z-[120] tracking-wide"
          >
            {localToast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
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

  const [lightboxMedia, setLightboxMedia] = useState<Array<MediaItem>>([]);
  const [activeMediaIdx, setActiveMediaIdx] = useState<number | null>(null);

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
          
          // Support both array output and object { results, images } output
          const rawSources = searchParts.flatMap((part) => {
            if ("output" in part && part.output) {
              if (Array.isArray(part.output)) {
                return part.output;
              } else if (typeof part.output === "object" && "results" in part.output) {
                return (part.output as any).results || [];
              }
            }
            return [];
          });
          
          const uniqueUrls = new Set();
          const sources = rawSources.filter((src) => {
            if (src && src.url && !uniqueUrls.has(src.url)) {
              uniqueUrls.add(src.url);
              return true;
            }
            return false;
          });

          // Extract images from search tool output
          const rawImages = searchParts.flatMap((part) => {
            if ("output" in part && part.output && typeof part.output === "object" && "images" in part.output) {
              return (part.output as any).images || [];
            }
            return [];
          });

          const uniqueImgUrls = new Set();
          const images = rawImages.filter((img) => {
            if (img && img.url && !uniqueImgUrls.has(img.url)) {
              uniqueImgUrls.add(img.url);
              return true;
            }
            return false;
          }).map((img) => ({ ...img, type: "image" as const }));

          // Extract videos from search tool output
          const rawVideos = searchParts.flatMap((part) => {
            if ("output" in part && part.output && typeof part.output === "object" && "videos" in part.output) {
              return (part.output as any).videos || [];
            }
            return [];
          });

          const uniqueVidUrls = new Set();
          const videos = rawVideos.filter((vid) => {
            if (vid && vid.url && !uniqueVidUrls.has(vid.videoUrl || vid.url)) {
              uniqueVidUrls.add(vid.videoUrl || vid.url);
              return true;
            }
            return false;
          }).map((vid) => ({ ...vid, type: "video" as const }));

          const media = [...images, ...videos];

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

                    {/* Render dynamic web search media gallery if available */}
                    {media && media.length > 0 && (
                      <MediaGallery 
                        media={media} 
                        onMediaClick={(mediaIdx) => {
                          setLightboxMedia(media);
                          setActiveMediaIdx(mediaIdx);
                        }}
                      />
                    )}

                    {/* AI streamed answer content with markdown rendering */}
                    <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/90 leading-7">
                      {message.parts && message.parts.length > 0 &&
                        message.parts.map((part, pIdx) => {
                          if (part.type === "text") {
                            const { cleanText } = parseMessageText(part.text);
                            if (!cleanText) return null;
                            const processedText = injectCitationLinks(cleanText, sources);
                            const markdownComponents = createMarkdownComponents(sources);
                            return (
                              <ReactMarkdown
                                key={pIdx}
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {processedText}
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
                          {followups.map((q, qIdx) => {
                            const info = getCategoryInfo(q.category);
                            return (
                              <motion.button
                                key={qIdx}
                                whileHover={{ scale: 1.005, x: 4 }}
                                whileTap={{ scale: 0.995 }}
                                onClick={() => onSendFollowup(q.text)}
                                className={`flex items-center justify-between text-left text-sm py-3 px-4 rounded-xl border border-border/60 bg-card transition-all duration-200 cursor-pointer shadow-sm group font-medium ${info.buttonHoverStyle}`}
                              >
                                <div className="flex items-start sm:items-center gap-2.5 min-w-0 pr-2 flex-col sm:flex-row">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 select-none ${info.badgeStyle}`}>
                                    {info.label}
                                  </span>
                                  <span className="leading-snug">{q.text}</span>
                                </div>
                                <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground/0 group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ml-2 ${info.arrowHoverColor}`} />
                              </motion.button>
                            );
                          })}
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

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeMediaIdx !== null && lightboxMedia.length > 0 && (
          <Lightbox
            media={lightboxMedia}
            activeIndex={activeMediaIdx}
            onClose={() => setActiveMediaIdx(null)}
            onPrev={() => setActiveMediaIdx((prev) => (prev !== null ? (prev - 1 + lightboxMedia.length) % lightboxMedia.length : 0))}
            onNext={() => setActiveMediaIdx((prev) => (prev !== null ? (prev + 1) % lightboxMedia.length : 0))}
            onSelectIndex={(idx) => setActiveMediaIdx(idx)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
