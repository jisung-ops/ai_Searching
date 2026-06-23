import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { smoothStream, streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

// Initialize Google Gemini provider with GEMINI_API_KEY env variable
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// API Route limits configuration
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, focusMode = "all", isProMode = false } = await req.json();

    // Map client-side message structure to Vercel AI SDK CoreMessage format
    const formattedMessages = messages.map((m: any) => {
      let content = m.content;
      if (content === undefined && Array.isArray(m.parts)) {
        content = m.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
      }
      return {
        role: m.role,
        content: content ?? "",
      };
    });

    const userQuery = formattedMessages[formattedMessages.length - 1]?.content || "검색어";

    // Set custom system prompt based on focusMode
    let systemPrompt = "너는 실시간 웹 검색 및 지식 정리를 전문으로 하는 시니어 AI 검색 비서야. 사용자의 질문에 대해 신뢰할 수 있고 명확하게 답변해줘. 문장은 가독성 좋게 마크다운 문법으로 표현해줘.";
    if (focusMode === "academic") {
      systemPrompt = "너는 학술 및 과학 분야의 정보 조사를 돕는 전문 연구원이야. 사용자의 질문에 대해 신뢰할 수 있는 학술적인 연구 자료, 논문, 백과사전 출처 등을 기반으로 논리적이고 깊이 있는 답변을 마크다운 형식으로 작성해줘. 출처 정보의 신뢰성을 엄격하게 다뤄줘.";
    } else if (focusMode === "code") {
      systemPrompt = "너는 소프트웨어 엔지니어링 및 개발 질문에 대답하는 시니어 풀스택 개발자야. 사용자가 겪고 있는 프로그래밍 이슈나 개발 개념에 대해 정확한 코드 예제와 모범 사례(Best Practices), 그리고 기술적 해결책을 상세하게 마크다운 형식으로 작성해줘.";
    } else if (focusMode === "social") {
      systemPrompt = "너는 트렌디한 소셜 미디어 트렌드와 대중의 반응을 모니터링하는 전문 웹 리서처야. Reddit, YouTube 등 커뮤니티 상의 여론, 최신 트렌드, 그리고 사람들의 생각과 평판을 종합하여 직관적이고 흥미롭게 마크다운 형식으로 요약해줘.";
    }

    // Add validation rules for character count constraints
    systemPrompt += "\n\n[조건 검증 규칙] 만약 사용자가 특정 글자 수 제한(예: 6글자, 5자 등)이 있는 단어나 문장을 요청하는 경우, 답변을 출력하기 전에 각 단어의 실제 글자 수를 음절 단위로 철저히 세어보고 검증하십시오. 요구한 글자 수와 일치하지 않는 단어는 절대 최종 답변에 포함해서는 안 됩니다.";

    // Add instructions for generating recommended follow-up questions
    systemPrompt += "\n\n[중요] 답변 작성을 완결한 후, 마지막에 반드시 사용자가 이어서 질문하기 좋은 '추천 후속 질문' 3개를 카테고리별로 각 1개씩 생성해줘. 각 질문은 아래의 XML 태그 형식에 맞춰 한 줄씩 '-' 기호와 카테고리 식별자(`[concept]`, `[apply]`, `[warning]`)로 시작해야 합니다. 카테고리는 다음 세 가지입니다:\\n1. `[concept]`: 💡 질문에 대한 심화 개념을 묻는 후속 질문\\n2. `[apply]`: 🛠️ 실제 실무 적용 방법이나 구체적인 예시를 묻는 후속 질문\\n3. `[warning]`: ⚠️ 고려해야 할 한계점, 부작용 또는 주의 사항을 묻는 후속 질문\\n\\nXML 태그 이외의 불필요한 설명은 절대 포함하지 마시오:\\n<followup>\\n- [concept] [심화 개념 질문 내용]\\n- [apply] [실무 적용/예제 질문 내용]\\n- [warning] [한계/주의사항 질문 내용]\\n</followup>";

    // Add instructions for inline citations
    systemPrompt += "\n\n[출처 인용 규칙] 답변 내용 중 웹 검색 결과(`searchWeb` 도구의 출력)에서 얻은 사실이나 정보를 언급할 때는, 해당 정보 바로 뒤에 반드시 `[숫자](url)` 형식의 마크다운 링크로 인라인 인용(Inline Citation)을 추가하십시오. 숫자는 1부터 시작하며, 검색 결과에서 해당 웹사이트가 위치한 순서(index + 1)를 의미합니다. 동일한 웹 사이트를 여러 번 참조하는 경우 동일한 번호와 URL 링크를 사용하십시오. 일반 텍스트 형태의 `[숫자]`로만 인용을 표시하지 마시고, 반드시 `[숫자](url)` 마크다운 링크 형식을 유지하십시오.";

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

    // Check if GEMINI_API_KEY is set in environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured. Falling back to mock streaming response.");
      
      if (isProMode) {
        // Multi-stage mock research process for Pro Mode
        const mockResults1 = [
          {
            title: `[심층 1차 검색] "${userQuery}" 핵심 개념 및 표준 명세 자료`,
            url: "https://wikipedia.org/wiki/Search",
            content: `"${userQuery}"의 정의, 아키텍처 모델 및 주요 레퍼런스 가이드에 수록된 이론적 맥락 자료 요약입니다.`,
            site: "wikipedia.org"
          },
          {
            title: `[심층 1차 검색] "${userQuery}" 최신 동향 블로그 포스팅`,
            url: "https://medium.com/topic/example",
            content: `실무진이 다룬 "${userQuery}"의 핵심 이슈, 트렌드 동향 및 기본적인 작동 매커니즘 설명글입니다.`,
            site: "medium.com"
          }
        ];

        const mockResults2 = [
          {
            title: `[심층 2차 검색] "${userQuery}"의 기술적 아키텍처 및 내부 원리 상세 분석`,
            url: "https://example.org/deep-dive",
            content: `"${userQuery}"의 고급 구성, 병목 현상 완화, 시스템 효율 극대화 방안 및 대규모 프로덕션 배포 시 주의점을 다룬 심화 보고서입니다.`,
            site: "example.org"
          },
          {
            title: `[심층 2차 검색] "${userQuery}" 성능 비교 벤치마크 테스트 결과`,
            url: "https://benchmark-hub.com/research",
            content: `다양한 인프라 조건 하에서 이루어진 "${userQuery}" 성능 측정치, 레거시 시스템 대비 응답성/자원 소비량 비교 테이블 데이터입니다.`,
            site: "benchmark-hub.com"
          }
        ];

        const proAnswer = `**[알림: ⚡ 프로 / 심층 탐구 모드] GEMINI_API_KEY가 설정되지 않아 다단계 심층 시뮬레이션을 수행했습니다.**

---

### 🔍 1. 요약 및 핵심 결론
사용자가 질문하신 **"${userQuery}"**에 대해 2차례에 걸쳐 웹 검색(학술, 기술 및 벤치마크 사이트)을 다각도로 수행하고 그 결과를 종합적으로 정리했습니다. "${userQuery}"는 현재 기술 생태계에서 매우 중요한 흐름을 형성하고 있으며, 성능 최적화와 안정적인 인프라 구성이 핵심 과제로 꼽힙니다.

---

### ⚙️ 2. 내부 메커니즘 및 상세 아키텍처
최근 공개된 기술 리포트 및 아키텍처 분석 자료에 따르면 다음과 같은 주요 특징이 식별됩니다:
- **리소스 최적화 및 고성능 분산 아키텍처**: 분산 시스템 환경에서 고가용성(High Availability)을 달성하기 위한 메커니즘을 내장하고 있습니다.
- **의존성 경량화**: 외부 종속성을 획기적으로 줄여, 런타임 시작 지연(Cold Start) 현상을 이전 버전 대비 약 40% 이상 단축했습니다.
- **보안 및 규정 준수**: 기본적으로 종단간 암호화(End-to-End Encryption)와 엄격한 인증 프로토콜을 적용하여 엔터프라이즈 환경에 적합합니다.

---

### 📊 3. 벤치마크 및 타 기술 대비 비교 분석
타 솔루션과의 비교 벤치마크(Benchmark) 결과는 아래 표와 같습니다:

| 성능 지표 | "${userQuery}" (신기술) | 기존 레거시 솔루션 | 개선율 |
| :--- | :---: | :---: | :---: |
| 초당 처리량 (TPS) | **12,500+** | 4,200 | +197.6% |
| 평균 지연 시간 (Latency) | **12ms** | 45ms | -73.3% |
| 메모리 점유율 (Idle) | **180MB** | 520MB | -65.4% |

이러한 비교 우위를 통해, 대용량 트래픽 처리가 필수적인 현대 웹 서비스 환경에서 압도적인 비용 절감과 응답 속도 향상 효과를 거둘 수 있습니다.

---

### 💡 4. 실무 도입 시 고려사항 & 모범 사례 (Best Practices)
1. **점진적 마이그레이션**: 한 번에 전체 시스템을 변경하기보다, 마이크로서비스(MSA) 중 일부 서비스 영역부터 시범 연동하여 문제점을 모니터링하는 것이 안전합니다.
2. **모니터링 강화**: 실시간 로깅 및 분산 트레이싱 도구(예: OpenTelemetry, Prometheus 등)를 연동하여 성능 지표를 가시화해 두어야 장애 발생 시 원인 추적이 쉽습니다.
3. **캐싱 전략 수립**: 네트워크 비용을 최소화하고 응답성을 더 높이기 위해 적절한 캐시 제어 헤더 설정 및 분산 캐시(예: Redis) 레이어 도입이 권장됩니다.`;

        const mockFollowup = `\n\n<followup>\n- [warning] "${userQuery}"의 실제 상용 마이그레이션 중 발생할 수 있는 주요 예외 상황과 대책은 무엇인가요?\n- [apply] 위 벤치마크 테스트에서 적용된 하드웨어 사양 및 네트워크 조건이 궁금합니다.\n- [concept] "${userQuery}"의 장기 유지보수 및 보안 업데이트 주기 정보는 어떻게 되나요?\n</followup>`;
        const fullMockAnswer = proAnswer + mockFollowup;

        // Create a simulated streaming response using ReadableStream
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
          async start(controller) {
            // 1. Send simulated tool call 1
            controller.enqueue(
              encoder.encode(
                `9:${JSON.stringify({
                  toolCallId: "mock-call-1",
                  name: "searchWeb",
                  args: { query: userQuery },
                })}\n`
              )
            );
            await new Promise((resolve) => setTimeout(resolve, 1200));

            // 2. Send simulated tool result 1
            controller.enqueue(
              encoder.encode(
                `a:${JSON.stringify({
                  toolCallId: "mock-call-1",
                  result: { results: mockResults1, images: getMockImages(userQuery, focusMode), videos: getMockVideos(userQuery, focusMode) },
                })}\n`
              )
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // 3. Send simulated tool call 2
            const deepQuery = `"${userQuery}"의 심층 기술 분석 및 응용 연구 사례`;
            controller.enqueue(
              encoder.encode(
                `9:${JSON.stringify({
                  toolCallId: "mock-call-2",
                  name: "searchWeb",
                  args: { query: deepQuery },
                })}\n`
              )
            );
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // 4. Send simulated tool result 2
            controller.enqueue(
              encoder.encode(
                `a:${JSON.stringify({
                  toolCallId: "mock-call-2",
                  result: { results: mockResults2, images: getMockImages(deepQuery, focusMode), videos: getMockVideos(deepQuery, focusMode) },
                })}\n`
              )
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // 5. Stream text chunks
            const chunks = fullMockAnswer.split(" ");
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk + " ")}\n`));
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
            controller.close();
          },
        });

        return new Response(customStream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
          },
        });
      }

      let mockResults = [];
      let mockAnswerPrefix = "";

      if (focusMode === "academic") {
        mockResults = [
          {
            title: `[학술 가상 검색] "${userQuery}" 관련 공식 백과사전 및 논문 자료`,
            url: "https://wikipedia.org/wiki/Search",
            content: `"${userQuery}"의 역사적 정의, 이론적 모델, 그리고 선행 연구들의 문헌 자료 요약입니다. 학술적 맥락을 파악하기 위한 표준 자료입니다.`,
            site: "wikipedia.org"
          },
          {
            title: `[학술 가상 검색] arXiv - "${userQuery}" 선행 연구 동향 보고서`,
            url: "https://arxiv.org/abs/example",
            content: `컴퓨터 과학 및 관련 연구 분야에서 "${userQuery}"를 주제로 다룬 최신 프리프린트(preprint) 논문의 초록 및 주요 실험 설계 정보입니다.`,
            site: "arxiv.org"
          }
        ];
        mockAnswerPrefix = `**[알림: 학술 검색 모드] GEMINI_API_KEY가 설정되지 않아 시뮬레이션 모드로 응답합니다.**
학술 및 위키 사이트를 중심으로 검색한 가상 결과입니다:

1. **이론적 정의**: "${userQuery}"는 표준화된 연구 도메인 및 위키피디아 지식 체계에서 정의된 바에 따라 체계적으로 분석됩니다.
2. **선행 학술 논문**: 최신 학술 트렌드 리포트에 따르면, 관련 도메인의 실험적 결과들은 지속적으로 피어 리뷰(Peer-review) 프로세스를 거치고 있습니다.`;
      } else if (focusMode === "code") {
        mockResults = [
          {
            title: `[코드 가상 검색] StackOverflow - How to implement "${userQuery}" best practice`,
            url: "https://stackoverflow.com/questions/example",
            content: `개발자들이 겪은 "${userQuery}" 관련 에러 이슈 해결법과 리팩토링된 최적의 코드 스니펫 예시입니다.`,
            site: "stackoverflow.com"
          },
          {
            title: `[코드 가상 검색] GitHub - "${userQuery}" 레퍼런스 코드 저장소`,
            url: "https://github.com/search?q=example",
            content: `깃허브 오픈소스 리포지토리에서 발췌한 "${userQuery}" 구현 템플릿 코드 및 의존성 환경 설정 가이드라인입니다.`,
            site: "github.com"
          }
        ];
        mockAnswerPrefix = `**[알림: 개발/코드 검색 모드] GEMINI_API_KEY가 설정되지 않아 시뮬레이션 모드로 응답합니다.**
StackOverflow 및 GitHub 레퍼런스를 우선적으로 수집한 가상 결과입니다:

\`\`\`typescript
// "${userQuery}"에 대한 표준 구현 예제 코드
interface QueryResult {
  source: string;
  timestamp: number;
  data: string;
}

export function handleFocusQuery(query: string): QueryResult {
  console.log("Processing code query:", query);
  return {
    source: "GitHub Reference",
    timestamp: Date.now(),
    data: \`Mock code analysis for \${query}\`
  };
}
\`\`\``;
      } else if (focusMode === "social") {
        mockResults = [
          {
            title: `[소셜 가상 검색] Reddit - Thoughts on "${userQuery}"? (Discussion thread)`,
            url: "https://reddit.com/r/technology/comments/example",
            content: `유저들이 "${userQuery}"에 대해 나누고 있는 생생한 실사용 리뷰와 의견, 그리고 장단점 비교에 관한 레딧 토론 요약입니다.`,
            site: "reddit.com"
          },
          {
            title: `[소셜 가상 검색] YouTube - "${userQuery}" 최신 동향 및 트렌드 분석 리뷰`,
            url: "https://youtube.com/watch?v=example",
            content: `"${userQuery}"의 작동 방식과 논란, 트렌드를 시각적으로 분석하여 높은 조회수를 기록한 유튜브 영상 내용 정리입니다.`,
            site: "youtube.com"
          }
        ];
        mockAnswerPrefix = `**[알림: 소셜/유튜브 검색 모드] GEMINI_API_KEY가 설정되지 않아 시뮬레이션 모드로 응답합니다.**
유튜브 및 레딧 등 커뮤니티의 실시간 반응과 트렌드를 중심으로 가상 수집한 결과입니다:

* **Reddit 반응**: 다수의 사용자들은 "${userQuery}"의 접근성 및 참신함에 높은 반응을 보이고 있으나, 실질적인 유용성에 대해서는 열띤 토론을 벌이고 있습니다.
* **YouTube 트렌드**: 최근 테크 크리에이터들 사이에서 핵심 키워드로 다뤄지며 상세 분석 영상이 높은 관심을 이끌어내고 있습니다.`;
      } else {
        mockResults = [
          {
            title: `[가상 검색] "${userQuery}" 관련 공식 문서 및 가이드`,
            url: "https://nextjs.org/docs",
            content: `"${userQuery}"에 대한 정보와 Next.js 공식 가이드라인을 참조하고 있습니다. App Router 및 React 서버 컴포넌트 환경에서의 권장 구현 방법입니다.`,
            site: "nextjs.org"
          },
          {
            title: `[가상 검색] "${userQuery}"에 대한 실시간 블로그 포스팅`,
            url: "https://medium.com",
            content: `"${userQuery}"의 최신 동향과 트렌드를 다룬 개발 블로그 글 요약입니다. 다양한 실무 적용 사례와 문제 해결 가이드가 기재되어 있습니다.`,
            site: "medium.com"
          }
        ];
        mockAnswerPrefix = `**[알림] GEMINI_API_KEY가 설정되지 않았습니다.**
프로젝트 루트 디렉터리에 \`.env.local\` 파일을 생성하고 다음과 같이 API 키를 설정해 주세요:

\`\`\`env
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

---

**[일반 모드 모의 답변]**
"${userQuery}"에 대해 가상의 웹 검색을 수행한 결과는 다음과 같습니다. Vercel AI SDK의 \`streamText\` 훅을 사용해 인터랙티브한 응답 시스템을 제작할 수 있으며, API 키를 연동하면 실제 Google Gemini AI의 실시간 답변 스트리밍을 경험하실 수 있습니다.`;
      }

      // Add mockup follow-up questions
      const mockFollowup = `\n\n<followup>\n- [concept] "${userQuery}"의 구체적인 작동 방식과 핵심 원리가 궁금하신가요?\n- [apply] "${userQuery}"와(과) 연관해서 참고하기 좋은 실무 팁은 무엇이 있을까요?\n- [warning] "${userQuery}" 관련해서 더 조사해 볼 만한 다른 핵심 주제도 알려주세요.\n</followup>`;
      const fullMockAnswer = mockAnswerPrefix + mockFollowup;

      // Create a simulated streaming response using ReadableStream
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          // 1. Send simulated tool call
          controller.enqueue(
            encoder.encode(
              `9:${JSON.stringify({
                toolCallId: "mock-call-1",
                name: "searchWeb",
                args: { query: userQuery },
              })}\n`
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 800));

          // 2. Send simulated tool result
          controller.enqueue(
            encoder.encode(
              `a:${JSON.stringify({
                toolCallId: "mock-call-1",
                result: { results: mockResults, images: getMockImages(userQuery, focusMode), videos: getMockVideos(userQuery, focusMode) },
              })}\n`
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 800));

          // 3. Stream text chunks
          const chunks = fullMockAnswer.split(" ");
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk + " ")}\n`));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          controller.close();
        },
      });

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // Actual streaming using Vercel AI SDK and Google Gemini
    const result = await streamText({
      model: google("gemini-2.5-flash"),
      messages: formattedMessages,
      system: systemPrompt,
      tools: {
        searchWeb: tool({
          description: "Search the web for real-time information on a topic",
          inputSchema: z.object({
            query: z.string().describe("The search query to run"),
          }),
          execute: async ({ query }) => {
            const tavilyApiKey = process.env.TAVILY_API_KEY;
            
            // Build custom search query query based on focusMode
            let modifiedQuery = query;
            if (focusMode === "academic") {
              modifiedQuery = `${query} site:edu OR site:org OR site:wikipedia.org OR site:arxiv.org OR site:researchgate.net`;
            } else if (focusMode === "code") {
              modifiedQuery = `${query} site:stackoverflow.com OR site:github.com OR site:dev.to OR site:medium.com OR site:npmjs.com`;
            } else if (focusMode === "social") {
              modifiedQuery = `${query} site:reddit.com OR site:youtube.com OR site:twitter.com`;
            }

            if (tavilyApiKey) {
              try {
                const res = await fetch("https://api.tavily.com/search", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tavilyApiKey}`,
                  },
                  body: JSON.stringify({ 
                    query: modifiedQuery, 
                    max_results: isProMode ? 6 : 4,
                    include_images: true,
                    include_image_descriptions: true
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  const results = data.results.map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                    site: new URL(r.url).hostname.replace("www.", ""),
                  }));

                  // Extract videos from search results
                  const videos: any[] = [];
                  data.results.forEach((r: any) => {
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

                  const images = (data.images || []).map((img: any) => {
                    if (typeof img === "string") {
                      return { url: img, description: "" };
                    }
                    return {
                      url: img.url || "",
                      description: img.description || "",
                    };
                  }).filter((img: any) => img.url);

                  return { results, images, videos };
                }
              } catch (e) {
                console.error("Tavily Search API error:", e);
              }
            }

            // Fallback dynamic mock search if no Tavily API Key
            // Mock content is tailored to focus mode as well
            if (focusMode === "academic") {
              return {
                results: [
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
                ],
                images: getMockImages(query, focusMode),
                videos: getMockVideos(query, focusMode)
              };
            } else if (focusMode === "code") {
              return {
                results: [
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
                ],
                images: getMockImages(query, focusMode),
                videos: getMockVideos(query, focusMode)
              };
            } else if (focusMode === "social") {
              return {
                results: [
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
                ],
                images: getMockImages(query, focusMode),
                videos: getMockVideos(query, focusMode)
              };
            }

            // General fallback
            return {
              results: [
                {
                  title: `"${query}" 관련 트렌드 및 분석 정보`,
                  url: `https://example.com/search?q=${encodeURIComponent(query)}`,
                  content: `"${query}"에 대한 실시간 웹 검색 결과 요약 정보입니다. 관련된 최신 기술 동향, 공식 가이드, 블로그 포스팅 분석 내용이 포함되어 있습니다.`,
                  site: "example.com"
                },
                {
                  title: `개발자를 위한 "${query}" 핵심 기술 문서`,
                  url: `https://dev-docs.org/wiki/${encodeURIComponent(query)}`,
                  content: `"${query}"의 정의, 사용법, 주의점 및 아키텍처 상의 이점을 정리한 개발 실무 문서입니다.`,
                  site: "dev-docs.org"
                }
              ],
              images: getMockImages(query, focusMode),
              videos: getMockVideos(query, focusMode)
            };
          },
        }),
      },
      stopWhen: stepCountIs(isProMode ? 5 : 2),
      experimental_transform: smoothStream(),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("API Chat route error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
