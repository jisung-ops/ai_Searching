# 🔍 OmniSeek AI

Next.js, TypeScript, Tailwind CSS, Vercel AI SDK를 활용해 만든 Perplexity 스타일의 실시간 AI 검색 에이전트 서비스입니다.

---

## 💡 프로젝트 개요
사용자가 입력한 질문에 대해 실시간으로 정보를 수집하고 답변을 생성하는 검색 비서 인터페이스입니다.
단순한 챗봇 형태를 벗어나 참고 출처 카드 배치, AI의 실시간 사고 흐름(Reasoning) 시각화, 그리고 매끄러운 화면 전환 UX를 구현하는 데 초점을 맞추었습니다.

---

## ✨ 주요 기능
* **실시간 웹 검색 연동 (Tavily API)**: Tavily API를 연동하여 실제 실시간 웹 검색 결과를 수집하고 답변에 반영합니다.
* **실시간 AI 스트리밍**: Google Gemini 2.5 Flash 모델과 Vercel AI SDK를 사용하여 지연 시간을 줄이고 부드러운 글자 쓰기(`smoothStream`) 효과를 적용했습니다.
* **검색 & 답변 로딩 UX (Progress Bar & Skeleton UI)**: 검색 진행 단계(검색 쿼리 생성 -> 웹 검색 진행 -> 답변 작성 중)에 맞춰 상단에 35% ➔ 75% ➔ 100%로 채워지는 인터랙티브 진행률 표시줄(Progress Bar)과, 답변 생성 대기 시 맥락을 직관적으로 표현하는 펄스(pulse) 애니메이션 기반의 스켈레톤(Skeleton UI)을 제공하여 지루함을 덜어줍니다.
* **다크 모드 및 테마 스위처 (Theme Switcher)**: Tailwind CSS v4 custom variant와 `localStorage`를 결합하여 페이지 리로드 시 화면 깜빡임이 없는(Flicker-free) 다크 모드를 지원합니다. 사이드바 하단 버튼(Sun/Moon 아이콘)을 통해 손쉽게 라이트/다크 테마를 토글할 수 있습니다.
* **대화 내용 공유 및 플로팅 토스트 (Share & Toast)**: 대화 로그 전체를 깔끔한 마크다운 포맷으로 가공하여 Web Share API를 통해 외부로 즉시 공유하고, 미지원 브라우저 환경에서는 클립보드에 자동 복사해 줍니다. 완료 피드백을 직관적으로 보여주는 Framer Motion 기반의 슬라이드업 Toast 알림 팝업이 적용되었습니다.
* **검색 기록 사이드바**: `localStorage`를 기반으로 이전 검색 세션을 자동으로 영구 보존하며, 사이드바를 통해 이전 세션 복구 및 개별 삭제가 가능합니다. 데스크톱용 접기/펼치기 애니메이션 및 모바일용 슬라이딩 드로어를 지원합니다.
* **마크다운 렌더링 & 코드 복사**: 마크다운 렌더링(`react-markdown`, `remark-gfm`)을 지원하며, 스트리밍 중에도 포커스를 잃지 않는 Standalone 코드 블록과 클립보드 복사 완료 피드백 버튼을 갖추었습니다.
* **사고 흐름(Reasoning) 노출**: 답변이 작성되는 과정에서 AI가 생각하고 추론하는 단계를 화면에 흐름도로 시각화합니다.
* **참고 출처 표시**: 답변과 연관성이 높은 웹 링크 리스트를 출처(Sources) 카드로 시각화해 상단에 배치합니다.
* **로컬 Fallback 모드**: API 키가 없을 때에도 에러로 멈추지 않고 가상 답변 및 모의 웹 검색 결과(Tavily mock) 스트리밍 프로토콜로 작동하여 원활한 오프라인 테스트가 가능합니다.

---

## 🛠️ 기술 스택
* **Framework / Core**: Next.js 16.2 (App Router), React 19, TypeScript
* **AI Core**: Vercel AI SDK (`ai`, `@ai-sdk/react`), Google Gemini API (`@ai-sdk/google`)
* **Styling / Animation**: Tailwind CSS v4.0, Framer Motion, Lucide React
* **Markdown**: react-markdown, remark-gfm

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
│   └── page.tsx               # 검색창 / 대화창 화면 전환 및 사이드바 연동 메인 페이지
└── components/
    ├── chat-interface.tsx     # 채팅 로그, 출처 카드, 스트리밍 답변 렌더링 UI (모바일 햄버거 메뉴 포함)
    ├── history-sidebar.tsx    # 로컬 스토리지 기반 검색 기록 사이드바 (데스크톱 접기 / 모바일 드로어)
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
