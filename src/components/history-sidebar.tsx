"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, X, MessageSquare, ChevronLeft, ChevronRight, Compass, Sun, Moon } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme status on mount
  useEffect(() => {
    setMounted(true);
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(activeTheme);
  }, []);

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
      {/* 1. Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* 2. Mobile Sidebar Slide-in Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="fixed top-0 bottom-0 left-0 w-72 bg-card border-r border-border p-4 flex flex-col z-50 md:hidden shadow-2xl"
          >
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/60">
              <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                검색 기록
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* + New Search Button */}
            <button
              onClick={onNewSearch}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-4 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>새 검색 시작하기</span>
            </button>

            {/* History Sessions List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground/60">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-35" />
                  <span>이전 검색 기록이 없습니다.</span>
                </div>
              ) : (
                history.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`flex items-center justify-between group p-3 rounded-xl border cursor-pointer transition text-sm ${
                      currentSessionId === session.id
                        ? "border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold"
                        : "border-transparent hover:bg-muted/70 text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="truncate">{session.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition opacity-80"
                      title="기록 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Profile Info & Theme Toggle */}
            <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between">
              <a
                href="https://github.com/jisung-ops"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition"
              >
                <GithubIcon className="w-4 h-4" />
                <span className="font-medium">jisung-ops GitHub</span>
              </a>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
                type="button"
              >
                {mounted ? (
                  theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 3. Desktop Collapsible Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 0 : 272, opacity: isCollapsed ? 0 : 1 }}
        transition={{ type: "spring", bounce: 0, duration: 0.35 }}
        className="hidden md:flex flex-col shrink-0 h-screen bg-card border-r border-border relative overflow-hidden z-20"
      >
        <div className="w-68 p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-blue-500/10 text-blue-500">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                OmniSeek 검색 기록
              </span>
            </div>
          </div>

          {/* New Search Button */}
          <button
            onClick={onNewSearch}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 검색 시작</span>
          </button>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {history.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground/50">
                <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-35" />
                <span>이전 기록이 없습니다.</span>
              </div>
            ) : (
              history.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`flex items-center justify-between group p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                    currentSessionId === session.id
                      ? "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-transparent hover:bg-muted/70 text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                    title="기록 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Profile Section & Theme Toggle */}
          <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
            <a
              href="https://github.com/jisung-ops"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span className="font-semibold">jisung-ops GitHub</span>
            </a>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
              type="button"
            >
              {mounted ? (
                theme === "light" ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )
              ) : (
                <div className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* 4. Sidebar Hide/Show Toggle Button for Desktop */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex fixed left-[256px] top-4 p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm hover:shadow transition z-30 cursor-pointer"
        style={{
          left: isCollapsed ? "16px" : "256px",
          transition: "left 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        title={isCollapsed ? "사이드바 열기" : "사이드바 접기"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  );
}
