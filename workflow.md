# Workflow Rules

每次任務都必須依序執行以下流程：

## 1. Code Phase

負責根據任務需求修改程式碼，修改範圍應限於本次任務需求，不得主動修改無關模組。

必須遵守：
- core.md
- restrictions.md
- frontend.md 或 backend.md


## 2. Validation Phase

負責檢查本次修改是否符合規則與專案狀態。

必須依本次修改範圍執行對應驗證：
- review.md 自我檢查
- TypeScript typecheck（涉及 TypeScript / Vue / 前端邏輯時）
- lint（專案有設定且修改程式碼時）
- build（涉及可建置程式碼或設定時）
- 測試本次修改影響範圍

若因環境限制無法執行 typecheck、lint、build 或測試，必須在 Output Phase 明確標示：

- 哪些驗證無法執行
- 無法執行的原因
- 建議工程師手動執行的指令


## 3. Output Phase

負責輸出本次任務結果。

輸出內容需包含：
- 修改了哪些檔案
- 完成了哪些需求
- 驗證結果
- 是否有未完成事項
- 是否有需要人工確認的風險
