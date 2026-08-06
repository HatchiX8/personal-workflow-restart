# 共用 Workflow 規則

本文件定義全角色通用 workflow 規則。

## 固定輸入

Task Analysis 產生的 Task Manifest、Risk Assessment 產生的 Task Risk、Profile Resolution 產生的
Execution Profile Contract、Role Planner 產生的 Role Plan，以及 Rule Resolution 產生的 Resolved
Rule Set 都是後續階段的固定輸入。Execute 不得從原始 Prompt 或執行期間重新推導 routing、風險
或 Profile 欄位；發現更高風險時只能回傳 `reroute-required` 交由 Dispatcher 向上升級。
