"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Search, Globe, GraduationCap, Code, Users, Sparkles, Compass, Lightbulb, Brain, Link2, X, ChevronDown, Cpu, Zap, Bot, MessageSquare, Plus, Paperclip, Mic, AudioLines, Image as ImageIcon, Folder } from "lucide-react";
import SearchTemplates from "@/components/search-templates";

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
    desc: "초고속 실시간 웹 검색 통합 및 지식 정리 엔진",
    icon: Zap,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o 페르소나",
    provider: "OpenAI",
    badge: "플래그십 분석",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    desc: "정교한 서술 체계 & 정밀한 범용 분석 스타일",
    icon: Bot,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 페르소나",
    provider: "Anthropic",
    badge: "고성능 코딩",
    badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    desc: "논리적 보고서 & 최신 소프트웨어 개발 코드 특화",
    icon: Cpu,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1 페르소나",
    provider: "DeepSeek",
    badge: "심층 추론",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    desc: "다각도 심층 추론(Reasoning) 및 기술 메커니즘 분석",
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImageGen, setIsImageGen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

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

  const handleAddUrlPrompt = () => {
    const inputUrl = prompt("실시간으로 본문을 분석할 웹페이지 URL(예: https://...)을 입력하세요:");
    if (inputUrl && inputUrl.trim()) {
      let cleanUrl = inputUrl.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }
      setQuery((prev) => (prev ? `${prev} ${cleanUrl}` : cleanUrl));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center py-8">
      {/* Title (Matching Second Image Exactly) */}
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90 font-sans">
          무엇이든 편하게 시작해 보세요.
        </h1>
      </div>

      {/* Main Container */}
      <div className="w-full space-y-3">
        {/* Hidden File Input for Image/Document Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.txt,.doc,.docx"
          className="hidden"
        />

        {/* 1. Top Search Bar (Input with +, Mic, Audio Waveform icons) */}
        <form
          onSubmit={handleSubmit}
          className="w-full relative bg-card border border-border/80 rounded-full shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2.5 flex items-center gap-3"
        >
          {/* Plus Icon Trigger */}
          <button
            type="button"
            onClick={handleAddUrlPrompt}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
            title="첨부 및 링크 추가"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Input text */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isImageGen ? "생성하고 싶은 이미지를 설명해 보세요..." : "무엇이든 물어보세요"}
            className="flex-1 bg-transparent outline-none border-none text-foreground placeholder:text-muted-foreground/60 text-sm md:text-base font-normal"
          />

          {/* Selected File Chip preview */}
          {selectedFile && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
              <Paperclip className="w-3 h-3" />
              <span className="max-w-[100px] truncate">{selectedFile.name}</span>
              <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedFile(null)} />
            </span>
          )}

          {/* Right Action Icons (Mic & AudioLines) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => alert("음성 입력이 곧 지원될 예정입니다.")}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="음성 입력"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
                query.trim()
                  ? "bg-foreground text-background hover:opacity-90 shadow-xs"
                  : "bg-muted text-muted-foreground/60"
              }`}
              title="검색 전송"
            >
              <AudioLines className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* 2. Feature Menu Panel (Matching Second Image Layout Exactly) */}
        <div className="w-full bg-card/90 border border-border/80 rounded-3xl p-3 shadow-xs space-y-1">
          {/* Item 1: 사진 첨부 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-muted/60 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted/60 group-hover:bg-background text-foreground/80 transition">
                <Paperclip className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">사진 첨부</div>
                <div className="text-xs text-muted-foreground">컴퓨터에서 업로드하세요</div>
              </div>
            </div>
          </button>

          {/* Item 2: 웹 검색 */}
          <button
            type="button"
            onClick={() => {
              setIsImageGen(false);
              setFocusMode("all");
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer text-left ${
              !isImageGen && focusMode === "all" ? "bg-muted/40" : "hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">웹 검색</div>
                <div className="text-xs text-muted-foreground">실시간 뉴스 및 정보를 찾아보세요</div>
              </div>
            </div>
          </button>

          {/* Item 3: 이미지 생성 */}
          <button
            type="button"
            onClick={() => {
              setIsImageGen(!isImageGen);
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer text-left ${
              isImageGen ? "bg-amber-500/10 border border-amber-500/20" : "hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">이미지 생성</div>
                <div className="text-xs text-muted-foreground">무엇이든 시각화하세요</div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/80 font-medium px-2 py-0.5">
              {isImageGen ? "켜짐" : "로그인"}
            </span>
          </button>

          {/* Item 4: 파일 추가 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-muted/60 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">파일 추가</div>
                <div className="text-xs text-muted-foreground">문서 및 기타 파일 업로드</div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/80 font-medium px-2 py-0.5">로그인</span>
          </button>

          {/* Item 5: 더 오래 생각 */}
          <button
            type="button"
            onClick={() => setIsProMode(!isProMode)}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer text-left ${
              isProMode ? "bg-yellow-500/10 border border-yellow-500/20" : "hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">더 오래 생각</div>
                <div className="text-xs text-muted-foreground">자세한 답변 제공</div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/80 font-medium px-2 py-0.5">
              {isProMode ? "켜짐" : "로그인"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

