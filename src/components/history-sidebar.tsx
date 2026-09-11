"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, MessageSquare, Compass, Sun, Moon, History, Globe, Image as ImageIcon, Folder, Settings, Sparkles, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  updatedAt: string;
}

interface HistorySidebarProps {
  history: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewSearch: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function HistorySidebar({
  history,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSearch,
  isOpen,
  setIsOpen,
}: HistorySidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Sync theme status on mount
  useEffect(() => {
    setMounted(true);
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(activeTheme);
  }, []);

  // Close history flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsHistoryDrawerOpen(false);
      }
    };
    if (isHistoryDrawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHistoryDrawerOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <>
      {/* 1. Mobile Sidebar Slide-in Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-[#EAE4D9] dark:bg-[#252220] border-r border-[#E0D8C8] dark:border-[#3D3936] p-4 flex flex-col z-50 md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#D8CFBF] dark:border-[#332F2C]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#F5F1E8] dark:bg-[#332F2C] text-[#8C6D53] dark:text-[#D4A373] border border-[#E0D8C8] dark:border-[#3D3936]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-[#4E4137] dark:text-[#E6DEC8]">
                    OmniSeek 지식 아카이브
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  onNewSearch();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-4 rounded-xl border border-[#D5CBB8] dark:border-[#423E3A] bg-[#FDFCF9] dark:bg-[#2C2927] hover:bg-[#F7F3EA] dark:hover:bg-[#35312E] text-[#5C4A3E] dark:text-[#E6DEC8] text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4 text-[#8C6D53] dark:text-[#D4A373]" />
                <span>새 탐색 시작</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {history.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#8C8479] dark:text-[#9E968B]">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-35" />
                    <span>이전 탐색 기록이 없습니다.</span>
                  </div>
                ) : (
                  history.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition text-sm ${
                        currentSessionId === session.id
                          ? "border-[#C2B5A0] dark:border-[#524B45] bg-[#FDFCF9] dark:bg-[#2E2B28] text-[#4A3D33] dark:text-[#E6DEC8] font-bold"
                          : "border-transparent hover:bg-[#F2ECE0]/70 dark:hover:bg-[#2D2A27] text-[#6E6458] dark:text-[#B5ACA0]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare className="w-4 h-4 shrink-0 opacity-70 text-[#8C6D53]" />
                        <span className="truncate">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 rounded-md text-[#8C8479] hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 2. Desktop Gemini 1st Image Style Vertical Icon Dock Sidebar */}
      <aside className="hidden md:flex flex-col items-center justify-between shrink-0 w-16 h-screen bg-[#EAE4D9] dark:bg-[#252220] border-r border-[#E0D8C8] dark:border-[#3D3936] py-4 px-2 z-30 select-none">
        {/* Top Section: Logo & Action Icons */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Gemini Style Brand Sparkles Logo */}
          <button
            onClick={onNewSearch}
            className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C6D53] to-[#4E6B56] text-white shadow-xs hover:scale-105 transition-transform cursor-pointer"
            title="Gemini 스타일 AI 검색 로고"
          >
            <Sparkles className="w-5 h-5 fill-current" />
          </button>

          <div className="w-8 h-[1px] bg-[#D8CFBF] dark:bg-[#3D3936] my-1" />

          {/* Icon 1: + New Search */}
          <button
            onClick={onNewSearch}
            className="relative group p-3 rounded-2xl hover:bg-[#FDFCF9] dark:hover:bg-[#2C2927] text-[#5C4A3E] dark:text-[#E6DEC8] hover:text-[#8C6D53] transition-all cursor-pointer shadow-none hover:shadow-xs"
            title="새 탐색 시작하기"
          >
            <Plus className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#2D2B2A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              새 탐색 시작
            </span>
          </button>

          {/* Icon 2: History/Recent Drawer Trigger */}
          <button
            onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
            className={`relative group p-3 rounded-2xl transition-all cursor-pointer ${
              isHistoryDrawerOpen || currentSessionId
                ? "bg-[#FDFCF9] dark:bg-[#2C2927] text-[#8C6D53] dark:text-[#D4A373] shadow-xs"
                : "hover:bg-[#FDFCF9] dark:hover:bg-[#2C2927] text-[#5C4A3E] dark:text-[#E6DEC8]"
            }`}
            title="검색 및 탐색 기록 보기"
          >
            <History className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#2D2B2A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              탐색 기록 목록
            </span>
          </button>

          {/* Icon 3: Web Search Mode */}
          <button
            onClick={onNewSearch}
            className="relative group p-3 rounded-2xl hover:bg-[#FDFCF9] dark:hover:bg-[#2C2927] text-[#5C4A3E] dark:text-[#E6DEC8] transition-all cursor-pointer"
            title="전체 웹 실시간 검색 모드"
          >
            <Globe className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#2D2B2A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              실시간 웹 검색
            </span>
          </button>

          {/* Icon 4: Image Generation Mode */}
          <button
            onClick={onNewSearch}
            className="relative group p-3 rounded-2xl hover:bg-[#FDFCF9] dark:hover:bg-[#2C2927] text-[#5C4A3E] dark:text-[#E6DEC8] transition-all cursor-pointer"
            title="AI 이미지 생성 모드"
          >
            <ImageIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#2D2B2A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              이미지 생성
            </span>
          </button>

          {/* Icon 5: Files / Documents */}
          <button
            onClick={onNewSearch}
            className="relative group p-3 rounded-2xl hover:bg-[#FDFCF9] dark:hover:bg-[#2C2927] text-[#5C4A3E] dark:text-[#E6DEC8] transition-all cursor-pointer"
            title="문서 및 파일 업로드 분석"
          >
            <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#2D2B2A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              파일 분석
            </span>
          </button>
        </div>

        {/* Bottom Section: GitHub, Theme & Settings */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* GitHub link */}
          <a
            href="https://github.com/jisung-ops"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group p-2.5 rounded-2xl hover:bg-[#FDFCF9] dark:hover:bg-[#2C2927] text-[#5C4A3E] dark:text-[#E6DEC8] transition-all cursor-pointer"
            title="jisung-ops GitHub 바로가기"
          >
            <GithubIcon className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#2D2B2A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              GitHub 저장소
            </span>
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative group p-2.5 rounded-2xl hover:bg-[#FDFCF9] dark:hover:bg-[#2C2927] text-[#5C4A3E] dark:text-[#E6DEC8] transition-all cursor-pointer"
            title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
          >
            {mounted ? (
              theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#2D2B2A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              테마 전환
            </span>
          </button>
        </div>
      </aside>

      {/* 3. Gemini Style History Flyout Panel (Popping out from the vertical dock) */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
            className="hidden md:flex flex-col fixed left-16 top-0 bottom-0 w-72 bg-[#FDFCF9] dark:bg-[#282523] border-r border-[#E0D8C8] dark:border-[#3D3936] p-4 z-40 shadow-xl select-none"
          >
            {/* Flyout Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0D8C8] dark:border-[#3D3936]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#8C6D53] dark:text-[#D4A373]" />
                <span className="text-xs font-bold text-[#3D3B39] dark:text-[#F0ECE6]">
                  최근 탐색 기록
                </span>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#8C8479] dark:text-[#9E968B]">
                  <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-35" />
                  <span>이전 탐색 기록이 없습니다.</span>
                </div>
              ) : (
                history.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      setIsHistoryDrawerOpen(false);
                    }}
                    className={`flex items-center justify-between group p-3 rounded-2xl border cursor-pointer transition text-xs ${
                      currentSessionId === session.id
                        ? "border-[#C2B5A0] dark:border-[#524B45] bg-[#EAE4D9] dark:bg-[#332F2C] text-[#3D3B39] dark:text-[#F0ECE6] font-bold shadow-2xs"
                        : "border-transparent hover:bg-[#F4F1EA] dark:hover:bg-[#332F2C] text-[#6E6458] dark:text-[#B5ACA0] hover:text-[#3D3B39]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70 text-[#8C6D53] dark:text-[#D4A373]" />
                      <span className="truncate">{session.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 rounded-md text-[#8C8479] hover:text-red-600 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                      title="기록 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
