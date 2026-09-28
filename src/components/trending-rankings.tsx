"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Flame,
  Sparkles,
  RefreshCw,
  Trophy,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Info,
  Clock,
  Zap,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Server,
  Cpu,
} from "lucide-react";
import { ClusteredKeyword, TimePeriod, TrendCategory, TrendingResponse } from "@/lib/trending/types";

// 기본 오프라인 폴백 데이터
const DEFAULT_FALLBACK_ITEMS: ClusteredKeyword[] = [
  {
    canonicalKeyword: "DeepSeek V3 & R1",
    normalizedKey: "deepseek v3 r1",
    relatedQueries: ["딥시크 V3 사용법", "DeepSeek v3 벤치마크", "딥시크 R1 로컬 구동"],
    rawCount: 487,
    trendingScore: 124.5,
    velocityScore: 3.8,
    category: "ai",
    status: "hot",
    aiSummary: "오픈소스 초거대 MoE 및 심층 사고 추론 모델 성능 평가와 로컬 실행 관심 급증",
    lastSearchedAt: Date.now() - 5 * 60 * 1000,
  },
  {
    canonicalKeyword: "Next.js 16 App Router",
    normalizedKey: "nextjs 16 app router",
    relatedQueries: ["Next.js 16 변경점", "넥스트js 16 캐싱", "Next.js 서버 컴포넌트"],
    rawCount: 380,
    trendingScore: 98.2,
    velocityScore: 2.4,
    category: "code",
    status: "hot",
    aiSummary: "Turbopack 정식 탑재, 향상된 캐싱 전략 및 Server Actions 최적화 업데이트",
    lastSearchedAt: Date.now() - 15 * 60 * 1000,
  },
  {
    canonicalKeyword: "양자 컴퓨터 혁신 성과",
    normalizedKey: "quantum computer",
    relatedQueries: ["양자 컴퓨터 원리", "구글 윌로우 양자 칩", "양자 오류 정정"],
    rawCount: 295,
    trendingScore: 78.4,
    velocityScore: 1.9,
    category: "academic",
    status: "rising",
    aiSummary: "양자 오류 정정(QEC) 신기록 달성과 상용화 가능성에 대한 글로벌 연구진 발표",
    lastSearchedAt: Date.now() - 25 * 60 * 1000,
  },
  {
    canonicalKeyword: "Gemini 2.5 Flash API",
    normalizedKey: "gemini 2 5 flash",
    relatedQueries: ["제미나이 2.5 플래시 가격", "Gemini API 무료 한도", "제미니 실시간 검색"],
    rawCount: 290,
    trendingScore: 75.1,
    velocityScore: 2.8,
    category: "ai",
    status: "rising",
    aiSummary: "100만 토큰 컨텍스트와 초저지연 실시간 멀티모달 처리 성능으로 개발자 주목",
    lastSearchedAt: Date.now() - 10 * 60 * 1000,
  },
  {
    canonicalKeyword: "React 19 Server Components",
    normalizedKey: "react 19",
    relatedQueries: ["리액트 19 변경점", "react 19 use hook", "React 19 액션 함수"],
    rawCount: 230,
    trendingScore: 61.0,
    velocityScore: 1.6,
    category: "code",
    status: "rising",
    aiSummary: "useActionState, 비동기 트랜지션 및 리액트 컴파일러(React Compiler) 도입 본격화",
    lastSearchedAt: Date.now() - 40 * 60 * 1000,
  },
  {
    canonicalKeyword: "글로벌 반도체 & HBM 동향",
    normalizedKey: "semiconductor hbm",
    relatedQueries: ["HBM4 수혜주", "엔비디아 차세대 GPU 로드맵", "글로벌 파운드리 점유율"],
    rawCount: 200,
    trendingScore: 52.3,
    velocityScore: 1.4,
    category: "business",
    status: "rising",
    aiSummary: "AI 데이터센터 수요 폭증에 따른 HBM3E/HBM4 공급 경쟁 및 투자 전략 분석",
    lastSearchedAt: Date.now() - 50 * 60 * 1000,
  },
  {
    canonicalKeyword: "2026 AI 생산성 툴 추천",
    normalizedKey: "ai productivity tools 2026",
    relatedQueries: ["직장인 필수 AI 도구", "무료 AI 생산성 툴", "AI 검색 에이전트 비교"],
    rawCount: 167,
    trendingScore: 43.8,
    velocityScore: 1.2,
    category: "trend",
    status: "new",
    aiSummary: "검색, 코딩, 문서 작성을 자동화하는 차세대 AI 에이전트 도구 생태계 총정리",
    lastSearchedAt: Date.now() - 60 * 60 * 1000,
  },
  {
    canonicalKeyword: "Tailwind CSS v4 마이그레이션",
    normalizedKey: "tailwind css v4",
    relatedQueries: ["테일윈드 v4 설정법", "Tailwind 4 변경점", "Tailwind CSS 신규 기능"],
    rawCount: 140,
    trendingScore: 37.5,
    velocityScore: 1.1,
    category: "code",
    status: "new",
    aiSummary: "CSS 중심의 새로운 고속 Rust 기반 엔진과 간소화된 설정 파일(CSS-first) 도입",
    lastSearchedAt: Date.now() - 90 * 60 * 1000,
  },
];

/**
 * 전역 검색 쿼리 기록 헬퍼 함수
 * 사용자가 검색창에 질의를 입력하고 엔터를 누를 때 자동 호출됨
 */
export async function recordSearchKeyword(query: string, category: TrendCategory = "trend") {
  if (typeof window === "undefined" || !query || query.trim().length < 2) return;

  try {
    // 1. 서버 API 엔드포인트로 전송
    await fetch("/api/trending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim(), category }),
    });
  } catch (err) {
    // 백그라운드 기록이므로 에러 시 무음 처리
    console.debug("Silent fallback on recording keyword:", err);
  }
}

interface TrendingRankingsProps {
  onSelectKeyword: (keyword: string) => void;
}

export default function TrendingRankings({ onSelectKeyword }: TrendingRankingsProps) {
  const [period, setPeriod] = useState<TimePeriod>("24h");
  const [category, setCategory] = useState<TrendCategory>("all");
  const [items, setItems] = useState<ClusteredKeyword[]>(DEFAULT_FALLBACK_ITEMS);
  const [engineInfo, setEngineInfo] = useState<TrendingResponse["engineInfo"] | null>({
    algorithm: "Hacker News Time-Decay Gravity (γ=1.5, τ=3.0h)",
    decayFactor: 1.5,
    halfLifeHours: 3.0,
    clusteringMethod: "Phonetic Map + Stopwords Filter + Bigram Jaccard (Threshold: 0.6)",
    infraMode: "in_memory_lru",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [showAlgoModal, setShowAlgoModal] = useState(false);

  // 트렌딩 데이터 서버 패치 함수
  const fetchRankings = useCallback(async (p: TimePeriod, c: TrendCategory) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trending?period=${p}&category=${c}`);
      if (res.ok) {
        const data: TrendingResponse = await res.json();
        if (data.items && data.items.length > 0) {
          setItems(data.items);
          setEngineInfo(data.engineInfo);
        } else {
          setItems(DEFAULT_FALLBACK_ITEMS);
        }
      } else {
        setItems(DEFAULT_FALLBACK_ITEMS);
      }
    } catch {
      setItems(DEFAULT_FALLBACK_ITEMS);
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
  }, []);

  useEffect(() => {
    fetchRankings(period, category);
  }, [period, category, fetchRankings]);

  // 카테고리 정의
  const categories: { id: TrendCategory; label: string }[] = [
    { id: "all", label: "🔥 전체" },
    { id: "ai", label: "🤖 AI/LLM" },
    { id: "code", label: "💻 개발/코드" },
    { id: "business", label: "📈 비즈니스" },
    { id: "academic", label: "🎓 학술/연구" },
    { id: "trend", label: "🌟 트렌드" },
  ];

  // 순위 배지 디자인
  const getRankBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black shadow-md shadow-amber-500/25 ring-1 ring-amber-300/60";
      case 1:
        return "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-extrabold shadow-sm ring-1 ring-slate-200/50";
      case 2:
        return "bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100 font-extrabold shadow-sm ring-1 ring-amber-600/40";
      default:
        return "bg-muted/80 text-muted-foreground font-bold border border-border/40";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      {/* 헤더 섹션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 via-amber-500/10 to-orange-500/20 border border-rose-500/30 text-rose-500 shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                실시간 인기 검색어 & AI 트렌딩 랭킹
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              시간 감쇠(Time-decay) 가중치 & 유사 질의 클러스터링으로 집계된 실시간 핫 토픽
            </p>
          </div>
        </div>

        {/* 상단 컨트롤 버튼 (알고리즘 스펙 안내, 새로고침) */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {lastUpdated && (
            <span className="text-[11px] text-muted-foreground/70 hidden md:inline-flex items-center gap-1 mr-1">
              <Clock className="w-3 h-3" />
              {lastUpdated} 기준
            </span>
          )}

          {/* 알고리즘 기술 스펙 버튼 */}
          <button
            onClick={() => setShowAlgoModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-card/60 hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shadow-xs"
            title="랭킹 알고리즘 및 클러스터링 기술 원리 보기"
          >
            <Cpu className="w-3 h-3 text-rose-500" />
            <span>기술 스펙</span>
          </button>

          {/* 새로고침 버튼 */}
          <button
            onClick={() => fetchRankings(period, category)}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-xs"
            title="랭킹 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* 필터 탭 바 (기간 선택 & 카테고리) */}
      <div className="flex flex-col gap-2.5 mb-4 p-2.5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-xs">
        {/* 기간 선택 (1H / 24H / 7D) */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/60 border border-border/30 text-xs">
            <button
              onClick={() => setPeriod("1h")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                period === "1h"
                  ? "bg-background text-rose-500 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="w-3 h-3" />
              지금 급상승 (1H)
            </button>
            <button
              onClick={() => setPeriod("24h")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                period === "24h"
                  ? "bg-background text-rose-500 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-3 h-3" />
              오늘 핫이슈 (24H)
            </button>
            <button
              onClick={() => setPeriod("7d")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                period === "7d"
                  ? "bg-background text-rose-500 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="w-3 h-3" />
              주간 베스트 (7D)
            </button>
          </div>

          {/* 인프라 상태 태그 */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground/80 px-2 py-0.5 rounded-md bg-muted/30 border border-border/30">
            <Server className="w-3 h-3 text-emerald-500" />
            <span>엔진: {engineInfo?.infraMode === "redis_kv" ? "Vercel KV (Redis)" : "Edge LRU Engine"}</span>
          </div>
        </div>

        {/* 카테고리 태그 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition cursor-pointer ${
                category === cat.id
                  ? "bg-foreground/10 text-foreground font-semibold border border-foreground/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 랭킹 그리드/리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <AnimatePresence mode="popLayout">
          {items.slice(0, 10).map((item, idx) => {
            const isExpanded = expandedCluster === item.normalizedKey;
            const hasRelated = item.relatedQueries && item.relatedQueries.length > 1;

            return (
              <motion.div
                key={item.normalizedKey || item.canonicalKeyword}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.02 }}
                onClick={() => onSelectKeyword(item.canonicalKeyword)}
                className="group relative flex flex-col p-3 rounded-2xl bg-card/60 hover:bg-card/90 border border-border/50 hover:border-theme/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
              >
                {/* 상단 행: 순위, 키워드, 배지, 스코어 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* 순위 배지 */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${getRankBadgeStyle(
                        idx
                      )}`}
                    >
                      {idx + 1}
                    </div>

                    {/* 키워드 본문 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground group-hover:text-rose-500 transition-colors truncate">
                          {item.canonicalKeyword}
                        </span>

                        {/* 상태 배지 */}
                        {item.status === "hot" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded-md border border-rose-500/20">
                            <Flame className="w-2.5 h-2.5 fill-rose-500" /> HOT
                          </span>
                        )}
                        {item.status === "rising" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-md border border-emerald-500/20">
                            <TrendingUp className="w-2.5 h-2.5" /> +{(item.velocityScore * 100).toFixed(0)}%
                          </span>
                        )}
                        {item.status === "new" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.2 rounded-md border border-cyan-500/20">
                            <Sparkles className="w-2.5 h-2.5" /> NEW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 즉시 검색 아이콘 & 스코어 */}
                  <div className="flex items-center gap-1 shrink-0 text-muted-foreground group-hover:text-rose-500 transition-colors">
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {item.trendingScore.toFixed(0)} pts
                    </span>
                    <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>

                {/* AI 맥락 1줄 설명 (Why It's Trending) */}
                {item.aiSummary && (
                  <p className="mt-1.5 text-xs text-muted-foreground/90 line-clamp-1 pl-8.5 font-normal">
                    {item.aiSummary}
                  </p>
                )}

                {/* 클러스터링된 유사 질의 (Clustered Sub-queries) */}
                {hasRelated && (
                  <div className="mt-2 pl-8.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" /> 묶인 유사 질의:
                      </span>
                      {item.relatedQueries.slice(0, isExpanded ? 5 : 2).map((rel, rIdx) => (
                        <span
                          key={rIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectKeyword(rel);
                          }}
                          className="inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer border border-border/40"
                          title="이 질의로 바로 검색하기"
                        >
                          {rel}
                        </span>
                      ))}

                      {item.relatedQueries.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCluster(isExpanded ? null : item.normalizedKey);
                          }}
                          className="text-[10px] text-theme font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>접기 <ChevronUp className="w-2.5 h-2.5" /></>
                          ) : (
                            <>+{item.relatedQueries.length - 2}개 더보기 <ChevronDown className="w-2.5 h-2.5" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 알고리즘 기술 스펙 안내 모달 */}
      <AnimatePresence>
        {showAlgoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowAlgoModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 모달 헤더 */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    스마트 트렌딩 랭킹 시스템 아키텍처
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    OmniSeek AI의 지능형 랭킹 가중치 및 검색어 군집화 기술 원리
                  </p>
                </div>
              </div>

              {/* 내용 섹션 1: 시간 감쇠 알고리즘 */}
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-1">
                    <Clock className="w-4 h-4 text-amber-500" />
                    1. 시간 감쇠(Time-decay) 가중치 스코어링
                  </div>
                  <p className="text-muted-foreground mb-2 leading-relaxed">
                    단순 누적 카운트가 아닌, **Hacker News / Reddit 스타일의 중력 감쇠 공식**을 적용하여 오래된 검색의 가중치를 줄이고 최근 1~3시간 내의 검색 활동을 집중 포착합니다.
                  </p>
                  <div className="p-2.5 rounded-xl bg-background border border-border/60 font-mono text-[11px] text-theme">
                    Weight(Δt) = 1 / [1 + (Δt / 3.0h) ^ 1.5]
                  </div>
                </div>

                {/* 내용 섹션 2: 유사 검색어 클러스터링 */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-1">
                    <Layers className="w-4 h-4 text-blue-500" />
                    2. 유사 검색어 정규화 & N-gram 클러스터링
                  </div>
                  <p className="text-muted-foreground mb-2 leading-relaxed">
                    불용어 및 조사를 제거하고 영한 음차 매핑(예: <code>딥시크</code> ➔ <code>deepseek</code>)을 수행한 뒤, **Bi-gram 토큰 Jaccard 유사도(역치 0.6)**를 산출하여 동일 주제의 질의를 하나의 대표 토픽으로 자동 통합합니다.
                  </p>
                  <div className="text-[11px] text-muted-foreground/80 space-y-1">
                    <div>• <code>딥시크 V3 사용법</code> + <code>DeepSeek v3 벤치마크</code> ➔ <strong>DeepSeek V3</strong> 대표 토픽으로 합산</div>
                  </div>
                </div>

                {/* 내용 섹션 3: 인프라 아키텍처 */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-1">
                    <Server className="w-4 h-4 text-emerald-500" />
                    3. Vercel KV (Redis) & 서버리스 하이브리드 인프라
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    서버리스 환경에서 초저지연 집계를 위해 **Vercel KV의 Redis Sorted Set (<code>ZINCRBY</code>)**과 연동할 수 있도록 설계되었으며, 독립 실행 및 로컬 환경에서도 무중단으로 동작하는 **In-Memory Sliding Window Fallback 엔진**을 갖추고 있습니다.
                  </p>
                </div>
              </div>

              {/* 하단 닫기 버튼 */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAlgoModal(false)}
                  className="px-4 py-2 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
