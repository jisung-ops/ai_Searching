<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Skill Execution & Git Commit Automation Rule

1. **자동 스킬 학습 및 즉시 적용**: 작업 시작 및 코드 수정이 완료될 때마다 `.agents/skills/` 디렉토리에 등록된 스킬(예: `git-commit-helper`)을 반드시 미리 확인하고 실행하십시오.
2. **커밋 메시지 자동 분석 및 추천**: 기능 구현 또는 코드 변경 작업이 끝난 직후, 항상 `git status`와 `git diff` 변경 사항을 파악하여 규칙에 부합하는 `git commit` 메시지를 자동으로 추천하고 커밋 수행 여부를 확인하십시오.

