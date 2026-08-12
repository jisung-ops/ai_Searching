"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  GraduationCap,
  TrendingUp,
  Compass,
  Sparkles,
  FileCode,
  LineChart,
  BookOpen,
  MapPin,
  Coffee,
  Cpu,
  Zap,
} from "lucide-react";

export interface SearchTemplate {
  id: string;
  category: "all" | "code" | "business" | "academic" | "life";
  title: string;
  desc: string;
  prompt: string;
  badge: string;
  badgeColor: string;
  recommendedFocus: "all" | "code" | "academic" | "social";
  recommendedPro: boolean;
  icon: any;
}

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "🔥 전체 템플릿", icon: Sparkles },
  { id: "code", label: "💻 개발 & 코딩", icon: Code2 },
  { id: "business", label: "📊 비즈니스 & 시장", icon: TrendingUp },
  { id: "academic", label: "🎓 학술 & 연구", icon: GraduationCap },
  { id: "life", label: "✈️ 여행 & 라이프", icon: Compass },
] as const;

export const SEARCH_TEMPLATES: SearchTemplate[] = [
  {
    id: "react-19-features",
    category: "code",
    title: "React 19 & Server Actions",
    desc: "React 19의 주요 변경점과 UseActionState, Server Actions 핵심 사용법 정리",
    prompt: "React 19 버전의 주요 변경점과 Server Actions, useActionState Hook 사용 예시를 기존 버전과 비교해서 상세히 정리해줘.",
    badge: "개발 특화",
    badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    recommendedFocus: "code",
    recommendedPro: false,
    icon: FileCode,
  },
  {
    id: "deepseek-r1-local",
    category: "code",
    title: "DeepSeek R1 로컬 구동 가이드",
    desc: "Ollama 및 vLLM을 활용한 DeepSeek R1 심층 추론 모델 로컬 실행 방법",
    prompt: "DeepSeek R1 오픈소스 추론 모델을 Ollama 및 vLLM으로 로컬 GPU 환경에서 구동하는 단계별 가이드와 성능 최적화 팁을 조사해줘.",
    badge: "GitHub / AI",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    recommendedFocus: "code",
    recommendedPro: true,
    icon: Cpu,
  },
  {
    id: "ai-market-2026",
    category: "business",
    title: "2026 AI 시장 분석 & SWOT",
    desc: "글로벌 생성형 AI 시장 규모 전망, 유망 분야 및 주요 기업 SWOT 비교 분석",
    prompt: "2026년 글로벌 생성형 AI 시장 규모 전망과 주요 플레이어(OpenAI, Google, Anthropic)의 SWOT 분석 보고서를 작성해줘.",
    badge: "시장 보고서",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    recommendedFocus: "all",
    recommendedPro: true,
    icon: LineChart,
  },
  {
    id: "ev-battery-trends",
    category: "business",
    title: "전기차 배터리 최신 동향",
    desc: "전고체 배터리 상용화 시점 및 2차전지 글로벌 트렌드 요약",
    prompt: "전고체 배터리 기술의 최신 개발 현황과 상용화 예상 시점, 2차전지 관련 최근 주요 뉴스를 요약해줘.",
    badge: "트렌드 탐구",
    badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    recommendedFocus: "all",
    recommendedPro: false,
    icon: TrendingUp,
  },
  {
    id: "quantum-error-correction",
    category: "academic",
    title: "양자 컴퓨터 오류 수정 논문 분석",
    desc: "양자 오류 수정(Error Correction) 최신 학술 논문 동향 및 논리 큐비트 성과",
    prompt: "최근 1~2년 간 발표된 양자 오류 수정(Quantum Error Correction) 관련 핵심 학술 논문 동향과 논리 큐비트 구현 성과를 논문 인용과 함께 정리해줘.",
    badge: "arXiv / 학술",
    badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    recommendedFocus: "academic",
    recommendedPro: true,
    icon: BookOpen,
  },
  {
    id: "crispr-gene-editing",
    category: "academic",
    title: "CRISPR 유전자 편집 최신 원리",
    desc: "CRISPR-Cas9 원리와 최근 임상 승인 사례 및 바이오 기술 발전",
    prompt: "CRISPR 유전자 편집 기술의 동작 원리와 최근 FDA 승인 치료제 사례, 그리고 학계의 최신 유전자 교정 기술 동향을 학술 자료 바탕으로 설명해줘.",
    badge: "바이오 / 학술",
    badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    recommendedFocus: "academic",
    recommendedPro: true,
    icon: GraduationCap,
  },
  {
    id: "tokyo-gourmet-trip",
    category: "life",
    title: "도쿄 3박 4일 식도락 동선",
    desc: "도쿄 명소 및 현지 맛집 추천 일자별 효율적인 이동 동선 코스",
    prompt: "도쿄 3박 4일 식도락 여행을 위한 일자별 동선과 필수 방문 추천 맛집, 이동 팁을 포함한 추천 일정을 짜줘.",
    badge: "여행 계획",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    recommendedFocus: "all",
    recommendedPro: false,
    icon: MapPin,
  },
  {
    id: "home-espresso-guide",
    category: "life",
    title: "홈카페 에스프레소 머신 비교",
    desc: "입문자부터 가성비 모델별 실사용 후기 및 추출 팁",
    prompt: "30만 원~100만 원대 입문용 홈카페 에스프레소 머신 대표 모델들의 장단점과 사용자 후기를 비교 가이드로 작성해줘.",
    badge: "가전 / 비교",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    recommendedFocus: "all",
    recommendedPro: false,
    icon: Coffee,
  },
];

interface SearchTemplatesProps {
  onSelectTemplate: (prompt: string, focusMode: string, isProMode: boolean) => void;
}

export default function SearchTemplates({ onSelectTemplate }: SearchTemplatesProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredTemplates =
    activeCategory === "all"
      ? SEARCH_TEMPLATES
      : SEARCH_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="w-full mt-8">
      {/* Header & Category Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-theme animate-pulse" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            목적별 맞춤 검색 템플릿
          </h3>
        </div>

        {/* Category Tabs Chips */}
        <div className="flex flex-wrap items-center gap-1.5 bg-card/60 p-1 rounded-xl border border-border/50 text-xs">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-theme text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <motion.button
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                type="button"
                onClick={() =>
                  onSelectTemplate(
                    template.prompt,
                    template.recommendedFocus,
                    template.recommendedPro
                  )
                }
                className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-border/70 bg-card/60 hover:bg-card hover:border-theme/40 hover:shadow-md transition-all duration-200 text-left cursor-pointer overflow-hidden"
              >
                {/* Subtle Hover Gradient Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-theme/0 via-theme/5 to-theme/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* Top Bar: Icon + Title + Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-theme/10 text-theme group-hover:bg-theme group-hover:text-white transition-colors duration-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs text-foreground group-hover:text-theme transition-colors line-clamp-1">
                        {template.title}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${template.badgeColor}`}>
                      {template.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors line-clamp-2 mb-3">
                    {template.desc}
                  </p>
                </div>

                {/* Bottom Bar Indicator: Focus Mode & Pro Mode Badges */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[10px] text-muted-foreground/75">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground/70">자동 설정:</span>
                    <span className="px-1.5 py-0.2 rounded bg-muted font-mono">
                      포커스({template.recommendedFocus})
                    </span>
                    {template.recommendedPro && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        프로 탐구
                      </span>
                    )}
                  </div>
                  <span className="text-theme font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    적용 ➔
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
