# Dispatcher 編排契約

## 責任

Dispatcher 是 Workflow 的編排協調器，負責階段順序、產物交接與終止狀態。Dispatcher 不負責分類任務、選擇規則、驗證規則路徑，也不執行角色任務。

## 輸入

- Bootstrap 解析完成的 Workflow Root 與 `workflow.config.json`。
- Bootstrap 已驗證且凍結的 Project Config。
- 使用者的原始需求。

若無法讀取 Workflow Config、已設定的 Registry 或已設定的編排契約，Dispatcher 必須以 `BLOCKED` 停止，不得推測替代路徑。

## 必要順序

1. 使用原始需求與不可變的 Config／Registry snapshot 呼叫 `task-analysis.md`。
2. 依 Task Manifest 的 Role 呼叫 `roles/<role-id>/planner.md`，並套用
   `workflow.config.json` 設定的 `orchestration.result_reporting`，產生 Role Plan。
3. 使用 Task Manifest、Role Plan 與相同 snapshot 呼叫 `rule-resolution.md`。
4. 使用 Task Manifest、Role Plan、Resolved Rule Set 與 snapshot 呼叫 `preflight.md`。
5. 只有 Preflight 回傳 `can_execute=true` 時，才能呼叫 `executor-adapter.md`。

每個階段的輸出都是下一階段的不可變輸入。Dispatcher 必須在可取得時記錄 Task ID、Resolution ID 與 Rule Set fingerprint。除非後續階段明確導入持久化交接儲存，runtime 產物只保留在記憶體中。

Context Resolution 是由 Rule Resolution 呼叫的內部契約。Dispatcher 不新增獨立階段，也不進行 Context 決策。

## 終止狀態

- `ANALYSIS_BLOCKED`：Task Analysis 無法產生安全的 routing 輸入。
- `PLANNING_BLOCKED`：Role Planner 無法產生安全的 Skill selectors 或必要 facts。
- `RESOLUTION_INCOMPLETE`：Rule Resolution 仍有未解析的必要輸入。
- `PREFLIGHT_BLOCKED`：Preflight 回傳 `BLOCKED`。
- `READY_FOR_EXECUTION`：Preflight 回傳 `PASS` 或 `PASS_WITH_WARNINGS`，且 `can_execute=true`。
- `EXECUTION_REJECTED`：Executor Adapter 拒絕無效或已變更的 execution contract。

Dispatcher 必須回傳造成阻擋的產物與原因，不得將被阻擋的結果轉換成預設 Developer 任務。

## 禁止事項

- 讀取 `roles/**` 或 README 來做 routing 決策。
- 選擇 Role、Skill、Target、Module 或 Review mode。
- 代替 Role Planner 推導 Role-specific facts。
- 在 Role Planner 之外重算或覆寫 Result Reporting 最低層級。
- 重新排序已選取的規則。
- 為了做業務決策而讀取 project 或 application 程式碼。
- 開始 Develop、Review 或 Analyze 工作。
