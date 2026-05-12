# Runtime Rules

本文件為 AI 任務執行時的規則載入與行為控制入口。

## 必讀規則

所有任務都必須先閱讀：

- core.md
- restrictions.md
- workflow.md

---


## 前端任務

需額外閱讀：

- frontend.md
- review.md

適用情境：
- Vue component
- composables
- stores
- UI modules
- frontend refactor

---

## 後端任務

需額外閱讀：

- backend.md
- review.md

適用情境：
- API 開發
- database
- service logic
- backend refactor

---

## Review Task

需閱讀：

- core.md
- restrictions.md
- review.md



## 規則優先級

規則衝突時，依以下優先級處理：

1. restrictions.md
2. core.md
3. workflow.md
4. frontend.md / backend.md
5. review.md

## 未知情況處理

若規則未明確定義：

- 優先維持既有架構
- 優先維持資料流穩定
- 不主動新增抽象層
- 不主動進行大型重構
- 採用最小影響原則
