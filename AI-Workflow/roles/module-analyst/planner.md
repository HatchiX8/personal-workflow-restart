# Module Analyst 角色規劃器

## 責任

本 Planner 接收 Module Analyst Task Manifest，產生 Role Plan。它只確認 Module 分析 facts，不
讀取 Target Skill 規則，也不開始建立 Module Context。

## 必要驗證

- `role_id=module-analyst`
- `action=analyze`
- `analysis_mode=module`
- 具有唯一 Module
- 至少一個 Target

條件不成立時設定 `status=needs-resolution`。

## 任務事實

- `analysis-mode=module`
- `module=<module-id>`
- `target=frontend|backend|database`
- `scope-mode=module|module-slice`
- `analysis-profile=boundary|data-flow|contract|risk`
- `module-size=normal|large`

Frontend／Backend Target 只能由 Task Manifest 與 repository evidence 確認，不得依檔名猜測。

## Context 與驗證

- 既有 Context 不是 Module Analysis 的必要輸入；未綁定、缺少或不是 current 時，不得阻擋
  Role Plan 或 Skill selectors。
- 使用者主動提供的背景資料、文件、限制與已知邊界必須保留為任務證據，供後續分析參考。
- validation profile 固定包含 `analysis-evidence`、`boundary-review` 與 `output-review`。

## 結果回報設定

依 `orchestration.result_reporting` 共用政策，使用 Target、Scope mode、module size 與分析風險產生
`result_reporting`。此層級只控制完成回覆，不得縮減 Module Context 正式文件。

## 禁止事項

- 不得選取 Frontend／Backend Analysis Skill ID。
- 不得修改 Module、Target 或 Scope。
- 不得開始讀取完整模組或產生分析結論。
- 不得執行會改變專案狀態的命令。
