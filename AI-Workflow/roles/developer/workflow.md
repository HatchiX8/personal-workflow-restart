# Developer 工作流程

Developer 依凍結的 Action 使用下列兩條流程。Skill 可以補充階段內的專業規則，但不得改變 Action
授權邊界。

## `action=analyze`：唯讀分析

1. Understand：確認 Scope、Target、Module、問題與既有 Context。
2. Inspect：只讀搜尋並讀取回答問題所需的最小檔案範圍。
3. Analyze：整理既有行為、資料流、Contract、證據、推論與待確認事項。
4. Report：只在對話中回覆，不建立 md 報告或修改任何專案產物。

分析期間發現可能的修改方案時只能描述影響，不得直接實作。使用者後續要求修改時，必須重新路由為
`action=develop`。

## `action=develop`：正式開發

### 1. Understand

- 確認 Task Manifest、Role Plan、Scope、Target、Project、Module 與已選 Skill。
- 確認需求、完成條件與不可改變的既有行為。
- 發現需要不同 Scope、Target、Context 或 Skill 時，回傳 `reroute-required`。

### 2. Plan

- 依已選規則與 Context 規劃最小必要修改。
- 確認檔案責任、資料流、public API 與驗證需求。
- 不得在此階段重新選擇 Skill 或擴大任務範圍。

### 3. Implement

- 根據任務需求修改程式碼。
- 修改範圍限於 Task Manifest 核准的 Scope。
- 遵守 `core.md`、`restrictions.md` 與 Resolved Rule Set 已選 Skill。

### 4. Validate

- 依 `validation.md` 與已選 Skill 執行對應驗證。
- 驗證無法執行時，保留原因、未執行項目與建議指令。

### 5. Self Review

- 依 `validation.md` 完成 Scope、Data Flow、Architecture、Code Quality 與 Validation 檢查。
- 存在角色限制或 Skill 停止條件時，不得宣告完成。

### 6. Report

- 依 `output.md` 回報修改、完成需求、驗證結果、未完成事項與風險。
