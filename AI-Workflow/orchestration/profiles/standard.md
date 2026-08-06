# Standard Execution Profile

## 適用範圍

本 Profile 適用 `risk_level=2` 的一般功能、單一模組多檔案修改、一般 Refactor、需要調查的 Bugfix
與沒有 Level 3 hard trigger 的標準任務。資訊不足但沒有高風險訊號時也使用本 Profile，不得降為
Lightweight。

## 完整生命週期與必要後續階段

Standard 使用現有編排元件，完整生命週期依序為：

1. `task-analysis`：產生完整且 `status=analyzed` 的 Task Manifest。
2. `risk-assessment` 與 `execution-profile-resolution`：凍結 Level 2 與本 Profile。
3. `role-planner`：產生 Role Plan 與高信心 facts／selectors。
4. `rule-resolution`：使用 targeted mode，只解析 Role 必要 bundle、明確 Skill、高信心 selector 命中的
   Skill、dependencies 與必要 standalone rule。
5. `context-resolution`：仍由 Rule Resolution 依現有契約呼叫，只處理與本任務 Project、唯一 Module、
   Target 與 Context policy 相關的候選。
6. `preflight`：使用 standard mode 驗證 Task Manifest、Role Plan、Targeted Rule Set、Context、hash、
   fingerprint、Role／Skill 相容性與 Result Reporting。
7. `executor-adapter` 與 `role-entry`：依既有凍結契約執行。

其中前兩項是 Profile Resolution 的不可變輸入，不得在選取完成後重跑；Execution Profile Contract
的 `required_stages` 只列第三至第七項的後續 stage。

Targeted mode 只縮小候選與載入範圍，不得改變 Registry selector、dependency、conflict、precedence、
Context required policy、hash 或 fingerprint 的既有語意。

## 安全與升級

Standard 保留所有現有 Root、Config、Registry、Role、Skill、Context、Preflight 與 Executor Adapter
安全邊界。若發現跨 Module／Project／service、fullstack／mixed target、資料庫 schema 或 migration、
安全與權限、金流、公開契約、架構或 runtime migration、Production／Infrastructure、破壞性操作、
Workflow 治理規則修改等 Level 3 訊號，立即停止並回傳 `reroute-required`，重新分流至 `full`。
