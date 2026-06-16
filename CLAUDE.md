# OmniSeek AI - Developer Guidelines

## 🤖 AI Assistant Rules (스킬 지침)

### 1. 작업 완료 지침 (Post-Task Workflow)
- **기능 추가 및 수정 등 작업이 완료되면 무조건 아래 단계를 실행하십시오:**
  1. 가장 먼저 [README.md](file:///C:/Users/정지성/OneDrive/바탕 화면/ai_Searching/README.md) 파일에 해당 기능에 대한 스펙과 설명, 변경 사항을 업데이트합니다.
  2. 업데이트를 마치면 사용자에게 **간결한 스타일**의 Git 커밋 메시지 선택지 3개 정도를 질문 창(`ask_question`)을 띄워 제안합니다.
  3. 사용자가 원하는 메시지를 선택하면, 해당 메시지를 반영하여 터미널에서 `git add .`, `git commit -m "[선택된 메시지]"`, `git push` 명령어를 자동으로 실행해 저장소에 업로드합니다.

---

@AGENTS.md
