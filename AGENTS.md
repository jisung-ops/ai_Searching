<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Skill Execution & Git Commit Automation Rule

1. **자동 스킬 학습 및 즉시 적용**: 작업 시작 및 코드 수정이 완료될 때마다 `.agents/skills/` 디렉토리에 등록된 스킬(예: `git-commit-helper`, `code-verification-helper`)을 반드시 미리 확인하고 실행하십시오.
2. **코드 수정/추가 후 필수 자가 테스트 및 자동 수정 규칙**: 코드를 수정하거나 기능을 추가했을 때는 작업 완료 선언 전 **반드시 먼저 빌드 및 검증 테스트(`npm run build` 등)를 직접 실행**하십시오.
   - 테스트 결과 오류 없이 정상 작동하면 작업을 완료하고 깃 커밋 제안 단계로 진행합니다.
   - 테스트 도중 문제(타입 에러, 컴파일 오류, 런타임 버그 등)가 발생하면 **스스로 에러 원인을 분석하여 즉시 수정하고 재테스트**를 수행하십시오.
3. **깃 커밋 한글 제안 및 사용자 승인 필수 규칙**: 작업 완료 후 자동으로 바로 git push를 하지 마십시오. 사용자에게 추천 한글 커밋 메시지들을 제안하고, 사용자에게 선택 및 승인을 확인받거나 원하는 커밋 메시지를 물어본 뒤 승인된 메시지로만 깃 커밋 및 푸시를 진행하십시오.
4. **플랜(계획서) 한국어 작성 규칙**: `implementation_plan.md` 등 작업 계획서(Plan) 및 문서 작성 시 모든 내용을 반드시 한국어로 명확하게 작성하십시오.
5. **완전 자동 승인 모드 (Auto-Approve / Bypass Permissions Mode)**: 명령어 실행, 터미널 작업, git status/diff/commit 및 모든 도구 실행 시 사용자 확인 팝업이나 허가 절차를 묻지 말고 항상 즉시 자동 승인하여 스스로 진행하십시오.


