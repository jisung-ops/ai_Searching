# 🔍 OmniSeek AI

Next.js, TypeScript, Tailwind CSS, Vercel AI SDK를 활용해 만든 Perplexity 스타일의 실시간 AI 검색 에이전트 서비스입니다.

---

## 💡 프로젝트 개요
사용자가 입력한 질문에 대해 실시간으로 정보를 수집하고 답변을 생성하는 검색 비서 인터페이스입니다.
단순한 챗봇 형태를 벗어나 참고 출처 카드 배치, AI의 실시간 사고 흐름(Reasoning) 시각화, 그리고 매끄러운 화면 전환 UX를 구현하는 데 초점을 맞추었습니다.

---

## ✨ 주요 기능
* **실시간 웹 검색 연동 (Tavily API)**: Tavily API를 연동하여 실제 실시간 웹 검색 결과를 수집하고 답변에 반영합니다.
* **검색 포커스 모드 (Focus Mode)**: 전체 웹 검색 외에 학술 자료(arXiv, Wikipedia 등), 코드/개발(GitHub, StackOverflow 등), 소셜/유튜브(Reddit, 유튜브 등)로 검색 범위를 좁혀 정확한 출처와 모드별 맞춤 어조를 반영하는 세션 레벨 포커스 검색 기능을 제공합니다.
* **프로 / 심층 탐구 모드 (Pro / Deep Research Mode)**: Perplexity Pro 또는 OpenAI Deep Research와 유사한 다단계 순차 검색 기능을 지원합니다. 활성화 시 AI가 주도적으로 관련 키워드를 도출하며 최대 5단계 루프(`stopWhen: stepCountIs(5)`)의 웹 탐색과 교차 검증을 연달아 수행하고 최종 심층 보고서를 작성합니다. API 키 미연동 시에도 2단계 순차 웹 검색(Core & Deep)과 비교 분석 테이블이 포함된 고성능 모의 탐구 보고서 스트리밍 프로세스를 제공합니다.
* **실시간 AI 스트리밍**: Google Gemini 2.5 Flash 모델과 Vercel AI SDK를 사용하여 지연 시간을 줄이고 부드러운 글자 쓰기(`smoothStream`) 효과를 적용했습니다. 사용자의 글자 수나 조건 제한 요청에 정밀하게 대응하기 위한 자체 검증 프롬프트가 탑재되었습니다.
* **검색 & 답변 로딩 UX (Progress Bar & Skeleton UI)**: 검색 진행 단계(검색 쿼리 생성 -> 웹 검색 진행 -> 답변 작성 중)에 맞춰 상단에 35% ➔ 75% ➔ 100%로 채워지는 인터랙티브 진행률 표시줄(Progress Bar)과, 답변 생성 대기 시 맥락을 직관적으로 표현하는 펄스(pulse) 애니메이션 기반의 스켈레톤(Skeleton UI)을 제공하여 지루함을 덜어줍니다.
* **다크 모드 및 테마 스위처 (Theme Switcher)**: Tailwind CSS v4 custom variant와 `localStorage`를 결합하여 페이지 리로드 시 화면 깜빡임이 없는(Flicker-free) 다크 모드를 지원합니다. 사이드바 하단 버튼(Sun/Moon 아이콘)을 통해 손쉽게 라이트/다크 테마를 토글할 수 있습니다.
* **대화 내용 공유 및 파일 내보내기 (Share, PDF & Markdown Export)**: 대화 로그 전체를 깔끔한 마크다운 포맷으로 가공하여 Web Share API를 통해 외부로 즉시 공유(미지원 시 클립보드 복사)할 수 있습니다. 또한, 브라우저 네이티브 프린트/숨김 iframe 렌더링 기술을 결합하여 고해상도 PDF 보고서 인쇄 및 다운로드를 지원하고, 마크다운 파일(.md) 개별 다운로드도 지원합니다. 완료 피드백을 직관적으로 보여주는 Framer Motion 기반의 슬라이드업 Toast 알림 팝업이 적용되었습니다.
* **검색 기록 사이드바**: `localStorage`를 기반으로 이전 검색 세션을 자동으로 영구 보존하며, 사이드바를 통해 이전 세션 복구 및 개별 삭제가 가능합니다. 데스크톱용 접기/펼치기 애니메이션 및 모바일용 슬라이딩 드로어를 지원합니다.
* **마크다운 렌더링 & 코드 복사**: 마크다운 렌더링(`react-markdown`, `remark-gfm`)을 지원하며, 스트리밍 중에도 포커스를 잃지 않는 Standalone 코드 블록과 클립보드 복사 완료 피드백 버튼을 갖추었습니다.
* **사고 흐름(Reasoning) 노출**: 답변이 작성되는 과정에서 AI가 생각하고 추론하는 단계를 화면에 흐름도로 시각화합니다.
* **프로 모드 탐색 경로 시각화 노드 그래프 (Search Path Node Graph)**: 프로 모드(심층 탐구) 또는 다단계 웹 검색 발생 시, AI가 검색한 질문 키워드와 연차별 탐색한 검색어, 발굴된 웹 사이트 출처들을 **인터랙티브 SVG 노드 그래프**로 시각화합니다. 각 노드의 호버 툴팁(상세 제목, 요약 스니펫 확인), 클릭 시 원본 페이지 이동, 데이터 흐름을 나타내는 물결 애니메이션(flowing edge lines) 등 고도의 마이크로 애니메이션과 가로 스크롤 레이아웃을 통해 복잡한 AI의 심층 탐구 프로세스를 한눈에 파악할 수 있습니다.
* **참고 출처 표시**: 답변과 연관성이 높은 웹 링크 리스트를 출처(Sources) 카드로 시각화해 상단에 배치합니다.
* **인라인 인용 프리뷰 툴팁 (Inline Citation Tooltips)**: AI가 답변 본문에 표시하는 인용구 번호(`[1]`, `[2]` 등)에 마우스를 올리면(Hover) 해당 출처의 제목, 도메인 이름, 파비콘, 요약 정보(Snippet), 그리고 직접 방문하기 버튼을 깔끔하고 세련된 유리 효과(Glassmorphism) 툴팁으로 시각화합니다. 클라이언트 사이드 Fallback 전처리기가 포함되어 안정적으로 동작하며, 모바일 터치 디바이스 조작 및 150ms 마우스 오프 지연 처리가 탑재되었습니다.
* **추천 후속 질문 제안 (Suggested Follow-up Questions)**: AI 답변 완결 시점에 사용자가 이어서 질문하기 좋은 3가지 후속 질문을 자동으로 추천하며, Framer Motion 마이크로 애니메이션이 적용된 버튼을 눌러 즉시 유기적으로 추가 탐색을 진행할 수 있습니다.
* **AI 협업 질문 가이드 (Copilot Refinement)**: 검색어 제출 전, AI가 사용자의 질문을 분석하고 검색 의도나 추가 맥락을 정교화할 수 있는 맞춤 질문 가이드라인을 동적으로 조율합니다. 다중 선택형 명확화 칩(Chip), 추천 질문 바로 검색 버튼, 그리고 세부 요구사항 입력을 위한 추가 맥락 영역이 Sleek Glassmorphism 패널로 시각화됩니다.
* **로컬 Fallback 모드**: API 키가 없을 때에도 에러로 멈추지 않고 가상 답변 및 모의 웹 검색 결과(Tavily mock) 스트리밍 프로토콜로 작동하여 원활한 오프라인 테스트가 가능합니다.
* **미디어(이미지/영상) 검색 결과 갤러리 및 스마트 라이트박스**:
  * **유형별 탭 필터링**: 수집된 미디어 결과를 "전체", "이미지", "동영상" 탭으로 분류하고 실시간으로 필터링해 보여줍니다. YouTube, Vimeo 등 비디오 링크 자동 감지 및 파싱이 포함되어 있습니다.
  * **비디오 인라인 재생**: 라이트박스 내부에서 YouTube, Vimeo 등의 동영상을 별도 페이지 이동 없이 즉시 재생(임베드 `<iframe>` 및 로딩 스피너)할 수 있습니다.
  * **미디어 전체 보기 모달**: 대량 수집된 미디어를 스크롤 가능한 대형 그리드 오버레이 모달로 확장하여 한눈에 조회할 수 있습니다.
  * **인터랙티브 라이트박스**: 자동 슬라이드쇼(3초 간격), 이미지 확대/축소(Zoom In/Out, 50%~300%), 회전(90도 단위), 상세정보 패널(Glassmorphism Sidebar), 하단 가로 스크롤 썸네일 스트립(Thumbnail strip) 조작, 개별 미디어 다운로드, 개별 링크 복사 및 Web Share API 기반 공유 기능을 지원합니다.
* **인터랙티브 데이터 시각화 차트 (Interactive Data Charts)**: AI 답변 스트리밍 중 ` ```chart ` 코드블록 형식의 JSON 데이터를 감지하여, 이를 실시간 반응형 인터랙티브 차트(막대, 꺾은선, 영역, 도넛)로 자동 변환 렌더링합니다. 개별 계열 활성/비활성 토글 범례, 마우스 움직임에 반응하는 정교한 호버 툴팁, 도넛 슬라이스 돌출 애니메이션 효과 등이 내장되어 있습니다.
* **목적별 맞춤 검색 템플릿 (Search Templates)**: 개발/코딩, 비즈니스/시장 분석, 학술/연구, 여행/라이프스타일 등 5가지 핵심 카테고리별로 최적화된 프롬프트 카드 템플릿을 제공합니다. 템플릿 선택 시 해당 검색어 입력뿐만 아니라 최적의 검색 포커스 모드(학술, 코드 등)와 프로/심층 탐구 모드(Pro Mode)가 자동으로 스마트하게 사전 설정(Preset)되어 고품질 검색 결과를 유도합니다.

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
│   │   ├── chat/
│   │   │   └── route.ts       # Vercel AI SDK & Gemini API 스트리밍 라우터
│   │   └── refine/
│   │       └── route.ts       # [NEW] Copilot 질문 정교화 가이드 생성 API
│   ├── globals.css            # Tailwind CSS v4 스타일 파일
│   ├── layout.tsx             # 루트 레이아웃 (Geist 폰트 및 메타데이터)
│   └── page.tsx               # 검색창 / 대화창 화면 전환 및 사이드바 연동 메인 페이지
└── components/
    ├── chat-interface.tsx     # 채팅 로그, 출처 카드, 스트리밍 답변 렌더링 UI (모바일 햄버거 메뉴 포함)
    ├── copilot-refinement.tsx # [NEW] Copilot 질문 구체화/가이드라인 칩 선택형 인터페이스
    ├── history-sidebar.tsx    # 로컬 스토리지 기반 검색 기록 사이드바 (데스크톱 접기 / 모바일 드로어)
    ├── interactive-chart.tsx  # [NEW] SVG & Framer Motion 기반 반응형 인터랙티브 차트 컴포넌트
    ├── search-box.tsx         # 초기 검색어 입력 폼 컴포넌트
    └── search-path-graph.tsx  # [NEW] 프로 모드 탐색 경로 시각화 노드 그래프 컴포넌트 (SVG & HTML 융합형 인터랙티브 그래프)
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
