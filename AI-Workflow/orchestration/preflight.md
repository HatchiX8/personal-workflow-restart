# Preflight 執行前驗證契約

## 責任

Preflight 驗證 Task Manifest、Role Plan 與已凍結的 Resolved Rule Set 是否可以執行，並輸出符合 `schemas/preflight-result.schema.json` 的結果。Preflight 不選擇新規則、不修改前置產物，也不開始角色工作。

## 必要檢查

1. Workflow Config 與 Project Config 可解析，且符合各自設定的 Schema。
2. 每個被引用的 Registry 都可讀取、具有唯一 ID，且沒有無效路徑或 dependency cycle。
3. Task Manifest、Role Plan 與 Resolved Rule Set 符合各自 Schema，並共用相同 Task ID、Role 與 Action。
4. Action、Role、review／analysis mode 與明確 Skill 都已解析、為 active 且彼此相容。
5. routing 必要欄位具有高信心，且沒有未解析的必要候選或明確控制欄位衝突。
6. 每個已選的必要規則都存在於 Workflow Root 下、可用 UTF-8 讀取、content hash 未改變，且其 dependency 已選取。
   每個 `category=skill` 項目都必須回查 Skill Registry，且 Registry 的 `role_id` 必須等於 Resolved Rule Set 的 Role；不符合時以 `skill-role-mismatch:<skill-id>` 阻擋。
7. 每個已選 Context 都存在於宣告的 canonical `path_base` 下、未超出該基準、符合 project／module／target，保留 Context Resolution 的 required／optional reason，並符合 Context policy。
8. Rule Set 沒有衝突、狀態為 `resolved`，且重新計算的 fingerprint 與提供的 fingerprint 相同。
9. Develop 已解析出 Target；Module 範圍任務具有唯一 Module。Develop 與 Review 的
   architecture、database、migration、fullstack 與 cross-module 任務必須套用更嚴格的
   Context policy；Module Analysis 不要求既有 Context。

## 狀態規則

- `PASS`：所有檢查通過，`blockers=[]`、`warnings=[]`、`can_execute=true`。
- `PASS_WITH_WARNINGS`：沒有 blocker，只有政策允許的 warning，`can_execute=true`。
- `BLOCKED`：任何阻擋性檢查失敗，`can_execute=false`。

只有下列情況允許 warning：Target 未知但只使用 common checks 的 Review、沒有 Project Context 的 Project Analyst onboarding、缺少 optional Context、非 contract Context 已過期、刻意未載入的非必要 Skill，或缺少 optional output directory。

## 必須阻擋的情況

- Workflow Config 或 Project Config 缺少／無效、Workflow Root 與已載入 Bootstrap 不一致，或 Registry 無效。
- Action／Role 未知、明確 Role／Skill 不存在於 Registry，或明確 Role／Action 不相容。
- 明確或自動選取的 Skill 不屬於目前 Role，或 Skill dependency 指向其他角色 Skill。
- Role Planner entry 不符合 Role Registry、Role Plan 不是 `planned`，或仍有 unresolved。
- 缺少必要 Rule、Skill、Context、dependency、hash 或 fingerprint match。
- routing 必要的 Target／Module 存在歧義，包括候選分數差距低於政策門檻。
- Module 範圍的 Develop 或 Review 任務，其必要 Module Context 未綁定或不是 current。
- Context 屬於其他 Project、Context status 不受支援，或嚴格任務類型使用 stale Context。
- `Resolved Rule Set.status=incomplete`、仍有未解析必要項目、存在衝突，或 Resolution 後內容已變更。
- 在取得 PASS 類結果前要求修改程式碼或規則。

## Execution Contract

對 PASS 類結果，必須從已凍結 Rule Set 設定 `execution_contract.role_id`、`executor_entry`、`rule_set_fingerprint` 與 `allowed_action`。`executor_entry` 必須符合 `roles/<role-id>/entry.md` 的標準路徑。Preflight 不直接 dispatch；由 Dispatcher 將此 contract 交給 Executor Adapter。

若狀態為 `BLOCKED`，`execution_contract` 必須精確為 `null`；不得暴露任何可執行的角色入口或 fingerprint。

Role Entry 的輸入與責任邊界由 `orchestration/role-entry-contract.md` 定義。Preflight 必須驗證
該契約存在且可讀，但不得在此階段執行角色規則。
