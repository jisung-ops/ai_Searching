# 🔍 OmniSeek AI — Real-time AI Search Agent

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.7-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vercel_AI_SDK-v6.x-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel AI SDK" />
  <img src="https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
</p>

<p align="center">
  <strong>Next.js, TypeScript, Tailwind CSS, Vercel AI SDK를 사용해 만든 실시간 AI 검색 에이전트 서비스</strong>
</p>

---

## 💡 프로젝트 소개 (Introduction)

**OmniSeek AI**는 사용자의 질문에 맞춰 실시간으로 정보를 탐색하고 지식을 정리해주는 **Perplexity 스타일의 AI 검색 에이전트**입니다. 
단순한 챗봇을 넘어 웹 환경에서의 참고 출처 제시, AI의 실시간 사고 흐름(Reasoning) 시각화, 그리고 세련된 글래스모피즘(Glassmorphism) 기반 UI를 통해 사용자에게 최적의 정보 탐색 경험을 제공합니다.

인사담당자분들께 **현대적인 Next.js 16(App Router)과 React 19의 최신 스펙**, 그리고 **Vercel AI SDK를 이용한 최적화된 스트리밍 처리 기술**을 증명할 수 있도록 설계 및 개발되었습니다.

---

## ✨ 핵심 기능 (Key Features)

### 1. 실시간 AI 스트리밍 답변
- **Vercel AI SDK & Google Gemini 1.5 Flash**를 연동하여 지연 시간(Latency)을 최소화한 실시간 텍스트 답변 스트리밍을 제공합니다.
- `useChat` 훅을 활용하여 안정적인 세션 관리와 인터랙티브한 반응형 스트리밍을 구축했습니다.

### 2. AI 사고 과정(Reasoning) 및 참고 출처 시각화
- 답변을 출력하기 전 AI가 어떻게 생각하고 탐색하고 있는지를 시각화하는 **AI 생각 흐름(Reasoning Step)** 영역을 포함합니다.
- 답변 상단에 검색된 참고 출처(Sources) 카드를 깔끔하게 배치하여 제공되는 정보의 신뢰도를 증명합니다.

### 3. 세련되고 역동적인 UI/UX
- **Framer Motion**을 적용하여 초기 검색 화면에서 활성화된 대화 화면으로 부드럽고 매끄럽게 전환(Layout Animation)됩니다.
- 모던하고 깊이감 있는 **다크 모드 디자인 시스템**과 앰비언트 글로우(Ambient Glow) 배경 그래디언트를 적용하여 시각적 완성도를 극대화했습니다.

### 4. 완성도 높은 개발자 경험 (DX) & Fallback 대응
- `GEMINI_API_KEY` 환경변수가 주어지지 않은 환경에서도 서비스가 멈추거나 터지지 않도록, **Mock Streaming Response**를 구현하여 친절한 설정 안내 가이드를 화면에 직접 보여줍니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend & Core
| 기술 | 분류 | 설명 |
| :--- | :--- | :--- |
| **Next.js 16.2** | Framework | React 19 기반의 최신 App Router 아키텍처 및 서버 컴포넌트 최적화 |
| **TypeScript** | Language | 엄격한 타입 지정을 통한 코드 안정성 확보 및 디버깅 생산성 향상 |
| **Tailwind CSS v4.0** | Styling | Rust 기반 초고속 컴파일 엔진 탑재, 커스텀 변수 및 다크 모드 스타일링 |
| **Framer Motion** | Animation | 컴포넌트 진입/이탈(AnimatePresence) 및 부드러운 상태 전환 모션 구현 |
| **Lucide React** | Icons | 직관적인 아이콘 세트를 통한 시각적 가이드 제공 |

### AI & API
| 기술 | 분류 | 설명 |
| :--- | :--- | :--- |
| **Vercel AI SDK** | AI Library | AI 응답 스트리밍 최적화 및 `useChat`을 활용한 손쉬운 실시간 데이터 바인딩 |
| **Google Gemini API** | LLM | `gemini-1.5-flash` 모델을 통한 빠르고 신뢰성 높은 실시간 지식 정리 |

---

## 📂 프로젝트 구조 (Project Folder Structure)

```text
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # Vercel AI SDK & Gemini API 스트리밍 라우터
│   ├── favicon.ico
│   ├── globals.css            # 글로벌 Tailwind CSS v4 스타일시트
│   ├── layout.tsx             # Root 레이아웃 설정 (폰트 및 메타데이터)
│   └── page.tsx               # 검색 메인 랜드 및 화면 전환 컨트롤 타워
├── components/
│   ├── chat-interface.tsx     # 실시간 채팅, 출처 카드, 스트리밍 출력 UI
│   └── search-box.tsx         # 초기 랜딩 검색어 입력 폼 컴포넌트
```

---

## 🚀 시작 가이드 (Getting Started)

프로젝트를 로컬 환경에 설치하고 실행하는 방법은 다음과 같습니다.

### 1. 저장소 클론 및 패키지 설치
```bash
# 의존성 패키지 설치
npm install
```

### 2. 환경 변수 설정
프로젝트 루트 디렉터리에 `.env.local` 파일을 생성하고 아래와 같이 Gemini API Key를 입력합니다.
*(API 키가 없어도 가상 응답 스트리밍 모드로 정상 작동합니다)*

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 실시간 AI 검색을 확인할 수 있습니다.

### 4. 프로덕션 빌드 및 검증
```bash
# 프로덕션 빌드 실행
npm run build

# 빌드 결과물 로컬 테스트
npm run start
```

---

## 👤 개발자 소개 & Contact

- **이름**: [본인 이름 기재]
- **GitHub**: [@GitHub 유저네임](https://github.com/your-username)
- **Email**: your-email@example.com
- **Portfolio**: [포트폴리오 주소 또는 블로그]

---

OmniSeek AI 프로젝트를 검토해주셔서 감사합니다. 추가적인 제안이나 문의사항은 언제든 편하게 연락해 주세요!
