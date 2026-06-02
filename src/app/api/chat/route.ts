import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// API Route limits configuration
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Check if GEMINI_API_KEY is set in environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured. Falling back to mock streaming response.");
      
      // Fallback: Stream a helpful notice instructing how to add the API Key
      const fallbackText = `**[알림] GEMINI_API_KEY가 설정되지 않았습니다.**
프로젝트 루트 디렉터리에 \`.env.local\` 파일을 생성하고 다음과 같이 API 키를 설정해 주세요:

\`\`\`env
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

---

**[모의 답변]**
요청하신 질문에 대해 가상의 웹 검색을 수행한 결과는 다음과 같습니다:
입력하신 질문은 "${messages[messages.length - 1]?.content}" 입니다.

1. **Next.js 15**의 주요 업데이트는 React 19 지원, 캐싱 메커니즘 변경, 그리고 빌드 성능 개선이 주를 이룹니다.
2. **Tailwind CSS v4.0**은 Rust로 재작성되어 이전 버전 대비 최대 10배 이상 빌드가 빠르며 포스트 프로세싱 방식이 간편해졌습니다.
3. **Vercel AI SDK**는 스트리밍 응답 처리를 직관적인 훅(\`useChat\`)으로 제어할 수 있게 도와주어 인터랙티브한 AI 서비스를 손쉽게 구축할 수 있습니다.

API 키를 설정하시면 실제 Google Gemini AI의 실시간 답변 스트리밍을 경험하실 수 있습니다.`;

      // Create a simulated streaming response using ReadableStream
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          // Send text in chunks to simulate streaming
          const chunks = fallbackText.split(" ");
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk + " ")}\n`));
            await new Promise((resolve) => setTimeout(resolve, 50));
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
      model: google("gemini-1.5-flash"),
      messages,
      system: "너는 실시간 웹 검색 및 지식 정리를 전문으로 하는 시니어 AI 검색 비서야. 사용자의 질문에 대해 신뢰할 수 있고 명확하게 답변해줘. 문장은 가독성 좋게 마크다운 문법으로 표현해줘.",
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("API Chat route error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
