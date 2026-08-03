# Developer 工作流程

每次 Developer 任務都必須依序執行以下流程。Skill 可以補充階段內的專業規則，不得略過、
替換或重新排序這套流程。

## 1. Understand

- 確認 Task Manifest、Role Plan、Scope、Target、Project、Module 與已選 Skill。
- 確認需求、完成條件與不可改變的既有行為。
- 發現需要不同 Scope、Target、Context 或 Skill 時，回傳 `reroute-required`。

## 2. Plan

- 依已選規則與 Context 規劃最小必要修改。
- 確認檔案責任、資料流、public API 與驗證需求。
- 不得在此階段重新選擇 Skill 或擴大任務範圍。

## 3. Implement

- 根據任務需求修改程式碼。
- 修改範圍限於 Task Manifest 核准的 Scope。
- 遵守 `core.md`、`restrictions.md` 與 Resolved Rule Set 已選 Skill。

## 4. Validate

- 依 `validation.md` 與已選 Skill 執行對應驗證。
- 驗證無法執行時，保留原因、未執行項目與建議指令。

## 5. Self Review

- 依 `validation.md` 完成 Scope、Data Flow、Architecture、Code Quality 與 Validation 檢查。
- 存在角色限制或 Skill 停止條件時，不得宣告完成。

## 6. Report

- 依 `output.md` 回報修改、完成需求、驗證結果、未完成事項與風險。
