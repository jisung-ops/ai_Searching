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
    const { messages, focusMode = "all" } = await req.json();

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

    // Check if GEMINI_API_KEY is set in environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured. Falling back to mock streaming response.");
      
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
                result: mockResults,
              })}\n`
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 800));

          // 3. Stream text chunks
          const chunks = mockAnswerPrefix.split(" ");
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
                  body: JSON.stringify({ query: modifiedQuery, max_results: 4 }),
                });
                if (res.ok) {
                  const data = await res.json();
                  return data.results.map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                    site: new URL(r.url).hostname.replace("www.", ""),
                  }));
                }
              } catch (e) {
                console.error("Tavily Search API error:", e);
              }
            }

            // Fallback dynamic mock search if no Tavily API Key
            // Mock content is tailored to focus mode as well
            if (focusMode === "academic") {
              return [
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
            } else if (focusMode === "code") {
              return [
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
            } else if (focusMode === "social") {
              return [
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
            }

            // General fallback
            return [
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
            ];
          },
        }),
      },
      stopWhen: stepCountIs(2),
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
