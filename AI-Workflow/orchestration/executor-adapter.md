# Executor Adapter 執行介接契約

## 責任

Executor Adapter 是通過 Preflight 的結果與標準 Role Entry 之間唯一的橋接層。它接收 Task Manifest、Task Risk Assessment、Execution Profile Contract、Role Plan、Resolved Rule Set 與 Preflight Result，不執行分析、推導、風險重判、Profile 重選、Preflight 修復或 routing。

所有角色入口必須遵守 `orchestration/role-entry-contract.md`，並固定使用
`roles/<role-id>/entry.md`。

## 准入檢查

只有下列條件全部成立時才允許執行：

- `preflight.can_execute=true`。
- Preflight status 為 `PASS` 或 `PASS_WITH_WARNINGS`。
- 所有產物中的 Task ID 與 Resolution ID 一致。
- Role Plan 的 Role、Action 與 Planner entry 符合 Role Registry。
- `preflight.execution_contract.role_id` 等於已凍結 Rule Set 的 Role。
- `preflight.execution_contract.executor_entry` 等於 Registry 的 Role entry。
- `preflight.execution_contract.risk_level` 等於已凍結 Task Risk 的 `level`，且不得低於已選 Profile 的 `risk_level`。
- `preflight.execution_contract.execution_profile` 等於已凍結 Execution Profile 的 `profile_id`。
- Task Risk 與 Execution Profile 都允許向上升級，且 Profile 狀態為 `selected`。
- `preflight.execution_contract.result_reporting` 等於 Role Plan 已驗證的 Result Reporting 契約。
- 提供的 Rule Set fingerprint 同時等於 Preflight fingerprint，以及使用已選檔案 hash 重新計算的結果。
- 每個已選 Rule 與 Context 仍可從記錄的路徑讀取。

准入前，Adapter 必須重新讀取每個已選 Rule 與 Context 的精確 bytes、重新計算每個 SHA-256 content hash，再由這些 hash 重新計算完整 fingerprint。任何 bytes、path-base canonicalization、hash 或 fingerprint 差異都必須拒絕執行。

任一檢查失敗時，回傳 `EXECUTION_REJECTED` 給 Dispatcher。不得重新載入、替換、推測或修復規則；Dispatcher 必須從適當的前置階段重新開始。

## Role Entry 交付

通過准入後，Adapter 必須：

- 只載入 `executor_entry`、Rule Set 已選規則與已選 Context 路徑。
- 保留 Rule Set 的 `load_order` 與 `precedence_rank`。
- 將 Task Manifest、Task Risk Assessment、Execution Profile Contract、Role Plan、Resolved Rule Set 與包含風險、Profile、Result Reporting 契約的
  `execution_contract` 作為唯讀輸入交給 Role Entry。
- 將 Role Entry 的 `completed`、`blocked` 或 `reroute-required` 原樣交回 Dispatcher。

README 一律是工程文件，不得作為 execution rule 載入。Role Entry 也不得替換已推導的 Role、
Skill、Target、Module、角色模式、Context 或規則路徑。

Role Entry 可以依已載入的 Result Reporting 政策，在角色工作完成後提高回覆層級，但不得低於
`execution_contract.result_reporting.minimum_level`，也不得因回覆層級調整而改變執行契約。

## Execute 邊界

准入後，Execute 只能在已凍結 Scope 與 Execution Profile 內執行 Preflight 核准的 Action（`develop`、`review` 或 `analyze`）。若執行時新發現更高風險、需要較高 Profile、其他規則、不同 Target、不同 Module 或不同 Context，原 contract 立即失效，Role Entry 必須回傳 `reroute-required`；Execute 本身不得降低風險、替換 Profile 或做出該決策。
