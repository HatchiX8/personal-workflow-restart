# Dispatcher 編排契約

## 責任

Dispatcher 是 Workflow 的編排協調器，負責階段順序、風險與執行 Profile 產物交接、分流及終止狀態。Dispatcher 不負責分類任務、判定風險、選擇執行 Profile、選擇規則、驗證規則路徑，也不執行角色任務。

## 輸入

- Bootstrap 解析完成的 Workflow Root 與 `workflow.config.json`。
- Bootstrap 已驗證且凍結的 Project Config。
- 使用者的原始需求。

若無法讀取 Workflow Config、已設定的 Registry、Risk Assessment、Execution Profile Resolution、三個 Execution Profile 或其他已設定的編排契約，Dispatcher 必須以 `BLOCKED` 停止，不得推測替代路徑。

## 必要順序

1. 使用原始需求與不可變的 Config／Registry snapshot 呼叫 `task-analysis.md`。
2. Task Manifest 必須為 `status=analyzed`；以該不可變 Manifest 呼叫
   `workflow.config.json` 設定的 `orchestration.risk_assessment`，產生通過 Schema 的 Task Risk。
3. Task Risk 必須為 `status=assessed`；`status=needs-resolution` 時以 `RISK_BLOCKED` 停止。以相同 Task Manifest 與不可變 Task Risk 呼叫
   `orchestration.execution_profile_resolution`，產生 Execution Profile Selection。
4. Selection 必須為 `status=selected`。Dispatcher 只能呼叫
   `workflow.config.json.execution_profiles.<profile_id>` 指定的 `lightweight`、`standard` 或 `full`
   Profile，並依 Selection 的 `required_stages` 與該 Profile 契約執行；不得自行增刪或重排階段。
5. 每個 Profile 只有在其 Preflight 回傳 `can_execute=true` 時，才能呼叫 `executor-adapter.md`。

`full` Profile 必須與導入風險分流前的完整流程等價，且在 Profile 內保持下列既有順序：

1. 依 Task Manifest 的 Role 呼叫 `roles/<role-id>/planner.md`，將不可變 Task Risk 與 Profile
   Selection 一併交付，並套用 `workflow.config.json` 設定的 `orchestration.result_reporting`，產生 Role Plan。
2. 使用 Task Manifest、Role Plan 與相同 snapshot 呼叫 `rule-resolution.md`。
3. 使用 Task Manifest、Role Plan、Resolved Rule Set 與 snapshot 呼叫 `preflight.md`。
4. 只有 Preflight 回傳 `can_execute=true` 時，才能呼叫 `executor-adapter.md`。

`lightweight` 與 `standard` 必須各自遵守已設定的 Profile 契約，不得因省略階段而省略該 Profile
宣告的安全核心、Rule／Skill 相容性檢查、最低驗證或 Preflight。Profile 契約不得允許尚未支援的
Action 或 Role 靜默進入較輕流程；這類情況必須阻擋或依 Task Risk 選擇較高 Profile。

每個階段的輸出都是下一階段的不可變輸入。Dispatcher 必須在可取得時記錄 Task ID、Task Risk
level、Profile ID、Resolution ID 與 Rule Set fingerprint。Task Manifest、Task Risk、Execution
Profile Selection、Role Plan、Resolved Rule Set 與 Preflight Result 的 Task ID 必須一致。除非後續
階段明確導入持久化交接儲存，runtime 產物只保留在記憶體中。

Context Resolution 是由 Rule Resolution 呼叫的內部契約。Dispatcher 不新增獨立階段，也不進行 Context 決策。

## 執行中升級與重新分流

Role Entry 回傳 `reroute-required` 時，Dispatcher 必須使原 Execution Contract 立即失效，並保留
Role Entry 回傳的新事實、evidence 與 reroute reason。Dispatcher 不得自行判定新風險或直接改選
Profile；必須從受新事實影響的最早前置階段重新產生不可變產物，且至少重新執行 Risk Assessment
與 Execution Profile Resolution。

重新分流禁止降低既有風險或 Profile。新證據確實提高 Task Risk 時，只允許下列向上升級：

```text
lightweight -> standard
lightweight -> full
standard -> full
```

若新證據只改變 Scope、Target、Module、Context 或所需 Rule，而 Risk Assessment 仍確認為相同
level，可以重新選擇相同 Profile；這是同層級 contract 重建，不是風險降級。`full` 也可以在
Level 3 重新產生完整 contract。無論同層重建或向上升級，都必須重新執行該 Profile 的所有必要
階段與 Preflight，不得沿用舊 Rule Set、fingerprint 或 Execution Contract。

新的 `risk_level` 或 Profile rank 低於先前已核准值、Execution Profile Resolution 回傳 blocked，
或重新分流仍不足以安全涵蓋新發現範圍時，必須以 `PROFILE_BLOCKED` 停止。

## 終止狀態

- `ANALYSIS_BLOCKED`：Task Analysis 無法產生安全的 routing 輸入。
- `RISK_BLOCKED`：Risk Assessment 無法從已確認事實產生可安全分流的 Task Risk。
- `PROFILE_BLOCKED`：Execution Profile Resolution 回傳 blocked、Profile 契約不可用，或執行中重新分流嘗試降低既有風險／Profile 或仍無法安全涵蓋新範圍。
- `PLANNING_BLOCKED`：Role Planner 無法產生安全的 Skill selectors 或必要 facts。
- `RESOLUTION_INCOMPLETE`：Rule Resolution 仍有未解析的必要輸入。
- `PREFLIGHT_BLOCKED`：Preflight 回傳 `BLOCKED`。
- `READY_FOR_EXECUTION`：Preflight 回傳 `PASS` 或 `PASS_WITH_WARNINGS`，且 `can_execute=true`。
- `EXECUTION_REJECTED`：Executor Adapter 拒絕無效或已變更的 execution contract。

Dispatcher 必須回傳造成阻擋的產物與原因，不得將被阻擋的結果轉換成預設 Developer 任務。

## 禁止事項

- 讀取 `roles/**` 或 README 來做 routing 決策。
- 選擇 Role、Skill、Target、Module 或 Review mode。
- 自行判定或覆寫 Task Risk，或自行選擇／降級 Execution Profile。
- 代替 Role Planner 推導 Role-specific facts。
- 在共用 Result Reporting 政策之外重算或覆寫 Result Reporting 最低層級。
- 重新排序已選取的規則。
- 為了做業務決策而讀取 project 或 application 程式碼。
- 開始 Develop、Review 或 Analyze 工作。
