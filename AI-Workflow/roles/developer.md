# Agent Rules

本文件為 Codex 任務執行時的規則載入與行為控制入口。

本文件必須由解析後的 `AI-Workflow/bootstrap.md` 判斷角色後載入。

## Rule Bootstrap

若解析後的 AI Workflow Root 不存在 `roles/developer/`：

- 停止任務執行
- 不得自行推測規則
- 不得直接開始修改程式碼
- 回報缺少 Developer 規則環境

## Architecture Task

若任務涉及新增、移動、刪除、拆分資料夾或檔案，或調整 import direction、專案分層，必須先閱讀 `AI-Workflow/roles/developer/architecture.md`。

`AI-Workflow/roles/developer/architecture.md` 是 Architecture Task 的載入入口，不保存特定專案的資料夾結構、模組責任或 import direction。

專案客製結構規則由 `AI-Workflow/roles/developer/architecture.md` 引導讀取 `AI-Workflow/roles/developer/skills/project-structure.md`。

需額外閱讀：

- AI-Workflow/roles/developer/architecture.md
- AI-Workflow/roles/developer/review.md

## 任務模式

任務模式規則由 `AI-Workflow/workflow/common.md` 定義。

若任務明確指定 skill，需額外閱讀 AI-Workflow/roles/developer/skills/<skill-name>.md。
若 skill 檔案不存在，停止執行並回報缺少的 skill 規則。

## 必讀規則

所有任務都必須先閱讀：

- AI-Workflow/roles/developer/core.md
- AI-Workflow/roles/developer/restrictions.md
- AI-Workflow/roles/developer/workflow.md

---

## Refactor Task

若任務明確要求重構、整理既有邏輯、降低重複、拆分 function、改善可讀性或調整責任邊界，需額外閱讀：

- AI-Workflow/roles/developer/skills/refactor/general-refactor.md
- AI-Workflow/roles/developer/review.md

若重構涉及新增、移動、刪除、拆分資料夾或檔案，或調整 import direction、專案分層，仍必須同時依 Architecture Task 載入：

- AI-Workflow/roles/developer/architecture.md
- AI-Workflow/roles/developer/skills/project-structure.md

---

## 前端任務

需額外閱讀：

- AI-Workflow/roles/developer/frontend.md
- AI-Workflow/roles/developer/review.md

適用情境：

- Vue component
- composables
- stores
- UI modules
- frontend refactor

---

## 後端任務

需額外閱讀：

- AI-Workflow/roles/developer/backend.md
- AI-Workflow/roles/developer/review.md

適用情境：

- API 開發
- database
- service logic
- backend refactor

---

## Python 工具任務

需額外閱讀：

- AI-Workflow/roles/developer/python-tool.md
- AI-Workflow/roles/developer/review.md

適用情境：

- CLI 工具
- 檔案整理、轉換、批次處理
- 資料匯入、匯出、清洗
- 開發流程自動化
- 本機維運或檢查腳本

---

## Review Task

需閱讀：

- AI-Workflow/roles/developer/core.md
- AI-Workflow/roles/developer/restrictions.md
- AI-Workflow/roles/developer/workflow.md
- AI-Workflow/roles/developer/review.md

## 規則優先級

規則衝突時，依以下優先級處理：

1. AI-Workflow/roles/developer/restrictions.md
2. 明確指定或任務觸發載入的 AI-Workflow/roles/developer/skills/\*.md
3. AI-Workflow/roles/developer/architecture.md
4. AI-Workflow/roles/developer/core.md
5. AI-Workflow/roles/developer/workflow.md
6. AI-Workflow/roles/developer/frontend.md / AI-Workflow/roles/developer/backend.md / AI-Workflow/roles/developer/python-tool.md
7. AI-Workflow/roles/developer/review.md

## 未知情況處理

若規則未明確定義：

- 優先維持既有架構
- 優先維持資料流穩定
- 不主動新增抽象層
- 不主動進行大型重構
- 採用最小影響原則
