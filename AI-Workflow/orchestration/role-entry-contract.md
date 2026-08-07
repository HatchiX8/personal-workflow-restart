# Role Entry 統一介面契約

## 目的

Role Entry 是 Executor Adapter 進入角色規則的唯一入口。所有角色入口固定使用
`roles/<role-id>/entry.md`，只接收已通過 Preflight 的執行資料，不負責分析任務或選擇規則。

## 輸入

Executor Adapter 必須向 Role Entry 提供下列唯讀輸入：

- `Task Manifest`：已解析的 Action、Role、Target、Module、Scope、Skill 與角色模式。
- `Task Risk Assessment`：已凍結的風險層級、理由、hard triggers 與升級契約。
- `Execution Profile Contract`：已選 Profile、必要／略過階段與升級契約。
- `Role Plan`：由該角色 Planner 產生的固定流程、Skill selectors、必要能力與輸出需求。
- `Resolved Rule Set`：已選規則、Context、載入順序、優先級與 fingerprint。
- `Preflight Result.execution_contract`：允許執行的 Role、Action、入口、Risk Level、Execution Profile、Rule Set fingerprint 與
  Result Reporting 最低層級。

Role Entry 只能使用 `Resolved Rule Set` 已列出的規則與 Context。未列出的檔案即使存在，也不得在
Execute 階段自行載入。

## 入口責任

每個 `entry.md` 只負責：

1. 驗證 `role_id`、`allowed_action` 與自身宣告相符。
2. 驗證 Role Plan 的 Role、Action 與 Planner entry 符合 Role Registry。
3. 驗證角色必要欄位已由 Task Manifest 與 Role Plan 固定。
4. 驗證 Task Risk、Execution Profile 與 `execution_contract` 的層級及 Profile ID 一致。
5. 依 `Resolved Rule Set.load_order` 使用已載入規則。
6. 在 Task Manifest 的 Scope 與 Execution Profile 內依 Role Plan 執行角色工作。
7. 依輸出契約與已載入的 Result Reporting 政策回傳執行結果。

## 禁止事項

Role Entry 不得：

- 重新解析原始 Prompt。
- 重新執行 Role Planner，或修改 Role Plan 的流程、selector、能力需求與輸出需求。
- 推導或變更 Role、Action、Task Type、Target、Module、Skill、review mode 或 analysis mode。
- 為修復 routing 而掃描目錄、猜測檔名，或自行補載規則與 Context。Module Analyst 依已凍結的唯一
  模組搜尋種子，在 Project Root 內進行角色規則明確允許的只讀 repository discovery 不在此限；
  discovery 不得改變 Role、Action、Module 身分或 Rule Set。
- 改變 Rule Set 的載入順序、優先級、required／optional 狀態或 fingerprint。
- 降低 Task Risk、替換 Execution Profile，或自行略過該 Profile 的必要階段。
- 將完成回覆降低到 `execution_contract.result_reporting.minimum_level` 以下。
- 修復 Task Analysis、Rule Resolution 或 Preflight 的缺漏。
- 使用角色內 README 作為執行規則；README 一律只作為工程文件。

## 角色必要欄位

- `developer`：`action=develop|analyze`，至少一個 Target；`analyze` 僅允許唯讀檢查與對話回覆，
  `develop` 才允許修改。需要 Skill 時由 `skill_ids` 提供。
- `review`：`action=review`，`review_mode` 必須為 `change` 或 `feature`。
- `project-analyst`：`action=analyze`，`analysis_mode=project`。
- `module-analyst`：只有原始需求含精確獨立行 `角色：module-analyst` 才能啟動；其
  `action=analyze`、`analysis_mode=module`，且具有唯一 Module 搜尋種子；Target 可以
  已確認或留空進行 target-neutral discovery。既有 Module Context 與其路徑不是必要欄位。

入口若發現必要欄位缺少、輸入不一致、更高風險，或工作需要較高 Execution Profile、未載入規則、不同 Scope、Target、Module 或 Context，必須停止執行並回傳 `reroute-required`，不得在角色內重新推導。

## 輸出

Role Entry 必須回傳下列其中一種狀態：

- `completed`：已在核准 Scope 內完成工作。
- `blocked`：角色規則內的停止條件成立，且不需要改變 routing。
- `reroute-required`：凍結輸入不足或不一致，必須交回 Dispatcher 從適當階段重新執行。

正式產物內容與落檔位置仍由已載入的角色 output／report 規則及使用者明確要求決定。對話中的
任務完成回覆必須遵守已載入的 Result Reporting 政策；Role Entry 只能依執行結果向上提升層級，
不得在 Execute 階段自行建立新的輸出政策。
