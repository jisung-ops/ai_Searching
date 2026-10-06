export type TimePeriod = "1h" | "24h" | "7d";

export type TrendCategory = "all" | "ai" | "code" | "business" | "academic" | "trend";

export interface SearchEvent {
  query: string;
  timestamp: number; // Date.now()
  category?: TrendCategory;
}

export type RankDeltaType = "up" | "down" | "same" | "new";

export interface RankDelta {
  type: RankDeltaType;
  amount: number;             // 순위 변동 수 (up/down 시 양수, same/new 시 0)
  previousRank?: number | null; // 직전 기준 시점 순위 (1-indexed, 신규일 경우 null)
}

export interface ClusteredKeyword {
  canonicalKeyword: string; // 대표 정규화 검색어 (예: "DeepSeek V3")
  normalizedKey: string;     // 정규화 키 (예: "deepseek v3")
  relatedQueries: string[];  // 묶인 유사 검색어 목록 (예: ["딥시크 V3 사용법", "DeepSeek v3 벤치마크", "딥시크 V3 성능"])
  rawCount: number;          // 총 검색 발생 횟수
  trendingScore: number;     // 시간 감쇠(Time-decay)가 적용된 최종 가중치 스코어
  velocityScore: number;     // 최근 1시간 내 급상승 변화율 (+% 또는 배수)
  category: TrendCategory;
  status: "hot" | "rising" | "new";
  aiSummary: string;         // 왜 화제인지 AI 1줄 설명 (Why It's Trending)
  lastSearchedAt: number;
  rankDelta: RankDelta;      // 순위 변동 지표 (▲/▼/NEW/-)
}

export interface TrendingResponse {
  period: TimePeriod;
  category: TrendCategory;
  totalQueriesTracked: number;
  items: ClusteredKeyword[];
  engineInfo: {
    algorithm: string;
    decayFactor: number;
    halfLifeHours: number;
    clusteringMethod: string;
    infraMode: "redis_kv" | "in_memory_lru";
  };
}
