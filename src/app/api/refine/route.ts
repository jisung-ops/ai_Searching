import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Initialize Google Gemini provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const maxDuration = 15;

export async function POST(req: Request) {
  try {
    const { query, focusMode = "all" } = await req.json();

    if (!query || !query.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const trimmedQuery = query.trim();

    // Check if Gemini API key exists
    const hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    if (hasApiKey) {
      try {
        const systemPrompt = `너는 사용자의 검색 질문(쿼리)을 분석하고, 더 정확하고 고품질의 웹 검색 결과를 얻을 수 있도록 질문을 구체화하는 "질문 가이드라인" 생성 전문가야.
사용자가 입력한 검색어와 검색 포커스 모드(Focus Mode)를 바탕으로 질문을 다각도로 분석하여 아래의 JSON 구조만 반환해줘.
JSON 외에 마크다운 기호(\`\`\`json)나 추가적인 설명, 인사말 등을 절대 포함하지 말고 순수한 JSON 문자열만 출력해야 해.

JSON 스키마:
{
  "motivation": "이 검색어에 대해 더 유용하고 신뢰성 있는 결과를 얻기 위해 질문을 어떻게 정교화하면 좋을지 조언하는 메시지 (한국어로 친절하게 1~2문장)",
  "clarifyingQuestions": [
    {
      "title": "첫 번째 명확화 질문 (예: 구체적인 프레임워크 버전이나 대상을 지정해 보세요)",
      "options": ["옵션 1", "옵션 2", "옵션 3"]
    },
    {
      "title": "두 번째 명확화 질문 (예: 어떤 구체적 관점에서의 조사에 집중하고 싶으신가요?)",
      "options": ["옵션 1", "옵션 2", "옵션 3"]
    }
  ],
  "refinedSuggestions": [
    "구체화된 추천 질문 문장 1 (예: Next.js 15 App Router에서 데이터 페칭 최적화 방법)",
    "구체화된 추천 질문 문장 2 (예: Next.js 14와 15 App Router의 차이점 및 마이그레이션 가이드)",
    "구체화된 추천 질문 문장 3 (예: Next.js App Router에서 서버 액션 보안성 설정)"
  ]
}

주의사항:
1. 'clarifyingQuestions'의 각 질문 옵션은 사용자가 클릭하기 쉽도록 10글자 내외의 짧고 명확한 어절로 구성할 것.
2. 'refinedSuggestions'는 사용자의 원래 질문을 확장하여 실제 검색 결과가 아주 훌륭하게 나올 수 있는 구체적이고 완성도 높은 문장으로 3개 작성할 것.
3. 절대 JSON 구조 이외의 다른 텍스트를 출력하지 마시오.`;

        const userPrompt = `사용자 입력 검색어: "${trimmedQuery}"\n검색 포커스 모드: "${focusMode}"`;

        const { text } = await generateText({
          model: google("gemini-2.5-flash"),
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.2,
        });

        // Clean up markdown block if model output includes it
        let cleanText = text.trim();
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

        // Extract JSON object if there is leading/trailing text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanText = jsonMatch[0];
        }

        const data = JSON.parse(cleanText);
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      } catch (err) {
        console.error("Gemini refinement generation failed, falling back to rule-based:", err);
      }
    }

    // Fallback logic if no API key or generation failed
    const fallbackData = generateFallbackRefinement(trimmedQuery, focusMode);
    return new Response(JSON.stringify(fallbackData), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("API Refine route error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Smart rule-based fallback generator
function generateFallbackRefinement(query: string, focusMode: string) {
  const lowerQuery = query.toLowerCase();

  // Tech / Coding keywords
  const isCoding =
    focusMode === "code" ||
    /next|react|vue|svelte|javascript|typescript|js|ts|python|java|spring|node|html|css|code|programming|github|api|database|sql|docker|git|코딩|개발|서버|웹/.test(
      lowerQuery
    );

  // Science / Academic keywords
  const isAcademic =
    focusMode === "academic" ||
    /arxiv|science|wikipedia|thesis|research|superconductor|physics|quantum|math|chemistry|space|논문|연구|초전도체|물리|양자|수학|과학|우주|위키/.test(
      lowerQuery
    );

  // Social / Trend keywords
  const isSocial =
    focusMode === "social" ||
    /youtube|reddit|twitter|sns|opinion|trend|marketing|opinion|news|유튜브|레딧|트위터|여론|트렌드|반응|뉴스/.test(
      lowerQuery
    );

  if (isCoding) {
    return {
      motivation: `개발 관련 질문 "${query}"에 대해 기술 스택, 버전, 개발 목적 등을 정교화하면 문제 해결률이 훨씬 올라갑니다.`,
      clarifyingQuestions: [
        {
          title: "개발 중이신 주된 환경/버전이 어떻게 되나요?",
          options: ["최신 안정 버전", "구버전 (레거시)", "상관없음"]
        },
        {
          title: "어떤 성격의 솔루션을 중점적으로 찾으시나요?",
          options: ["동작 가능한 예제", "원리와 개념 설명", "최적화 및 보안"]
        }
      ],
      refinedSuggestions: [
        `실무 관점에서의 "${query}" 구현 모범 사례와 문제 해결 방법`,
        `"${query}"의 핵심 원리와 내부 동작 방식 상세 가이드`,
        `"${query}" 연동 시 주로 발생하는 성능 저하 요인 및 최적화 기법`
      ]
    };
  }

  if (isAcademic) {
    return {
      motivation: `학술/과학 질문 "${query}"에 대해 이론적 배경, 연구 범위, 상세 개념 수준을 지정하여 신뢰성 있는 논문 및 백과 지식을 정리합니다.`,
      clarifyingQuestions: [
        {
          title: "어떤 문헌 범위에 중점을 두고 싶으신가요?",
          options: ["공식 정의 (위키)", "최신 동향 (arXiv)", "피어 리뷰 논문"]
        },
        {
          title: "원하시는 설명의 깊이를 선택해 주세요.",
          options: ["대중적인 쉬운 요약", "전문 연구원 수준", "수식/실험 데이터 포함"]
        }
      ],
      refinedSuggestions: [
        `"${query}"의 이론적 배경과 과학적 정의 규명`,
        `최근 학계에서 논의되고 있는 "${query}" 관련 주요 쟁점과 한계`,
        `실험 및 실증 분석 관점에서의 "${query}" 연구 결과 요약`
      ]
    };
  }

  if (isSocial) {
    return {
      motivation: `소셜/유튜브 관련 트렌드 질문 "${query}"에 대해 타겟 플랫폼과 여론 조사 대상, 시점을 구체화하면 대중의 실제 반응을 정확히 수집할 수 있습니다.`,
      clarifyingQuestions: [
        {
          title: "여론 분석의 중심 플랫폼을 지정해 보세요.",
          options: ["유튜브 비디오 반응", "레딧/커뮤니티 토론", "종합 소셜 미디어"]
        },
        {
          title: "반응 수집 대상을 분류해 볼까요?",
          options: ["전문 크리에이터 분석", "일반 사용자 후기", "상반된 여론 대조"]
        }
      ],
      refinedSuggestions: [
        `최근 커뮤니티에서 "${query}"를 둘러싸고 일어난 주요 논쟁 요약`,
        `소셜 미디어 유저들의 "${query}" 실사용 리뷰 및 평판 대조`,
        `대중적인 관점에서 본 "${query}"의 트렌드 예측 및 성공 요인 분석`
      ]
    };
  }

  // Default General Refinement
  return {
    motivation: `"${query}" 검색어에 대해 리서치 하시는 목적과 초점을 명확히 좁히면 훨씬 구체적이고 만족스러운 답변을 받아볼 수 있습니다.`,
    clarifyingQuestions: [
      {
        title: "질문의 목적을 구체화해 보시겠습니까?",
        options: ["기본 개념 이해", "실무 적용 사례", "최신 기술/트렌드"]
      },
      {
        title: "답변에서 원하는 상세 설명 수준을 선택해 주세요.",
        options: ["3줄 이내 요약", "표/비교 분석 포함", "심층 전문 보고서"]
      }
    ],
    refinedSuggestions: [
      `"${query}"의 핵심 정의 및 원리 알기 쉽게 정리해줘`,
      `실제 활용 시 유용한 "${query}" 가이드라인 및 핵심 포인트`,
      `"${query}" 도입으로 얻을 수 있는 장단점 및 리스크 관리 팁`
    ]
  };
}
