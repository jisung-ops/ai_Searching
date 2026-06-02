# 🔍 OmniSeek AI

Next.js, TypeScript, Tailwind CSS, Vercel AI SDK를 활용해 만든 Perplexity 스타일의 실시간 AI 검색 에이전트 서비스입니다.

---

## 💡 프로젝트 개요
사용자가 입력한 질문에 대해 실시간으로 정보를 수집하고 답변을 생성하는 검색 비서 인터페이스입니다.
단순한 챗봇 형태를 벗어나 참고 출처 카드 배치, AI의 실시간 사고 흐름(Reasoning) 시각화, 그리고 매끄러운 화면 전환 UX를 구현하는 데 초점을 맞추었습니다.

---

## ✨ 주요 기능
* **실시간 AI 스트리밍**: Google Gemini 2.5 Flash 모델과 Vercel AI SDK를 사용하여 지연 시간을 줄이고 부드러운 글자 쓰기(`smoothStream`) 효과를 적용했습니다.
* **사고 흐름(Reasoning) 노출**: 답변이 작성되는 과정에서 AI가 생각하고 추론하는 단계를 화면에 흐름도로 보여줍니다.
* **참고 출처 표시**: 답변과 연관성이 높은 웹 링크 리스트를 출처(Sources) 카드로 시각화해 상단에 배치합니다.
* **매끄러운 인터랙션**: Framer Motion을 사용하여 검색 랜딩 페이지에서 대화형 인터페이스로 자연스럽게 레이아웃이 변환됩니다.
* **로컬 Fallback 모드**: API 키가 없을 때에도 에러로 멈추지 않고 가상 답변 스트리밍 모드로 작동하여 원활한 테스트가 가능합니다.

---

## 🛠️ 기술 스택
* **Framework / Core**: Next.js 16.2 (App Router), React 19, TypeScript
* **AI Core**: Vercel AI SDK (`ai`, `@ai-sdk/react`), Google Gemini API (`@ai-sdk/google`)
* **Styling / Animation**: Tailwind CSS v4.0, Framer Motion, Lucide React

---

## 📂 프로젝트 폴더 구조
```text
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # Vercel AI SDK & Gemini API 스트리밍 라우터
│   ├── globals.css            # Tailwind CSS v4 스타일 파일
│   ├── layout.tsx             # 루트 레이아웃 (Geist 폰트 및 메타데이터)
│   └── page.tsx               # 검색창 / 대화창 화면 전환 제어 메인 페이지
└── components/
    ├── chat-interface.tsx     # 채팅 로그, 출처 카드, 스트리밍 답변 렌더링 UI
    └── search-box.tsx         # 초기 검색어 입력 폼 컴포넌트
```

---

## 🚀 시작 및 테스트 가이드

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
프로젝트 루트 디렉터리에 `.env.local` 파일을 생성하고 본인의 Gemini API 키를 등록합니다.
*(키가 없는 경우 자동으로 가상 응답 스트리밍 모드로 테스트할 수 있습니다.)*

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 개발 서버 실행
```bash
# Node가 시스템 환경변수에 등록된 경우
npm run dev

# Node 경로 인식이 안 되는 로컬 윈도우 환경인 경우
$env:PATH += ";C:\Program Files\nodejs" ; npm.cmd run dev
```
이후 브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 4. 프로덕션 빌드
```bash
$env:PATH += ";C:\Program Files\nodejs" ; npm.cmd run build
```
