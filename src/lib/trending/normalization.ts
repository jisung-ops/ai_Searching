/**
 * 검색어 정규화(Normalization) & 유사 검색어 클러스터링(Clustering) 엔진
 * - 한영 음차 정규화 (딥시크 -> deepseek, 리액트 -> react 등)
 * - 불용어 및 조사 제거
 * - Bigram 토큰 기반 Jaccard 유사도 계산을 통한 자동 토픽 그룹핑
 */

// 흔히 쓰이는 영한 음차 매핑 딕셔너리
const PHONETIC_MAPPINGS: Record<string, string> = {
  딥시크: "deepseek",
  딥시크v3: "deepseek v3",
  딥시크r1: "deepseek r1",
  리액트: "react",
  리액트19: "react 19",
  넥스트: "nextjs",
  넥스트js: "nextjs",
  제미나이: "gemini",
  제미니: "gemini",
  챗gpt: "chatgpt",
  챗지피티: "chatgpt",
  클로드: "claude",
  파이썬: "python",
  테일윈드: "tailwind",
  테일윈드css: "tailwind css",
  양자컴퓨터: "quantum computer",
  비트코인: "bitcoin",
};

// 검색어 군집화 시 제거할 불용어/조사/수식어
const STOPWORDS = new Set([
  "사용법", "방법", "하는법", "정리", "요약", "비교", "성능", "벤치마크",
  "최신", "뉴스", "추천", "가이드", "튜토리얼", "원리", "설치", "오류",
  "스펙", "시세", "전망", "분석", "도구", "활용", "모음", "버전",
  "이란", "란", "이란?", "란?", "은", "는", "이", "가", "을", "를", "의", "에", "과", "와",
  "about", "how", "to", "guide", "tutorial", "vs", "versus", "benchmark", "review"
]);

/**
 * 쿼리 문자열 정규화:
 * 1. 소문자화 및 특수문자 제거
 * 2. 음차 변환 (딥시크 -> deepseek 등)
 * 3. 불용어 및 조사 필터링
 */
export function normalizeQuery(query: string): string {
  if (!query) return "";

  let cleaned = query.toLowerCase().trim();

  // 음차 매핑 치환
  for (const [kr, en] of Object.entries(PHONETIC_MAPPINGS)) {
    if (cleaned.includes(kr)) {
      cleaned = cleaned.replaceAll(kr, en);
    }
  }

  // 특수문자 제거 (영문, 한글, 숫자, 공백 유지)
  cleaned = cleaned.replace(/[^a-zA-Z0-9가-힣\s]/g, " ");

  // 단어 분리 및 불용어 제거
  const tokens = cleaned
    .split(/\s+/)
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));

  return tokens.join(" ").trim() || cleaned.trim();
}

/**
 * N-gram (Bi-gram) 생성기
 */
function getBiGrams(str: string): Set<string> {
  const clean = str.replace(/\s+/g, "");
  const grams = new Set<string>();
  if (clean.length < 2) {
    grams.add(clean);
    return grams;
  }
  for (let i = 0; i < clean.length - 1; i++) {
    grams.add(clean.substring(i, i + 2));
  }
  return grams;
}

/**
 * Jaccard 유사도 계산 (0.0 ~ 1.0)
 */
export function calculateJaccardSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeQuery(str1);
  const norm2 = normalizeQuery(str2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // 한쪽이 다른 쪽에 완전히 포함되는 경우 높은 유사도 부여
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    if (minLen / maxLen >= 0.5) return 0.85;
  }

  const setA = getBiGrams(norm1);
  const setB = getBiGrams(norm2);

  let intersectionCount = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersectionCount++;
  });

  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * 검색어를 가장 적합한 대표 토픽(Canonical Keyword)으로 매칭하거나 클러스터링 판별
 */
export function findMatchingCluster(
  query: string,
  existingClusters: { canonicalKeyword: string; normalizedKey: string }[],
  threshold = 0.6
): { canonicalKeyword: string; normalizedKey: string } | null {
  const normalized = normalizeQuery(query);

  for (const cluster of existingClusters) {
    // 1. 정규화 키 완전 일치
    if (cluster.normalizedKey === normalized) {
      return cluster;
    }

    // 2. Jaccard 유사도 검사
    const sim = calculateJaccardSimilarity(query, cluster.canonicalKeyword);
    if (sim >= threshold) {
      return cluster;
    }
  }

  return null;
}
