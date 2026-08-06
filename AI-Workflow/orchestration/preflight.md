# Preflight 執行前驗證契約

> 載入政策：本檔是 Markdown fallback 與 Runtime 行為說明。正常路徑由 Node Runtime 執行完整
> Preflight；Agent 只接受 `status=ready` 且 `preflight.can_execute=true` 的結果。

## 責任

Preflight 驗證 Task Manifest、Task Risk Assessment、Execution Profile Contract、Role Plan 與已凍結的 Resolved Rule Set 是否可以執行，並輸出符合 `schemas/preflight-result.schema.json` 的結果。Preflight 不選擇新規則、不修改前置產物，也不開始角色工作。

## 必要檢查

1. Workflow Config 與 Project Config 可解析，且符合各自設定的 Schema。
2. 每個被引用的 Registry 都可讀取、具有唯一 ID，且沒有無效路徑或 dependency cycle。
3. Task Manifest、Task Risk Assessment、Execution Profile Contract、Role Plan 與 Resolved Rule Set 符合各自 Schema，並共用相同 Task ID；Role 與 Action 在具有該欄位的產物間一致。
4. Action、Role、review／analysis mode 與明確 Skill 都已解析、為 active 且彼此相容。
5. routing 必要欄位具有高信心，且沒有未解析的必要候選或明確控制欄位衝突。
6. 每個已選的必要規則都存在於 Workflow Root 下、可用 UTF-8 讀取、content hash 未改變，且其 dependency 已選取。
   每個 `category=skill` 項目都必須回查 Skill Registry，且 Registry 的 `role_id` 必須等於 Resolved Rule Set 的 Role；不符合時以 `skill-role-mismatch:<skill-id>` 阻擋。
7. 每個已選 Context 都存在於宣告的 canonical `path_base` 下、未超出該基準、符合 project／module／target，保留 Context Resolution 的 required／optional reason，並符合 Context policy。
8. Rule Set 沒有衝突、狀態為 `resolved`，且重新計算的 fingerprint 與提供的 fingerprint 相同。
9. Develop 已解析出 Target；Module 範圍任務具有唯一 Module。Project／Module Context 預設為
   optional；只有 Project Config 或 Context metadata 明確標記 required 時，缺少或無效 Context
   才能阻擋。Module Analysis 不要求既有 Context。
10. Task Risk 必須為 `status=assessed`、沒有 unresolved，且 Profile 必須為 `status=selected`。Profile 的 `risk_level` 不得低於 Task Risk 的 `level`，Profile ID 與設定的風險層級必須相容，`upward_escalation` 必須為 true。
11. Profile 宣告的 required stages 必須具有對應的有效產物；任何被列為 skipped 的 stage 不得是該 Profile 的安全核心或必要階段。`full` Profile 必須保留現有完整流程。
12. Role Plan 必須包含符合 Result Reporting 政策的 `result_reporting`；最低層級、理由與允許向上
    提升的設定必須完整，且 Level 3 風險不得被判定為較低層級。

## 狀態規則

- `PASS`：所有檢查通過，`blockers=[]`、`warnings=[]`、`can_execute=true`。
- `PASS_WITH_WARNINGS`：沒有 blocker，只有政策允許的 warning，`can_execute=true`。
- `BLOCKED`：任何阻擋性檢查失敗，`can_execute=false`。

只有下列情況允許 warning：Target 未知但只使用 common checks 的 Review、沒有 Project Context
的 Project Analyst onboarding、optional Context 缺少／未綁定／不相容／已過期、刻意未載入的
非必要 Skill，或缺少 optional output directory。

## 必須阻擋的情況

- Workflow Config 或 Project Config 缺少／無效、Workflow Root 與已載入 Bootstrap 不一致，或 Registry 無效。
- Action／Role 未知、明確 Role／Skill 不存在於 Registry，或明確 Role／Action 不相容。
- 明確或自動選取的 Skill 不屬於目前 Role，或 Skill dependency 指向其他角色 Skill。
- Role Planner entry 不符合 Role Registry、Role Plan 不是 `planned`，或仍有 unresolved。
- Task Risk 缺少、Schema 無效、狀態未完成、仍有 unresolved，或 Task ID 不一致。
- Execution Profile 缺少、Schema 無效、狀態不是 `selected`、Task ID 不一致、風險層級低於 Task Risk，或宣告跳過必要安全階段。
- `result_reporting` 缺少、Schema 無效、理由為空，或違反 Level 3 最低層級條件。
- 缺少必要 Rule、Skill、Context、dependency、hash 或 fingerprint match。
- routing 必要的 Target／Module 存在歧義，包括候選分數差距低於政策門檻。
- 明確 required 的 Project／Module Context 缺少、未綁定、不是 current、不相容或 status 不受支援。
- 已選 Context 屬於其他 Project、路徑越界，或 hash 不一致；optional 的跨 Project 候選不得載入，
  但只產生 warning。
- `Resolved Rule Set.status=incomplete`、仍有未解析必要項目、存在衝突，或 Resolution 後內容已變更。
- 在取得 PASS 類結果前要求修改程式碼或規則。

## Execution Contract

對 PASS 類結果，必須從已凍結 Rule Set 設定 `execution_contract.role_id`、`executor_entry`、
`rule_set_fingerprint` 與 `allowed_action`，從已驗證的 Task Risk 與 Execution Profile 原樣複製
`risk_level` 與 `execution_profile`，並將 Role Plan 的 `result_reporting` 原樣複製到
`execution_contract.result_reporting`。`executor_entry` 必須符合 `roles/<role-id>/entry.md` 的標準路徑。
Preflight 不直接 dispatch；由 Dispatcher 將此 contract 交給 Executor Adapter。

若狀態為 `BLOCKED`，`execution_contract` 必須精確為 `null`；不得暴露任何可執行的角色入口或 fingerprint。

Role Entry 的輸入與責任邊界由 `orchestration/role-entry-contract.md` 定義。Preflight 必須驗證
該契約存在且可讀，但不得在此階段執行角色規則。
