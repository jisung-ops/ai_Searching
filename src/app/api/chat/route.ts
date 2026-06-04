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
    const { messages } = await req.json();

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

    // Check if GEMINI_API_KEY is set in environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured. Falling back to mock streaming response.");
      
      const mockResults = [
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
        },
        {
          title: `[가상 검색] GitHub - "${userQuery}" 오픈소스 프로젝트 레퍼런스`,
          url: "https://github.com",
          content: `"${userQuery}"을 활용한 실제 프로젝트 코드와 예시 템플릿 리포지토리입니다.`,
          site: "github.com"
        }
      ];

      // Fallback: Stream a helpful notice instructing how to add the API Key
      const fallbackText = `**[알림] GEMINI_API_KEY가 설정되지 않았습니다.**
프로젝트 루트 디렉터리에 \`.env.local\` 파일을 생성하고 다음과 같이 API 키를 설정해 주세요:

\`\`\`env
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

---

**[모의 답변]**
요청하신 질문에 대해 가상의 웹 검색을 수행한 결과는 다음과 같습니다:
입력하신 질문은 "${userQuery}" 입니다.

1. **Next.js 16**과 **React 19** 환경에서는 대형 언어 모델(LLM)과의 연동을 위해 Vercel AI SDK의 \`streamText\` 훅을 사용해 인터랙티브한 응답 시스템을 쉽게 제작할 수 있습니다.
2. **Tavily API**를 통해 질문에 최적화된 웹 문서들을 검색하여 출처 카드로 표기할 수 있으며, API 키가 없어도 본 데모와 같이 가상의 시뮬레이션으로 전체 흐름을 테스트할 수 있도록 설계되었습니다.
3. 이제 마크다운 렌더러가 활성화되어 코드 블록 복사 버튼 기능 등 풍부한 텍스트 가독성을 누릴 수 있습니다.

API 키를 설정하시면 실제 Google Gemini AI의 실시간 답변 스트리밍을 경험하실 수 있습니다.`;

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
          const chunks = fallbackText.split(" ");
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
      system: "너는 실시간 웹 검색 및 지식 정리를 전문으로 하는 시니어 AI 검색 비서야. 사용자의 질문에 대해 신뢰할 수 있고 명확하게 답변해줘. 문장은 가독성 좋게 마크다운 문법으로 표현해줘.",
      tools: {
        searchWeb: tool({
          description: "Search the web for real-time information on a topic",
          inputSchema: z.object({
            query: z.string().describe("The search query to run"),
          }),
          execute: async ({ query }) => {
            const tavilyApiKey = process.env.TAVILY_API_KEY;
            if (tavilyApiKey) {
              try {
                const res = await fetch("https://api.tavily.com/search", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tavilyApiKey}`,
                  },
                  body: JSON.stringify({ query, max_results: 4 }),
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
              },
              {
                title: `GitHub - "${query}" 인기 오픈소스 리포지토리`,
                url: `https://github.com/search?q=${encodeURIComponent(query)}`,
                content: `"${query}"을 실제 프로덕션에 도입하거나 테스트할 때 활용하기 좋은 GitHub의 인기 레포지토리와 예제 코드 모음입니다.`,
                site: "github.com"
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
