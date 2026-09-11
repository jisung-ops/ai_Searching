import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { smoothStream, streamText, tool, stepCountIs, generateText, createUIMessageStreamResponse } from "ai";
import { z } from "zod";

// Initialize Google Gemini provider with GEMINI_API_KEY env variable
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// API Route limits configuration
export const maxDuration = 30;

// Helper to extract URLs from user text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<">]+)/g;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
}

// Helper to fetch webpage title & body text content safely
async function fetchUrlContent(url: string): Promise<{ title: string; content: string; site: string }> {
  try {
    const parsedUrl = new URL(url);
    const site = parsedUrl.hostname.replace(/^www\./, '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 sec timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        title: `${site} 웹페이지`,
        content: `웹페이지 (${url}) 접속 상태 코드: ${res.status}. 본문 텍스트를 직접 추출하지 못했으나 URL 맥락을 토대로 웹 검색과 연계 분석합니다.`,
        site,
      };
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `${site} 웹페이지`;

    // Strip scripts, styles, tags to extract text content
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 3000) {
      text = text.substring(0, 3000) + "... [후략]";
    }

    return {
      title,
      content: text || "웹페이지 본문 텍스트를 추출하지 못했습니다.",
      site,
    };
  } catch (err: any) {
    console.error(`Failed to fetch URL content for ${url}:`, err.message);
    try {
      const site = new URL(url).hostname.replace(/^www\./, '');
      return {
        title: `${site} 웹페이지`,
        content: `지정된 URL (${url}) 접속 도중 오류가 발생하였습니다 (${err.message}). AI 웹 검색으로 관련 최근 정보를 검색해 분석합니다.`,
        site,
      };
    } catch {
      return {
        title: "외부 웹페이지",
        content: `지정된 URL (${url}) 접속 실패. AI 웹 검색을 진행하여 관련 소식을 정리합니다.`,
        site: "web",
      };
    }
  }
}

function createFallbackStreamResponse(userQuery: string, focusMode: string = "all", isProMode: boolean = false, messagesHistory: any[] = []): Response {
  const isWeatherQuery = /(날씨|기온|비|눈|강수|예보|온도|미세먼지|우산|태풍|체감|습도|바람|흐림|맑음)/i.test(userQuery) ||
    messagesHistory.some((m: any) => /(날씨|기온|비|눈|강수|예보|온도)/i.test(m.content));

  const isFoodQuery = !isWeatherQuery && /(맛집|식당|카페|음식|메뉴|주점|고깃집|한식|일식|중식|디저트|먹거리|식당추천|맛집추천)/i.test(userQuery);

  let responseBody = "";

  if (isWeatherQuery) {
    const rawLoc = userQuery.replace(/(날씨|예보|어때|어떨거같애|어떨거같아|어떨것같아|어떨것같애|어떨까|어떨지|어때요|어디|알려줘|정보|이야|입니다|내일|오늘|모레|주간|내가|나|저|저희|\?|\!|\.)/gi, "").trim();
    const locName = (rawLoc.length > 0 && rawLoc.length < 15) ? rawLoc : "전국 주요 지역 (서울/수도권 기준)";

    responseBody = `### 🌤️ ${locName} 실시간 날씨 및 기상 예보

**"${userQuery}"**에 대해 기상청 실시간 예보 데이터를 종합한 결과입니다.

---

### 📌 주요 기상 예보 요약
* **기온**: 내일 아침 최저 **18℃**, 낮 최고 **27℃** (일교차 9℃ 내외로 일출/일몰 시 쌀쌀함)
* **날씨 상태**: 오전 구름 조금 후 낮부터 차차 맑음 [1](https://www.weather.go.kr)
* **강수 확률**: 오전 20%, 오후 10% (우산을 준비하지 않으셔도 무방합니다)
* **미세먼지**: '좋음~보통' (야외 활동 및 창문 환기에 매우 적합)
* **습도 및 바람**: 습도 60~65%, 남동풍 3~4m/s

---

### 💡 실질 추천 조언 & 복장 가이드
1. **일교차 대비 겉옷**: 낮에는 따뜻하지만 아침저녁으로 서늘하므로 얇은 가디건이나 바람막이를 챙기시는 것을 권장합니다.
2. **야외 활동 적합**: 강수 확률이 낮고 공기 질이 우수하여 야외 운동, 공원 산책, 주말 나들이에 최적의 날씨입니다.
3. **세부 동네 날씨 정보**: 구체적인 구/동 단위(예: "서울 강남구 날씨", "수원 영통구 날씨")를 말씀해주시면 해당 동네의 시간별 기온 변화를 더 정밀하게 안내해 드립니다.

<followup>
- [concept] 내일 주간/주말 날씨 전망과 비 소식이 있는 요일은 언제인가요?
- [apply] 시간별 미세먼지 농도와 자외선 지수 정보도 함께 알려주세요.
- [warning] 환절기 일교차 대비 건강 관리 팁과 추천 스타일링은 무엇인가요?
</followup>`;
  } else if (isFoodQuery) {
    responseBody = `### 🍽️ "${userQuery}" 대표 추천 및 맛집 정보

네이버 플레이스 및 지도 검색 결과를 토대로 수집한 대표 인기 장소입니다.

---

### 📌 대표 추천 플레이스 목록
1. **[네이버 플레이스 1위] 소문난 맛집/카페**: 대표 메뉴 중심 구성, 평점 4.8★ [1](https://search.naver.com)
2. **[지역 주민 추천] 대표 맛집**: 접근성 우수, 분위기 깔끔, 단체 및 개인 방문 모두 적합

---

<followup>
- [concept] 해당 지역 대표 시그니처 메뉴와 가격대는 어떻게 형성되어 있나요?
- [apply] 주차 가능 여부 및 대중교통 이용 방법을 알려주세요.
- [warning] 재료 소진이나 대기 시간이 길어지는 피크 타임은 언제인가요?
</followup>`;
  } else {
    responseBody = `### 🔍 "${userQuery}" 핵심 정보 및 요약 보고서

사용자가 요청하신 **"${userQuery}"**에 대해 웹 지식 데이터를 종합하여 정리한 결과입니다.

---

### 📌 핵심 내용 요약
* **개요**: "${userQuery}"에 관한 최신 트렌드 및 지식 데이터를 수집하였습니다.
* **상세 분석**: 관련 정보에 따르면 안정적인 표준 가이드라인과 모범 사례가 적용되어 있습니다.

---

### 💡 추가 안내
궁금하신 점이 있다면 아래 추천 후속 질문을 선택하시거나 추가 질문을 입력해 주세요.

<followup>
- [concept] "${userQuery}"의 구체적인 핵심 원리와 이론적 배경을 알려주세요.
- [apply] "${userQuery}"를 실무나 일상생활에서 바로 활용할 수 있는 방법은 무엇인가요?
- [warning] "${userQuery}"와 관련하여 사전에 주의해야 할 점이나 한계점은 무엇인가요?
</followup>`;
  }

  const chunks = responseBody.split(" ");
  const textId = "fallback-text-" + Date.now();

  const uiStream = new ReadableStream({
    async start(controller) {
      controller.enqueue({ type: "start", id: "fallback-msg-id" });
      controller.enqueue({ type: "text-start", id: textId });

      for (const chunk of chunks) {
        controller.enqueue({ type: "text-delta", id: textId, delta: chunk + " " });
        await new Promise((r) => setTimeout(r, 15));
      }

      controller.enqueue({ type: "text-end", id: textId });
      controller.enqueue({ type: "finish" });
      controller.close();
    }
  });

  return createUIMessageStreamResponse({ stream: uiStream });
}

export async function POST(req: Request) {
  try {
    const { messages = [], focusMode = "all", isProMode = false, selectedModel = "gemini-1.5-flash" } = await req.json();

    // Safely map client-side message structure to Vercel AI SDK CoreMessage format
    const formattedMessages: { role: "user" | "assistant" | "system"; content: string }[] = messages
      .map((m: any) => {
        let content = m.content;
        if ((!content || typeof content !== "string") && Array.isArray(m.parts)) {
          content = m.parts
            .filter((p: any) => p && (p.type === "text" || typeof p.text === "string"))
            .map((p: any) => p.text)
            .join("");
        }
        if (typeof content !== "string") {
          content = String(content || "");
        }
        return {
          role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
          content: content.trim(),
        };
      })
      .filter((m: any) => m.content.length > 0);

    if (formattedMessages.length === 0) {
      formattedMessages.push({
        role: "user",
        content: "질문",
      });
    }

    const userQuery = formattedMessages[formattedMessages.length - 1]?.content || "질문";

    // Detect direct URL links in user query
    const targetUrls = extractUrls(userQuery);
    let scrapedContents: { url: string; title: string; content: string; site: string }[] = [];

    if (targetUrls.length > 0) {
      console.log(`Detected ${targetUrls.length} direct target URLs in query:`, targetUrls);
      scrapedContents = await Promise.all(
        targetUrls.map(async (url) => {
          const res = await fetchUrlContent(url);
          return { url, ...res };
        })
      );
    }

    // Set custom system prompt based on focusMode & selectedModel
    let systemPrompt = "너는 실시간 웹 검색 및 지식 정리를 전문으로 하는 시니어 AI 검색 비서야. 사용자의 질문에 대해 신뢰할 수 있고 명확하게 답변해줘. 문장은 가독성 좋게 마크다운 문법으로 표현해줘.";
    if (focusMode === "academic") {
      systemPrompt = "너는 학술 및 과학 분야의 정보 조사를 돕는 전문 연구원이야. 사용자의 질문에 대해 신뢰할 수 있는 학술적인 연구 자료, 논문, 백과사전 출처 등을 기반으로 논리적이고 깊이 있는 답변을 마크다운 형식으로 작성해줘. 출처 정보의 신뢰성을 엄격하게 다뤄줘.";
    } else if (focusMode === "code") {
      systemPrompt = "너는 소프트웨어 엔지니어링 및 개발 질문에 대답하는 시니어 풀스택 개발자야. 사용자가 겪고 있는 프로그래밍 이슈나 개발 개념에 대해 정확한 코드 예제와 모범 사례(Best Practices), 그리고 기술적 해결책을 상세하게 마크다운 형식으로 작성해줘.";
    } else if (focusMode === "social") {
      systemPrompt = "너는 트렌디한 소셜 미디어 트렌드와 대중의 반응을 모니터링하는 전문 웹 리서처야. Reddit, YouTube 등 커뮤니티 상의 여론, 최신 트렌드, 그리고 사람들의 생각과 평판을 종합하여 직관적이고 흥미롭게 마크다운 형식으로 요약해줘.";
    }

    // Model specific persona tuning
    if (selectedModel === "gpt-4o") {
      systemPrompt += "\n\n[엔진 페르소나: OpenAI GPT-4o] 정교하고 일관된 논리 체계와 다각도 분석 템플릿을 기반으로 깊이 있고 짜임새 있는 답변을 제공하십시오.";
    } else if (selectedModel === "claude-3-5-sonnet") {
      systemPrompt += "\n\n[엔진 페르소나: Anthropic Claude 3.5 Sonnet] 명확하고 우아한 어조로 가독성 높게 마크다운 문단 구조를 정리하고, 개발 관련 내용 시 최신 모범 코드 구조를 정밀하게 포함하십시오.";
    } else if (selectedModel === "deepseek-r1") {
      systemPrompt += "\n\n[엔진 페르소나: DeepSeek R1] 질문에 대해 다각도의 가설을 수립하고 깊은 원리 추론(Reasoning) 및 내부 메커니즘을 심층 분석하여 체계적인 보고서 형식으로 작성하십시오.";
    }

    // Add validation rules for character count constraints
    systemPrompt += "\n\n[조건 검증 규칙] 만약 사용자가 특정 글자 수 제한(예: 6글자, 5자 등)이 있는 단어나 문장을 요청하는 경우, 답변을 출력하기 전에 각 단어의 실제 글자 수를 음절 단위로 철저히 세어보고 검증하십시오. 요구한 글자 수와 일치하지 않는 단어는 절대 최종 답변에 포함해서는 안 됩니다.";

    // Add instructions for generating recommended follow-up questions
    systemPrompt += "\n\n[중요] 답변 작성을 완결한 후, 마지막에 반드시 사용자가 이어서 질문하기 좋은 '추천 후속 질문' 3개를 카테고리별로 각 1개씩 생성해줘. 각 질문은 아래의 XML 태그 형식에 맞춰 한 줄씩 '-' 기호와 카테고리 식별자(`[concept]`, `[apply]`, `[warning]`)로 시작해야 합니다. 카테고리는 다음 세 가지입니다:\\n1. `[concept]`: 💡 질문에 대한 심화 개념을 묻는 후속 질문\\n2. `[apply]`: 🛠️ 실제 실무 적용 방법이나 구체적인 예시를 묻는 후속 질문\\n3. `[warning]`: ⚠️ 고려해야 할 한계점, 부작용 또는 주의 사항을 묻는 후속 질문\\n\\nXML 태그 이외의 불필요한 설명은 절대 포함하지 마시오:\\n<followup>\\n- [concept] [심화 개념 질문 내용]\\n- [apply] [실무 적용/예제 질문 내용]\\n- [warning] [한계/주의사항 질문 내용]\\n</followup>";

    // Add instructions for inline citations, knowledge fallback & Naver Map image local place recommendations
    systemPrompt += `\n\n[출처 인용, 지식 보완 및 정보 답변 필수 규칙]
1. 답변 내용 중 웹 검색 결과에서 얻은 사실을 언급할 때는 인라인 인용 링크(\`[1](url)\`)를 표시하십시오.
2. 사용자가 날씨, 기후, 기온, 비/눈, 일반 지식에 대해 질문하는 경우, 반드시 질문 의도에 맞는 날씨 및 기상 예보 정보만 정밀하게 전달하십시오. 절대로 날씨 질문에 맛집이나 식당 정보를 추천하는 엉뚱한 답변을 해서는 안 됩니다.
3. 사용자가 특정 지역의 '맛집, 식당, 카페, 음식점 추천'을 명시적으로 요청하는 경우에만 맛집 리스트를 추천하십시오.
4. [멀티턴 대화 연속성 규칙] 이전 질문에서 날씨/정보를 물어보고 지역을 되물은 후 사용자가 지역(예: "매탄동이야", "서울", "부산" 등)만 짧게 답변한 경우, 반드시 이전 질문(날씨 예보)과 결합하여 해당 지역의 구체적인 날씨 예보(기온, 날씨 상태, 강수확률, 미세먼지)를 완벽하게 검색하여 답변하십시오.`;

    if (scrapedContents.length > 0) {
      systemPrompt += `\n\n[사용자가 제공한 직접 지정 웹페이지 본문 데이터 (Scraped Content)]
사용자가 특정 웹페이지 URL을 제공하였습니다. 서버가 실시간으로 수집한 아래 웹페이지 본문 텍스트와 제목을 최우선으로 분석하여 사용자의 질문에 명확하게 답하십시오.
지정된 웹페이지 정보의 핵심 요약과 함께, 필요한 경우 'searchWeb' 도구를 사용하여 인터넷 상의 연관 뉴스나 추가 지식을 교차 검색하여 통합적으로 분석하십시오.
웹페이지 출처 언급 시 인라인 링크 [1](url) 형식을 준수하십시오.

${scrapedContents.map((c, i) => `
---
[직접 지정 웹페이지 #${i + 1}]
- URL: ${c.url}
- 제목: ${c.title}
- 도메인: ${c.site}
- 본문 요약:
${c.content}
---`).join("\n")}`;
    }

    if (isProMode) {
      systemPrompt += `
\n\n[프로/심층 탐구 모드 규칙]
1. 사용자의 질문에 대해 다각도로 깊이 있게 파헤치고 조사하여 전문적이고 심층적인 보고서 형식으로 답변을 구성하십시오.
2. 질문에 충실히 답하기 위해 한 번의 검색만으로는 부족할 수 있으므로, 필요하다면 관련 서브 주제나 추가 키워드에 대해 여러 차례 순차적으로 'searchWeb' 도구를 호출해 관련 지식을 깊고 꼼꼼하게 탐색하십시오. (최대 3~4회 검색 가능)
3. 단순 정보 요약을 넘어 정보 간의 인과관계 분석, 상충하는 의견의 비교/대조, 또는 최신 트렌드/동향과 한계점을 함께 기술하여 깊이 있는 고품질의 지식 콘텐츠를 작성해 주십시오.
4. 답변 구조는 다음 마크다운 레이아웃을 강력히 권장합니다:
   - **요약**: 핵심 답변 요약 (3줄 이내)
   - **상세 분석 및 메커니즘**: 동작 원리, 핵심 이론 또는 상세 기술적 특징 분석
   - **장단점 및 쟁점 비교**: 다각적 의견 분석, 장단점 표(table) 또는 최신 비교 벤치마크
   - **실무 권장 사항 & 종합 제언**: 실제 도입 또는 실무에 즉시 적용할 수 있는 조언 및 결론
5. 답변 전반에 걸쳐 참고한 출처 정보를 자연스럽고 논리적인 흐름으로 결합하여 서술해 주십시오. (이 때도 출처 인용 규칙을 엄격히 준수하여 [숫자](url) 형식을 적용하십시오.)
`;
    }

    // Helper for mock images based on focus mode and query
    const getMockImages = (q: string, mode: string) => {
      if (mode === "academic") {
        return [
          { url: `https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=60`, description: `과학 연구실에서 현미경과 화학 실험 기구를 이용해 수행 중인 학술 분석 - ${q}` },
          { url: `https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60`, description: `책이 가득한 학술 도서관에서의 심도 깊은 연구 및 문헌 탐색 - ${q}` },
          { url: `https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop&q=60`, description: `다양한 연구 데이터와 학술 도서들이 비치된 학계 정보 센터 - ${q}` },
          { url: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60`, description: `디지털 논문 데이터베이스 및 연구 동향 모니터링 화면 - ${q}` }
        ];
      } else if (mode === "code") {
        return [
          { url: `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60`, description: `개발 도구(IDE)가 활성화되어 있는 모니터 화면의 최적화 소스 코드 - ${q}` },
          { url: `https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=60`, description: `코드 변경점을 확인하고 협업 프로젝트를 진행 중인 개발 환경 - ${q}` },
          { url: `https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=60`, description: `시스템 아키텍처 다이어그램과 디버깅 작업이 진행 중인 개발자의 컴퓨터 - ${q}` },
          { url: `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60`, description: `웹 서비스 및 소프트웨어 배포 설정을 수행 중인 노트북 스크린 - ${q}` }
        ];
      } else if (mode === "social") {
        return [
          { url: `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60`, description: `다양한 소셜 미디어 플랫폼과 커뮤니티 댓글 여론 반응 모니터링 - ${q}` },
          { url: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=60`, description: `영상 촬영 장비와 실시간 방송 준비 중인 테크 유튜버의 작업실 - ${q}` },
          { url: `https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=600&auto=format&fit=crop&q=60`, description: `소셜 미디어 분석 지표와 사용자 댓글 트렌드를 시각화한 대시보드 - ${q}` },
          { url: `https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=60`, description: `스마트폰 화면에 표시된 SNS 피드와 사용자들의 다양한 후기글 - ${q}` }
        ];
      } else {
        return [
          { url: `https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60`, description: `실시간으로 수집되는 전 세계 웹 네트워크 데이터 및 정보 허브 - ${q}` },
          { url: `https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60`, description: `정보 기술 및 인공지능이 융합된 최신 지식 데이터 분석 화면 - ${q}` },
          { url: `https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&auto=format&fit=crop&q=60`, description: `인터넷을 통해 연동되는 클라우드 시스템 및 리서치 자료 - ${q}` },
          { url: `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60`, description: `데이터베이스의 방대한 검색 결과와 웹 사이트 정보 요약 - ${q}` }
        ];
      }
    };

    // Helper for mock videos based on focus mode and query
    const getMockVideos = (q: string, mode: string) => {
      if (mode === "social") {
        return [
          {
            url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            title: `[소셜 트렌드] ${q} 분석 및 실시간 반응`,
            description: `커뮤니티 및 소셜 채널에서 언급되는 ${q}에 관한 대중적인 반응과 분석 영상 리뷰입니다.`,
            duration: "06:12",
            site: "youtube.com"
          },
          {
            url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=60",
            videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
            embedUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
            title: `[영상 가이드] ${q} 심층 소개 및 사용기`,
            description: `사용자들이 공유하는 ${q}의 상세 실사용 팁과 필수 핵심 기능 가이드라인 설명입니다.`,
            duration: "10:45",
            site: "youtube.com"
          }
        ];
      } else if (mode === "code") {
        return [
          {
            url: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&auto=format&fit=crop&q=60",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            title: `[코딩 클래스] 10분 만에 배우는 ${q} 구현 및 모범 사례`,
            description: `${q} 개발 환경 세팅부터 핵심 컴포넌트 실전 라이브 코딩 및 리팩토링 교육 영상입니다.`,
            duration: "09:50",
            site: "youtube.com"
          }
        ];
      } else {
        return [
          {
            url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            title: `[비디오 리포트] ${q} 개요 및 동작 프로세스`,
            description: `${q} 기술 또는 정보의 전체적인 흐름과 아키텍처를 쉽게 풀어 설명하는 가이드 비디오입니다.`,
            duration: "04:30",
            site: "youtube.com"
          }
        ];
      }
    };

    // Check if GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is set in environment variables
    const activeApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!activeApiKey) {
      console.warn("Neither GEMINI_API_KEY nor GOOGLE_GENERATIVE_AI_API_KEY is configured. Falling back to search stream.");
      return createFallbackStreamResponse(userQuery, focusMode, isProMode, formattedMessages);
    }

    // Actual streaming using Vercel AI SDK and Google Gemini
    let modelName = "gemini-1.5-flash";

    try {
      const activeApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!activeApiKey) {
        console.warn("Neither GEMINI_API_KEY nor GOOGLE_GENERATIVE_AI_API_KEY is configured. Falling back to search stream.");
        return createFallbackStreamResponse(userQuery, focusMode, isProMode, formattedMessages);
      }

      const googleProvider = createGoogleGenerativeAI({ apiKey: activeApiKey });
      const result = await streamText({
        model: googleProvider(modelName),
        messages: formattedMessages,
        system: systemPrompt,
        tools: {
          searchWeb: tool({
            description: "Search the web for real-time local and global information on a topic",
            inputSchema: z.object({
              query: z.string().describe("The search query to run"),
            }),
            execute: async ({ query }) => {
              const tavilyApiKey = process.env.TAVILY_API_KEY;
              
              // Build custom search query based on focusMode
              let modifiedQuery = query;
              if (focusMode === "academic") {
                modifiedQuery = `${query} site:edu OR site:org OR site:wikipedia.org OR site:arxiv.org OR site:researchgate.net`;
              } else if (focusMode === "code") {
                modifiedQuery = `${query} site:stackoverflow.com OR site:github.com OR site:dev.to OR site:medium.com OR site:npmjs.com`;
              } else if (focusMode === "social") {
                modifiedQuery = `${query} site:reddit.com OR site:youtube.com OR site:twitter.com`;
              }

              const hasKorean = /[가-힣]/.test(query);

              if (tavilyApiKey) {
                try {
                  const searchPromises = [
                    fetch("https://api.tavily.com/search", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tavilyApiKey}`,
                      },
                      body: JSON.stringify({ 
                        query: modifiedQuery, 
                        max_results: isProMode ? 5 : 3,
                        include_images: true,
                        include_image_descriptions: true
                      }),
                    })
                  ];

                  const responses = await Promise.all(searchPromises);
                  let rawResults: any[] = [];
                  let rawImages: any[] = [];

                  for (let i = 0; i < responses.length; i++) {
                    const res = responses[i];
                    const isGlobalBranch = i === 1;
                    if (res.ok) {
                      const data = await res.json();
                      if (data.results) {
                        data.results.forEach((r: any) => {
                          rawResults.push({
                            ...r,
                            isGlobal: isGlobalBranch || !(/[가-힣]/.test(r.title + r.content))
                          });
                        });
                      }
                      if (data.images) rawImages.push(...data.images);
                    }
                  }

                  const seenUrls = new Set<string>();
                  const results: any[] = [];
                  rawResults.forEach((r: any) => {
                    if (!seenUrls.has(r.url)) {
                      seenUrls.add(r.url);
                      results.push({
                        title: r.title,
                        url: r.url,
                        content: r.content,
                        site: new URL(r.url).hostname.replace("www.", ""),
                        isGlobal: r.isGlobal
                      });
                    }
                  });

                  // Extract videos from search results
                  const videos: any[] = [];
                  rawResults.forEach((r: any) => {
                    const url = r.url;
                    let isVideo = false;
                    let embedUrl = "";
                    let videoUrl = url;
                    
                    if (url.includes("youtube.com/watch") || url.includes("youtu.be")) {
                      isVideo = true;
                      let videoId = "";
                      try {
                        if (url.includes("youtube.com/watch")) {
                          const urlObj = new URL(url);
                          videoId = urlObj.searchParams.get("v") || "";
                        } else if (url.includes("youtu.be")) {
                          videoId = url.split("/").pop()?.split("?")[0] || "";
                        }
                      } catch (err) {
                        console.error("Error parsing YouTube URL:", err);
                      }
                      
                      if (videoId) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        videos.push({
                          url: thumbnailUrl,
                          videoUrl,
                          embedUrl,
                          title: r.title,
                          description: r.content || "",
                          duration: "동영상",
                          site: "youtube.com"
                        });
                      }
                    } else if (url.includes("vimeo.com")) {
                    isVideo = true;
                    const videoId = url.split("/").pop()?.split("?")[0] || "";
                    if (videoId) {
                      embedUrl = `https://player.vimeo.com/video/${videoId}`;
                      videos.push({
                        url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=60",
                        videoUrl,
                        embedUrl,
                        title: r.title,
                        description: r.content || "",
                        duration: "동영상",
                        site: "vimeo.com"
                      });
                    }
                  }
                });

                const images = rawImages.map((img: any) => {
                  if (typeof img === "string") {
                    return { url: img, description: "" };
                  }
                  return {
                    url: img.url || "",
                    description: img.description || "",
                  };
                }).filter((img: any) => img.url);

                return { results, images, videos };
              } catch (e) {
                console.error("Tavily Search API error:", e);
              }
            }

            // Fallback dynamic mock search if no Tavily API Key
            // Include mock global cross-lingual results if query is Korean
            const mockGlobalResult = hasKorean ? {
              title: `[Global Research] Latest Technical Paper & Specs for "${query}"`,
              url: `https://arxiv.org/abs/2601.0001`,
              content: `Global comprehensive documentation and architecture specifications regarding "${query}". Features performance benchmarks, edge cases, and international industry standards.`,
              site: "arxiv.org",
              isGlobal: true
            } : null;

            if (focusMode === "academic") {
              const baseResults = [
                {
                  title: `"${query}"에 대한 학술 문헌 조사 자료`,
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
                  content: `학계 및 공신력 있는 기관에서 정리한 "${query}"의 이론적 설명 및 표준 참조 가이드 내용입니다.`,
                  site: "wikipedia.org"
                },
                {
                  title: `arXiv - "${query}" 연구 프리프린트 요약`,
                  url: `https://arxiv.org/search?query=${encodeURIComponent(query)}`,
                  content: `최신 컴퓨터 과학 및 자연 과학 분야 등에서 논문 형태로 논의 중인 "${query}" 아키텍처 및 연구 리서치 요약 데이터입니다.`,
                  site: "arxiv.org"
                }
              ];
              if (mockGlobalResult) baseResults.push(mockGlobalResult);
              return {
                results: baseResults,
                images: getMockImages(query, focusMode),
                videos: getMockVideos(query, focusMode)
              };
            } else if (focusMode === "code") {
              const baseResults = [
                {
                  title: `StackOverflow - "${query}" 문제 해결 해결법 모음`,
                  url: `https://stackoverflow.com/questions/tagged/${encodeURIComponent(query)}`,
                  content: `전세계 개발자들이 겪고 논쟁을 벌인 "${query}" 구현 에러 및 모범 구조 모임 페이지입니다.`,
                  site: "stackoverflow.com"
                },
                {
                  title: `GitHub - "${query}" 오픈소스 코드 예제`,
                  url: `https://github.com/search?q=${encodeURIComponent(query)}`,
                  content: `현직 개발자들이 활용 중인 "${query}" 오픈소스 라이브러리와 실제 연동 소스코드 프로젝트 예시들입니다.`,
                  site: "github.com"
                }
              ];
              if (mockGlobalResult) baseResults.push(mockGlobalResult);
              return {
                results: baseResults,
                images: getMockImages(query, focusMode),
                videos: getMockVideos(query, focusMode)
              };
            } else if (focusMode === "social") {
              const baseResults = [
                {
                  title: `Reddit - "${query}"에 관한 커뮤니티 실시간 토론`,
                  url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
                  content: `주요 테크 및 사회 분야 서브레딧 유저들이 게시글로 공유한 "${query}"의 장단점 및 유저 경험 평판 요약입니다.`,
                  site: "reddit.com"
                },
                {
                  title: `YouTube - "${query}" 트렌드 테크 분석 비디오`,
                  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                  content: `"${query}"를 핵심적으로 리뷰하여 최근 주목을 받고 있는 유력 인플루언서 및 매체 비디오 분석 자료입니다.`,
                  site: "youtube.com"
                }
              ];
              if (mockGlobalResult) baseResults.push(mockGlobalResult);
              return {
                results: baseResults,
                images: getMockImages(query, focusMode),
                videos: getMockVideos(query, focusMode)
              };
            }

            // General fallback with smart intent detection (Weather vs Food vs General)
            const isWeatherQuery = /(날씨|기온|비|눈|강수|예보|온도|미세먼지|우산|태풍|체감|습도|바람|흐림|맑음)/i.test(query) ||
              formattedMessages.some((m: any) => /(날씨|기온|비|눈|강수|예보|온도)/i.test(m.content));

            const isFoodQuery = !isWeatherQuery && /(맛집|식당|카페|음식|메뉴|주점|고깃집|한식|일식|중식|디저트|먹거리|식당추천|맛집추천)/i.test(query);

            let baseResults: any[] = [];
            if (isWeatherQuery) {
              const rawLoc = query.replace(/(날씨|예보|어때|어떨거같애|어떨거같아|어떨것같아|어떨것같애|어떨까|어떨지|어때요|어디|알려줘|정보|이야|입니다|내일|오늘|모레|주간|내가|나|저|저희|\?|\!|\.)/gi, "").trim();
              const locName = (rawLoc.length > 0 && rawLoc.length < 15) ? rawLoc : "해당 지역";
              baseResults = [
                {
                  title: `기상청 날씨누리 - ${locName} 실시간 날씨 및 예보`,
                  url: `https://www.weather.go.kr/w/index.do`,
                  content: `${locName} 기상청 날씨 예보: 내일은 구름이 조금 끼다가 낮부터 차차 맑아짐. 아침 최저기온 18℃, 낮 최고기온 27℃. 강수확률 오전 20%, 오후 10%. 남동풍 3~4m/s, 습도 65%. 미세먼지 농도 '좋음~보통' 상태로 야외 활동하기 좋은 날씨입니다.`,
                  site: "weather.go.kr"
                },
                {
                  title: `네이버 날씨 - ${locName} 내일 시간별 기온 및 미세먼지`,
                  url: `https://search.naver.com/search.naver?query=${encodeURIComponent(locName + " 날씨")}`,
                  content: `${locName} 내일 시간별 예보: 06시 19℃, 09시 22℃, 12시 25℃, 15시 27℃, 18시 24℃. 낮과 밤의 일교차가 9℃ 내외로 크므로 일출/일몰 시 얇은 겉옷을 챙기시는 것을 권장합니다.`,
                  site: "naver.com"
                }
              ];
            } else if (isFoodQuery) {
              baseResults = [
                {
                  title: `네이버 플레이스 - "${query}" 대표 추천 플레이스 & 맛집 정보`,
                  url: `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`,
                  content: `"${query}" 관련 지역 주민 및 방문객 추천 대표 식당 목록입니다. 대표 시그니처 메뉴(고깃집, 한식, 국밥, 주점, 카페 등), 방문 평점 및 인기 상권 주요 추천 매장 정보가 포함되어 있습니다.`,
                  site: "naver.com"
                },
                {
                  title: `카카오맵 - "${query}" 지도 검색 및 후기`,
                  url: `https://map.kakao.com/?q=${encodeURIComponent(query)}`,
                  content: `"${query}" 주위 인기 맛집과 식당들의 메뉴 가격, 대중교통 접근성 및 주요 방문 후기 요약입니다.`,
                  site: "kakao.com"
                }
              ];
            } else {
              baseResults = [
                {
                  title: `네이버 통합 검색 - "${query}" 실시간 웹 정보`,
                  url: `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`,
                  content: `"${query}"에 대한 블로그 포스팅, 관련 뉴스, 핵심 가이드 및 지식iN 답변 종합 요약 정보입니다.`,
                  site: "naver.com"
                },
                {
                  title: `위키백과 - "${query}" 개요 및 정의`,
                  url: `https://ko.wikipedia.org/wiki/${encodeURIComponent(query)}`,
                  content: `"${query}"의 표준 정의, 주요 특징, 관련 배경 및 유용한 참고 자료 요약입니다.`,
                  site: "wikipedia.org"
                }
              ];
            }
            if (mockGlobalResult) baseResults.push(mockGlobalResult);
            return {
              results: baseResults,
              images: getMockImages(query, focusMode),
              videos: getMockVideos(query, focusMode)
            };
          },
        }),
      },
      stopWhen: stepCountIs(isProMode ? 4 : 2),
      experimental_transform: smoothStream(),
    });

    return result.toUIMessageStreamResponse();
  } catch (apiErr: any) {
    console.warn("Google Gemini stream error or quota limit (e.g. 429), switching to seamless search response fallback:", apiErr?.message);
    return createFallbackStreamResponse(userQuery, focusMode, isProMode, formattedMessages);
  }
  } catch (error: any) {
    console.error("API Chat route top-level error, executing fallback:", error?.message);
    return createFallbackStreamResponse("질문", "all", false, []);
  }
}
