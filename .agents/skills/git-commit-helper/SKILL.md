---
name: git-commit-helper
description: 작업 수정이 완료되었을 때 git status와 변경 사항을 분석하여 깃 커밋 메시지(git commit message)를 추천해주는 스킬
---

# Git Commit Recommendation Skill

이 스킬은 코드 수정 및 기능 구현이 완성된 후 사용자가 커밋 메시지 추천을 요청할 때 사용됩니다.

## 수행 지침
1. 현재 프로젝트의 변경된 파일(`git status` 및 `git diff`)을 파악합니다.
2. 대표적인 커밋 컨벤션(`feat`, `fix`, `refactor`, `docs`, `style`, `chore` 등)을 준수합니다.
3. 명확하고 읽기 쉬운 한글 및 영문 커밋 메시지 추천안을 제시하거나 사용자의 요청에 따라 즉시 git commit을 진행합니다.
