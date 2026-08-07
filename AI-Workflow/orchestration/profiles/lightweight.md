# Lightweight Execution Profile

## 適用範圍

本 Profile 只適用 `risk_level=1`，且必須已通過
`orchestration/execution-profile-resolution.md` 的 Level 1 准入條件。它服務範圍明確、影響局部、
容易驗證與還原的低風險任務；Profile 本身不得將未知或較高風險任務降級。

一般既有功能、程式碼、資料流或 Contract 的唯讀分析使用 Developer／Analyze；其他沒有現行合法
Role／Action 的問答仍須阻擋。不得把唯讀需求改寫成 Develop，也不得繞過 Role Registry。

## 必要階段

Task Analysis、Risk Assessment 與 Execution Profile Resolution 已完成後，Dispatcher 依序執行：

1. `role-planner`：使用 lightweight mode／deterministic projection，只從已確認的 Task Manifest
   投影最小 facts、明確 Skill selectors、`result_reporting`、最低 validation profiles 與 context
   requirements；不得讀取 repository evidence、重新推導風險或產生條件式 Skill selector。
2. `rule-resolution`：使用 lightweight mode，只做精確 Role／Skill 驗證、必要 bundle 與 dependency
   closure，產生最小可執行規則集合；不得重新推導 Role、Skill 或風險。
3. `context-resolution`：仍由 Rule Resolution 依既有內部契約呼叫；Level 1 不得需要 required
   Context，optional Context 只依既有政策處理，不得由 Dispatcher 建立獨立階段。
4. `preflight`：使用 lightweight mode，執行本文件的最低檢查與既有 Preflight 的不可省略安全檢查。
5. `executor-adapter`：只有輕量 Preflight 通過後才交付凍結 contract。
6. `role-entry`：只在已核准 Scope 內執行。

本 Profile 不跳過任何既有下游契約，只限制各階段的輸入來源與解析深度，以維持 Role Plan、
Resolved Rule Set、Preflight Result 與 Execution Contract 相容。若任務需要額外 Role-specific facts、
repository evidence、條件式 Skill 推導或 required Context，必須升級為 `standard` 或 `full`。

## 不可省略的安全核心

- Workflow Root、Project Root、路徑邊界與使用者授權範圍。
- Secrets、credential、敏感資料與破壞性操作防護。
- Action／Role／Skill 的存在性、active 狀態與彼此相容性。
- Role required bundle、Rule／Skill dependency、路徑 canonicalization 與 content hash。
- Resolved Rule Set fingerprint 與 Executor Adapter 准入一致性。
- 依 Task Type 與修改範圍執行最低限度的針對性驗證。

Lightweight 是較小的規則載入範圍，不是免除安全、Schema、依賴或執行契約。

## 升級條件

發現多檔案或多項修改、需要 Role Planner facts、條件式 Skill、Context、第二個 Module、不同 Target、
資料庫、安全、權限、金流、公開契約、架構、部署、刪除或其他較高風險訊號時，立即停止並回傳
`reroute-required`。不得在本 Profile 內補做 Standard／Full 決策。
