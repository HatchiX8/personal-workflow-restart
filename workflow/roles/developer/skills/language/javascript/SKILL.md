---
name: javascript
description: Developer 的 JavaScript 語言規則。當 project.config.json 的作用中 stack 宣告 languages 包含 javascript，或本次修改的程式碼明確使用 JavaScript 時使用。
---

# Developer JavaScript Language Skill

- 複雜資料結構必須能透過清楚命名、JSDoc、schema、validator 或既有模式理解。
- Function 的輸入、輸出與重要 callback payload 必須保持清楚。
- 不得以語意不明的鬆散物件傳遞重要資料。
- 避免使用隱式型別轉換處理重要邏輯。
- 若專案已有 JSDoc、runtime validation 或 schema 慣例，修改時必須沿用。
- 不得因本 Skill 自行要求 TypeScript typecheck。
- 若專案有 JavaScript lint 或檢查指令，完成後依修改範圍執行。
