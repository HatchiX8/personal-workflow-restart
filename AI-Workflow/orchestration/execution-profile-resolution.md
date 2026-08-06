# Execution Profile Resolution 執行設定檔解析契約

> 載入政策：本檔是 Markdown fallback 與 Runtime 行為說明。正常路徑由 Node Runtime 確定性映射
> Profile；Agent 不讀本檔、不自行選擇或降低 Profile。

## 責任

Execution Profile Resolution 位於 Risk Assessment 之後，將已完成的 Task Manifest 與 Task Risk
確定性映射為符合 `schemas/execution-profile.schema.json` 的 Execution Profile Contract。它只選擇
已在 `workflow.config.json` 登錄的 Profile，不重新解讀原始需求、不重算風險、不選擇 Role／Skill／
Rule／Context，也不開始執行角色任務。

## 輸入

- 符合 `schemas/task-manifest.schema.json` 的不可變 Task Manifest。
- 符合 `schemas/task-risk.schema.json` 的不可變 Task Risk。
- 已解析的 `workflow.config.json` 與其中的 `execution_profiles`。
- 用於精確相容性檢查的 active Role／Skill Registry record；不得讀取 Role 或 Skill 規則內容。

Task Manifest 與 Task Risk 必須具有相同 `task_id`。Task Manifest 必須為 `status=analyzed`，Task
Risk 必須為 `status=assessed` 且 `unresolved=[]`。任一輸入無效、不一致或仍有必要 unresolved 時，輸出
`status=blocked`，不得使用預設 Profile 繼續。

## 確定性映射

Profile 只能依 Task Risk level 映射：

| `risk_level` | `profile_id` | 設定路徑 |
|---:|---|---|
| 1 | `lightweight` | `execution_profiles.lightweight` |
| 2 | `standard` | `execution_profiles.standard` |
| 3 | `full` | `execution_profiles.full` |

不得因使用者明確指定 Role／Skill、預期 token 成本、時間壓力或模型資源不足而降低 Profile。資訊
不足必須由 Risk Assessment 至少判為 Level 2；此階段不得自行改判 Level 1。任何 Level 3 hard
trigger 必須選擇 `full`。

## Level 1 准入條件

`lightweight` 只有在下列條件全部成立時才能設定 `status=selected`：

1. Task Manifest 的 Action 是現行 Role Registry 支援的 `develop`、`review` 或 `analyze`。
2. `role_id` 精確指向 active Role，且該 Role 的 Action 與 Manifest Action 相容。
3. 每個明確 `skill_id` 都精確存在、為 active，且 `skill.role_id` 等於 Manifest Role。
4. Task Manifest 沒有 unresolved，且 Role／Action 所需的 Target、review mode、analysis mode、唯一
   Module 等欄位已依現行契約解析。
5. 任務不需要 required Project／Module Context，不含 Level 2 或 Level 3 升級條件，且可以只用
   安全核心、最小規則集合與輕量 Preflight 安全執行。

一般問答若無法對應現行合法 Action／Role，必須輸出 `status=blocked`，在 `reasons` 記錄
`advisory-role-not-yet-supported`。不得偷偷選擇 `developer`，也不得把問答改寫成 Develop 任務。

## Profile Contract

輸出必須包含：

- `task_id` 與 `risk_level`；
- 確定映射的 `profile_id`；
- 後續必須執行的 `required_stages`；
- 本 Profile 明確不執行的 `skipped_stages`；
- 至少一個可供工程師閱讀或機器比對的 `reasons`；
- 固定為 `true` 的 `upward_escalation`；
- `selected` 或 `blocked` 狀態。

`required_stages` 與 `skipped_stages` 不得有重複項目。`selected` 時至少要有一個 required stage；
`blocked` 時不得提供可執行的 required stage。Dispatcher 只能執行所選 Profile 契約列為 required
的後續階段。

Profile 選取成功時，必須使用下列確定性 stage 集合；這些都是 Profile Resolution 後的後續階段：

| `profile_id` | `required_stages` | `skipped_stages` |
|---|---|---|
| `lightweight` | `role-planner`, `rule-resolution`, `context-resolution`, `preflight`, `executor-adapter`, `role-entry` | 空陣列 |
| `standard` | `role-planner`, `rule-resolution`, `context-resolution`, `preflight`, `executor-adapter`, `role-entry` | 空陣列 |
| `full` | `role-planner`, `rule-resolution`, `context-resolution`, `preflight`, `executor-adapter`, `role-entry` | 空陣列 |

三個 Profile 共用 stage 身分以保持既有產物契約；執行深度由各 Profile 對同一 stage 宣告的 mode
決定。`context-resolution` 仍是 Rule Resolution 的內部契約，列入 contract 只是記錄它不可被省略，
Dispatcher 不得因此把它改成獨立 dispatch 階段。阻擋結果的 `required_stages` 必須為空陣列，
`skipped_stages` 應列出尚未執行的全部後續 stage。

## 升級與阻擋

執行中若新證據顯示 Scope、Target、Module、Context、資料、安全、公開契約、破壞性操作或其他
風險高於原判定，Role Entry 必須回傳 `reroute-required`。Dispatcher 應重新執行 Risk Assessment
與 Execution Profile Resolution，且只允許：

```text
lightweight -> standard
lightweight -> full
standard -> full
```

禁止執行中降級。設定路徑不存在、Profile 契約不可讀、Task ID 不一致、風險與 Profile 映射不符、
Level 1 准入失敗，或一般問答尚無合法 Advisory Role／Action 時，都必須回傳 `status=blocked` 並
保留原因，不得改走其他 Profile。

若 reroute 只是同一風險層級內的 Scope、Target、Module、Context 或 Rule Set contract 失效，可以
重新選擇相同 Profile 並完整重建其所有後續產物；這不構成降級。若新證據提高風險，則必須使用
上述向上升級方向。`full` 可以在 Level 3 重新產生 Full contract，不得沿用舊 fingerprint。
