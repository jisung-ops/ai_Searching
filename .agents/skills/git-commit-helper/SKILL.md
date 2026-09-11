---
name: git-commit-helper
description: 작업 수정이 완료되었을 때 git status와 변경 사항을 분석하여 깃 커밋 메시지(git commit message)를 추천해주는 스킬
---

# Git Commit Recommendation Skill

이 스킬은 코드 수정 및 기능 구현이 완성된 후 사용자가 커밋 메시지 추천을 요청할 때 사용됩니다.

## 수행 지침
1. 현재 프로젝트의 변경된 파일(`git status` 및 `git diff`)을 파악합니다.
2. 깃 커밋 메시지(git commit message) 작성 시 `style: ...` 등 영어 문구를 사용하지 말고 **반드시 명확하고 직관적인 한글로 작성**합니다.
3. **자동 푸시 금지 및 사용자 승인 필수**: 작업이 완료되더라도 자동으로 바로 `git push` 하지 마십시오.
4. 사용자에게 2~3가지의 추천 한글 커밋 메시지를 제안하고, 원하는 커밋 메시지가 있는지 또는 직접 지정할 메시지가 있는지 질문(`ask_question` 또는 대화)으로 물어보십시오.
5. 사용자로부터 커밋 메시지 선택 및 승인을 확인받은 후에만 지정된 커밋 메시지로 `git commit` 및 `git push`를 진행하십시오.
