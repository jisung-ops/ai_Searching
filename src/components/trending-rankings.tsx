"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Flame,
  Sparkles,
  RefreshCw,
  Trophy,
  ArrowUpRight,
  Award,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";

export interface RankingItem {
  id: string;
  keyword: string;
  count: number;
  status: "hot" | "rising" | "new";
  category?: string;
  isUserAdded?: boolean;
}

const DEFAULT_INITIAL_RANKINGS: RankingItem[] = [
  { id: "1", keyword: "Next.js 15 App Router 변경점", count: 1240, status: "hot", category: "개발" },
  { id: "2", keyword: "DeepSeek R1 사고 추론 성능 비교", count: 980, status: "hot", category: "AI" },
  { id: "3", keyword: "양자 컴퓨터 원리 및 최근 성과", count: 850, status: "hot", category: "학술" },
  { id: "4", keyword: "Gemini 2.5 Flash 실시간 검색 연동", count: 720, status: "rising", category: "AI" },
  { id: "5", keyword: "React 19 Server Components 활용법", count: 640, status: "rising", category: "개발" },
  { id: "6", keyword: "2026 AI 생산성 최고 추천 도구 모음", count: 590, status: "rising", category: "트렌드" },
  { id: "7", keyword: "Tailwind CSS v4 최신 기능 총정리", count: 480, status: "new", category: "개발" },
  { id: "8", keyword: "글로벌 반도체 시장 동향 및 전망", count: 410, status: "rising", category: "비즈니스" },
  { id: "9", keyword: "Vercel AI SDK 멀티 모달 스트리밍", count: 350, status: "new", category: "개발" },
  { id: "10", keyword: "우주 탐사 최근 발사 뉴스 분석", count: 310, status: "new", category: "뉴스" },
];

const LOCAL_STORAGE_KEY = "ai-search-trending-rankings";

// Helper function to record a searched query to rankings statistics
export function recordSearchKeyword(query: string) {
  if (typeof window === "undefined" || !query || query.trim().length < 2) return;
  const cleanQuery = query.trim();

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items: RankingItem[] = stored ? JSON.parse(stored) : DEFAULT_INITIAL_RANKINGS;

    // Check if query exists (case-insensitive or partial match)
    const existingIdx = items.findIndex(
      (item) => item.keyword.toLowerCase() === cleanQuery.toLowerCase()
    );

    if (existingIdx > -1) {
      items[existingIdx].count += 1;
      items[existingIdx].status = "hot";
    } else {
      const newItem: RankingItem = {
        id: Date.now().toString(),
        keyword: cleanQuery,
        count: 1,
        status: "new",
        category: "사용자 검색",
        isUserAdded: true,
      };
      items.push(newItem);
    }

    // Sort by count descending and keep top 20
    items.sort((a, b) => b.count - a.count);
    items = items.slice(0, 20);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to record ranking keyword:", e);
  }
}

// Helper to reset all search rankings to default
export function resetSearchRankings() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to reset search rankings:", e);
  }
}

// Helper to remove a single keyword from rankings
export function deleteSearchKeyword(id: string) {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const items: RankingItem[] = stored ? JSON.parse(stored) : DEFAULT_INITIAL_RANKINGS;
    const filtered = items.filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete search keyword:", e);
  }
}

interface TrendingRankingsProps {
  onSelectKeyword: (keyword: string) => void;
}

export default function TrendingRankings({ onSelectKeyword }: TrendingRankingsProps) {
  const [rankings, setRankings] = useState<RankingItem[]>(DEFAULT_INITIAL_RANKINGS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadRankings = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: RankingItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRankings(parsed.slice(0, 10));
        } else {
          setRankings(DEFAULT_INITIAL_RANKINGS);
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_RANKINGS));
        setRankings(DEFAULT_INITIAL_RANKINGS);
      }
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setRankings(DEFAULT_INITIAL_RANKINGS);
    }
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadRankings();
      setIsRefreshing(false);
    }, 400);
  };

  const handleReset = () => {
    resetSearchRankings();
    loadRankings();
    setShowResetConfirm(false);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSearchKeyword(id);
    loadRankings();
  };

  const getRankBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50";
      case 1:
        return "bg-gradient-to-r from-slate-300 to-slate-100 text-slate-900 font-bold shadow-xs ring-1 ring-slate-300/50";
      case 2:
        return "bg-gradient-to-r from-amber-700/80 to-amber-600/80 text-amber-100 font-bold shadow-xs ring-1 ring-amber-600/40";
      default:
        return "bg-muted text-muted-foreground font-semibold";
    }
  };

  const getStatusBadge = (status: "hot" | "rising" | "new") => {
    switch (status) {
      case "hot":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/20">
            <Flame className="w-2.5 h-2.5 fill-rose-500" /> HOT
          </span>
        );
      case "rising":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-2.5 h-2.5" /> RISING
          </span>
        );
      case "new":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded-full border border-cyan-500/20">
            <Sparkles className="w-2.5 h-2.5" /> NEW
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-500">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              실시간 인기 검색어 랭킹
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              지금 사용자들이 가장 많이 탐색하고 있는 실시간 핫 트렌드 키워드 Top 10
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground/70 mr-1">
              {lastUpdated} 기준
            </span>
          )}

          {/* Edit Mode Toggle Button */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            title={isEditMode ? "편집 완료" : "랭킹 항목 관리"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
              isEditMode
                ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                : "border-border bg-card/60 hover:bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditMode ? "완료" : "관리"}</span>
          </button>

          {/* Reset Confirmation Button */}
          {showResetConfirm ? (
            <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
              <span className="text-[11px] font-semibold text-rose-500 px-1">초기화할까요?</span>
              <button
                onClick={handleReset}
                title="초기화 확정"
                className="p-1 rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                title="취소"
                className="p-1 rounded bg-muted hover:bg-accent text-muted-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              title="랭킹 및 검색 기록 초기화"
              className="p-1.5 rounded-lg border border-border bg-card/60 hover:bg-rose-500/10 hover:border-rose-500/30 text-muted-foreground hover:text-rose-500 transition-all duration-200 focus:outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title="실시간 랭킹 새로고침"
            className="p-1.5 rounded-lg border border-border bg-card/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-theme" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid Ranking Display (2-Column on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <AnimatePresence mode="popLayout">
          {rankings.slice(0, 10).map((item, idx) => (
            <motion.button
              key={item.id || idx}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, delay: idx * 0.02 }}
              onClick={() => onSelectKeyword(item.keyword)}
              className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left shadow-xs overflow-hidden ${
                isEditMode
                  ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                  : "border-border/60 bg-card/40 hover:bg-accent/60 hover:border-theme/40"
              }`}
            >
              {/* Top 3 Glow Background Effect */}
              {!isEditMode && idx < 3 && (
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r ${
                    idx === 0
                      ? "from-amber-500 to-yellow-500"
                      : idx === 1
                      ? "from-slate-400 to-slate-200"
                      : "from-amber-700 to-amber-500"
                  }`}
                />
              )}

              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* Ranking Badge */}
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs shrink-0 ${getRankBadgeStyle(
                    idx
                  )}`}
                >
                  {idx === 0 ? <Award className="w-3.5 h-3.5" /> : idx + 1}
                </span>

                {/* Keyword Text */}
                <span className="text-sm font-medium text-foreground group-hover:text-theme transition-colors truncate">
                  {item.keyword}
                </span>
              </div>

              {/* Status, Action Icon, and Delete Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!isEditMode && getStatusBadge(item.status)}
                
                {/* Delete button (Visible in Edit Mode or on Hover) */}
                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  title="해당 랭킹 삭제"
                  className={`p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-150 ${
                    isEditMode ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {!isEditMode && (
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-theme group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

