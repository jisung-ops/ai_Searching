---
name: git-commit-helper
description: 작업 수정이 완료되었을 때 git status와 변경 사항을 분석하여 깃 커밋 메시지(git commit message)를 추천해주는 스킬
---

# Git Commit Recommendation Skill

이 스킬은 코드 수정 및 기능 구현이 완성된 후 사용자가 커밋 메시지 추천을 요청할 때 사용됩니다.

## 수행 지침
1. 현재 프로젝트의 변경된 파일(`git status` 및 `git diff`)을 파악합니다.
2. 깃 커밋 메시지(git commit message) 작성 시 `style: ...` 등 영어 문구를 사용하지 말고 **반드시 명확하고 직관적인 한글로 작성**합니다.
   * 예시: `디자인 개선: 연관 탐색 카드 및 질문 헤더 글래스모피즘 스타일 적용`
   * 예시: `버그 수정: Gemini API 404 모델명 오류 수정`
3. 코드 변경 작업 완료 시 상기 한글 커밋 규칙에 부합하는 커밋 메시지를 생성하여 `git commit` 및 `git push`를 진행합니다.
