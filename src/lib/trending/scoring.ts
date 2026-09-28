import { TimePeriod } from "./types";

/**
 * 시간 감쇠(Time-decay) 가중치 산출 파라미터
 * Hacker News / Reddit 가중치 스코어링 알고리즘 변형
 */
const HALF_LIFE_HOURS = 3.0; // 3시간이 지나면 검색 이벤트의 영향력이 절반으로 감소
const GRAVITY = 1.5;        // 감쇠 경사도 (지수)

/**
 * 단일 검색 이벤트 발생 시점(timestamp)에 대한 현재 시각 기준 가중치 계산
 * Formula: Weight = 1 / (1 + (deltaHours / halfLife) ^ gravity)
 */
export function calculateEventWeight(
  eventTimestamp: number,
  now = Date.now(),
  halfLifeHours = HALF_LIFE_HOURS,
  gravity = GRAVITY
): number {
  const deltaMs = Math.max(0, now - eventTimestamp);
  const deltaHours = deltaMs / (1000 * 60 * 60);

  const decay = Math.pow(1 + deltaHours / halfLifeHours, gravity);
  return 1 / decay;
}

/**
 * 기간(TimePeriod)에 따른 타임스탬프 필터링 기준 시간(ms) 반환
 */
export function getPeriodThresholdMs(period: TimePeriod, now = Date.now()): number {
  switch (period) {
    case "1h":
      return now - 1 * 60 * 60 * 1000;
    case "24h":
      return now - 24 * 60 * 60 * 1000;
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    default:
      return now - 24 * 60 * 60 * 1000;
  }
}

/**
 * 이벤트 타임스탬프 배열을 받아 총 시간 감쇠 스코어 및 급상승(Velocity) 지수 계산
 */
export function calculateAggregateScore(
  timestamps: number[],
  period: TimePeriod = "24h",
  now = Date.now()
): {
  trendingScore: number;
  velocityScore: number;
  status: "hot" | "rising" | "new";
  periodCount: number;
} {
  const periodThreshold = getPeriodThresholdMs(period, now);
  const oneHourThreshold = now - 1 * 60 * 60 * 1000;
  const twentyFourHoursThreshold = now - 24 * 60 * 60 * 1000;

  let totalDecayedScore = 0;
  let last1HourScore = 0;
  let last24HoursScore = 0;
  let periodCount = 0;

  for (const ts of timestamps) {
    if (ts >= periodThreshold) {
      periodCount++;
      const weight = calculateEventWeight(ts, now);
      totalDecayedScore += weight;
    }

    if (ts >= oneHourThreshold) {
      last1HourScore += calculateEventWeight(ts, now);
    }
    if (ts >= twentyFourHoursThreshold) {
      last24HoursScore += calculateEventWeight(ts, now);
    }
  }

  // 급상승 비율(Velocity): 최근 1시간 검색 비중이 24시간 평균 대비 얼마나 높은지 산출
  // 기대 1시간 평균 = (last24HoursScore / 24)
  const expected1HourAvg = Math.max(0.1, last24HoursScore / 24);
  const velocityRatio = last1HourScore / expected1HourAvg;

  // 상태(Status) 분류
  let status: "hot" | "rising" | "new" = "rising";

  // 등록된 지 30분 이내이거나 이벤트 수가 적은 경우 'new'
  const oldestInSample = timestamps.length > 0 ? Math.min(...timestamps) : now;
  const isRecentNew = now - oldestInSample < 30 * 60 * 1000 && timestamps.length <= 5;

  if (isRecentNew) {
    status = "new";
  } else if (velocityRatio >= 2.5 || totalDecayedScore >= 50) {
    status = "hot";
  } else {
    status = "rising";
  }

  return {
    trendingScore: Math.round(totalDecayedScore * 10) / 10,
    velocityScore: Math.round(velocityRatio * 10) / 10,
    status,
    periodCount,
  };
}
