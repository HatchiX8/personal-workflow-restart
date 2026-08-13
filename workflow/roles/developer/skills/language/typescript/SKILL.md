---
name: typescript
description: Developer 的 TypeScript 語言規則。當 project.config.json 的作用中 stack 宣告 languages 包含 typescript，或本次修改的程式碼明確使用 TypeScript 時使用。
---

# Developer TypeScript Language Skill

- Function、公開邊界與重要資料結構必須具備明確型別。
- API、DTO、state、event、callback 與外部服務 payload 應保留可追蹤的型別契約。
- 不允許無理由使用 `any`。
- 不得以型別斷言掩蓋尚未確認的資料結構。
- 型別、interface、enum 與常數集合的命名必須延續既有專案慣例。
- 修改型別時必須確認所有使用端與 runtime 行為仍一致。
- 若專案有 typecheck，完成後依修改範圍執行。
