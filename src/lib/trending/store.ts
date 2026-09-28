import { ClusteredKeyword, SearchEvent, TimePeriod, TrendCategory } from "./types";
import { normalizeQuery, findMatchingCluster } from "./normalization";
import { calculateAggregateScore } from "./scoring";

interface TopicData {
  canonicalKeyword: string;
  normalizedKey: string;
  category: TrendCategory;
  aiSummary: string;
  relatedQueries: Set<string>;
  timestamps: number[];
}

/**
 * 현실적인 초기 시드 데이터
 * - 각 토픽별로 최근 몇 분~몇 시간 전의 검색 이벤트 타임스탬프를 분산 생성하여
 *   시간 감쇠(Time-decay) 및 급상승(Rising)이 실감 나게 계산되도록 구성.
 */
function createInitialSeedData(): Map<string, TopicData> {
  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;

  const seedConfigs: {
    canonical: string;
    normalized: string;
    category: TrendCategory;
    aiSummary: string;
    related: string[];
    // [분 전, 발생 수] 형태
    distribution: [number, number][];
  }[] = [
    {
      canonical: "DeepSeek V3 & R1",
      normalized: "deepseek v3 r1",
      category: "ai",
      aiSummary: "오픈소스 초거대 MoE 및 심층 사고 추론 모델 성능 평가와 로컬 실행 관심 급증",
      related: ["딥시크 V3 사용법", "DeepSeek v3 벤치마크", "딥시크 R1 로컬 구동", "DeepSeek API 연동"],
      distribution: [
        [5, 42],  // 5분 전 42건 (급상승)
        [30, 85],
        [90, 140],
        [300, 220],
      ],
    },
    {
      canonical: "Next.js 16 App Router",
      normalized: "nextjs 16 app router",
      category: "code",
      aiSummary: "Turbopack 정식 탑재, 향상된 캐싱 전략 및 Server Actions 최적화 업데이트",
      related: ["Next.js 16 변경점", "넥스트js 16 캐싱", "Next.js 서버 컴포넌트", "nextjs 16 업그레이드"],
      distribution: [
        [15, 30],
        [45, 60],
        [120, 110],
        [400, 180],
      ],
    },
    {
      canonical: "양자 컴퓨터 혁신 성과",
      normalized: "quantum computer",
      category: "academic",
      aiSummary: "양자 오류 정정(QEC) 신기록 달성과 상용화 가능성에 대한 글로벌 연구진 발표",
      related: ["양자 컴퓨터 원리", "구글 윌로우 양자 칩", "양자 암호 보안 영향"],
      distribution: [
        [25, 20],
        [80, 50],
        [240, 95],
        [600, 130],
      ],
    },
    {
      canonical: "Gemini 2.5 Flash API",
      normalized: "gemini 2 5 flash",
      category: "ai",
      aiSummary: "100만 토큰 컨텍스트와 초저지연 실시간 멀티모달 처리 성능으로 개발자 주목",
      related: ["제미나이 2.5 플래시 가격", "Gemini API 무료 한도", "제미니 실시간 웹 검색"],
      distribution: [
        [10, 35],
        [60, 55],
        [180, 80],
        [500, 120],
      ],
    },
    {
      canonical: "React 19 Server Components",
      normalized: "react 19",
      category: "code",
      aiSummary: "useActionState, 비동기 트랜지션 및 리액트 컴파일러(React Compiler) 도입 본격화",
      related: ["리액트 19 변경점", "react 19 use hook", "React 19 액션 함수"],
      distribution: [
        [40, 18],
        [100, 42],
        [300, 75],
        [700, 95],
      ],
    },
    {
      canonical: "글로벌 반도체 & HBM 동향",
      normalized: "semiconductor hbm",
      category: "business",
      aiSummary: "AI 데이터센터 수요 폭증에 따른 HBM3E/HBM4 공급 경쟁 및 투자 전략 분석",
      related: ["HBM4 수혜주", "엔비디아 차세대 GPU 로드맵", "글로벌 파운드리 점유율"],
      distribution: [
        [50, 15],
        [150, 35],
        [360, 65],
        [800, 85],
      ],
    },
    {
      canonical: "2026 AI 생산성 툴 추천",
      normalized: "ai productivity tools 2026",
      category: "trend",
      aiSummary: "검색, 코딩, 문서 작성을 자동화하는 차세대 AI 에이전트 도구 생태계 총정리",
      related: ["직장인 필수 AI 도구", "무료 AI 생산성 툴", "AI 검색 에이전트 비교"],
      distribution: [
        [60, 12],
        [180, 30],
        [420, 55],
        [900, 70],
      ],
    },
    {
      canonical: "Tailwind CSS v4 마이그레이션",
      normalized: "tailwind css v4",
      category: "code",
      aiSummary: "CSS 중심의 새로운 고속 Rust 기반 엔진과 간소화된 설정 파일(CSS-first) 도입",
      related: ["테일윈드 v4 설정법", "Tailwind 4 변경점", "Tailwind CSS 신규 기능"],
      distribution: [
        [90, 10],
        [240, 25],
        [500, 45],
        [1000, 60],
      ],
    },
    {
      canonical: "Vercel AI SDK v6 스트리밍",
      normalized: "vercel ai sdk v6",
      category: "code",
      aiSummary: "Server-Sent Events(SSE) 파이프라인 및 멀티에이전트 툴 호출 표준화 라이브러리",
      related: ["AI SDK useChat 사용법", "Vercel AI 스트리밍 툴콜", "AI SDK 6 마이그레이션"],
      distribution: [
        [120, 8],
        [300, 20],
        [600, 35],
        [1200, 50],
      ],
    },
    {
      canonical: "우주 탐사 아르테미스 프로젝트",
      normalized: "artemis space",
      category: "academic",
      aiSummary: "달 궤도 유인 탐사선 발사 일정과 차세대 우주 정거장 게이트웨이 추진 현황",
      related: ["아르테미스 2호 발사일", "NASA 유인 달 착륙 계획", "스페이스X 스타십 시험비행"],
      distribution: [
        [150, 6],
        [360, 15],
        [720, 28],
        [1400, 40],
      ],
    },
  ];

  const map = new Map<string, TopicData>();

  for (const cfg of seedConfigs) {
    const timestamps: number[] = [];
    for (const [minutesAgo, count] of cfg.distribution) {
      for (let i = 0; i < count; i++) {
        // 균등 및 약간의 지터(jitter) 부여
        const jitter = Math.floor(Math.random() * (minute * 5)) - minute * 2;
        timestamps.push(now - minutesAgo * minute + jitter);
      }
    }
    // 내림차순 정렬
    timestamps.sort((a, b) => b - a);

    map.set(cfg.normalized, {
      canonicalKeyword: cfg.canonical,
      normalizedKey: cfg.normalized,
      category: cfg.category,
      aiSummary: cfg.aiSummary,
      relatedQueries: new Set(cfg.related),
      timestamps,
    });
  }

  return map;
}

/**
 * 인메모리 싱글톤 스토어 (서버리스 런타임 캐시)
 */
class TrendingStore {
  private topics: Map<string, TopicData>;
  private isRedisConfigured: boolean;

  constructor() {
    this.topics = createInitialSeedData();
    this.isRedisConfigured = Boolean(
      process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.REDIS_URL
    );
  }

  /**
   * 새 검색 쿼리 기록 및 유사 클러스터 병합 처리
   */
  public recordQuery(query: string, category: TrendCategory = "trend"): ClusteredKeyword {
    const now = Date.now();
    const cleanQuery = query.trim();

    // 1. 기존 클러스터 매칭 시도
    const existingList = Array.from(this.topics.values()).map((t) => ({
      canonicalKeyword: t.canonicalKeyword,
      normalizedKey: t.normalizedKey,
    }));

    const matched = findMatchingCluster(cleanQuery, existingList);

    let topic: TopicData;

    if (matched) {
      topic = this.topics.get(matched.normalizedKey)!;
      topic.relatedQueries.add(cleanQuery);
      topic.timestamps.unshift(now);
    } else {
      // 새로운 클러스터 생성
      const normalizedKey = normalizeQuery(cleanQuery);
      topic = {
        canonicalKeyword: cleanQuery,
        normalizedKey,
        category,
        aiSummary: `최근 사용자들이 주목하고 있는 실시간 탐색 질의 (${cleanQuery})`,
        relatedQueries: new Set([cleanQuery]),
        timestamps: [now],
      };
      this.topics.set(normalizedKey, topic);
    }

    // 최대 500개 타임스탬프까지만 보관 (메모리 최적화)
    if (topic.timestamps.length > 500) {
      topic.timestamps = topic.timestamps.slice(0, 500);
    }

    const { trendingScore, velocityScore, status } = calculateAggregateScore(
      topic.timestamps,
      "24h",
      now
    );

    return {
      canonicalKeyword: topic.canonicalKeyword,
      normalizedKey: topic.normalizedKey,
      relatedQueries: Array.from(topic.relatedQueries).slice(0, 5),
      rawCount: topic.timestamps.length,
      trendingScore,
      velocityScore,
      category: topic.category,
      status,
      aiSummary: topic.aiSummary,
      lastSearchedAt: now,
    };
  }

  /**
   * 기간 및 카테고리에 따른 트렌딩 랭킹 목록 계산 및 반환
   */
  public getTrending(
    period: TimePeriod = "24h",
    category: TrendCategory = "all"
  ): {
    items: ClusteredKeyword[];
    totalQueriesTracked: number;
    infraMode: "redis_kv" | "in_memory_lru";
  } {
    const now = Date.now();
    let totalQueries = 0;
    const scoredList: ClusteredKeyword[] = [];

    for (const topic of this.topics.values()) {
      if (category !== "all" && topic.category !== category) {
        continue;
      }

      const { trendingScore, velocityScore, status, periodCount } = calculateAggregateScore(
        topic.timestamps,
        period,
        now
      );

      totalQueries += periodCount;

      // 해당 기간 내 검색이 발생한 항목만 포함
      if (periodCount > 0 || trendingScore > 0) {
        scoredList.push({
          canonicalKeyword: topic.canonicalKeyword,
          normalizedKey: topic.normalizedKey,
          relatedQueries: Array.from(topic.relatedQueries).slice(0, 5),
          rawCount: periodCount,
          trendingScore,
          velocityScore,
          category: topic.category,
          status,
          aiSummary: topic.aiSummary,
          lastSearchedAt: topic.timestamps[0] || now,
        });
      }
    }

    // 시간 감쇠 스코어 내림차순 정렬
    scoredList.sort((a, b) => {
      // 1순위: 트렌딩 스코어
      if (b.trendingScore !== a.trendingScore) {
        return b.trendingScore - a.trendingScore;
      }
      // 2순위: 급상승 속도(Velocity)
      return b.velocityScore - a.velocityScore;
    });

    return {
      items: scoredList.slice(0, 15),
      totalQueriesTracked: totalQueries,
      infraMode: this.isRedisConfigured ? "redis_kv" : "in_memory_lru",
    };
  }

  /**
   * 특정 키워드 삭제 (관리자 기능)
   */
  public deleteKeyword(normalizedKey: string): boolean {
    return this.topics.delete(normalizedKey);
  }

  /**
   * 초기화
   */
  public resetToDefault(): void {
    this.topics = createInitialSeedData();
  }
}

// 전역 싱글톤 인스턴스
export const trendingStore = new TrendingStore();
