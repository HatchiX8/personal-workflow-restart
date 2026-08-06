# Dispatcher 編排契約

## 責任

Dispatcher 是 Workflow 的精簡協調器。正常路徑只載入 `task-manifest-authoring.md` 與
`runtime-dispatch.md`，將確定性的 Schema、Risk、Profile、Registry、Rule、Context 與 Preflight
推導交給同一支 Node Runtime。Dispatcher 不分類任務、不自行判定風險、不選規則，也不執行角色工作。

## 輸入與啟動

輸入為 Bootstrap 驗證後的 canonical Workflow Root、canonical Project Root、Workflow Config、
Project Config 與未修改的原始需求。依序：

1. 載入 `orchestration.task_manifest_authoring`，由 LLM 產生不可變 Task Manifest。
2. 載入 `orchestration.runtime_dispatch`，以 `operation=resolve-routing` 呼叫 `runtime.entry`。
3. Runtime 回傳 `status=resolved` 後，只讀取 `next.load_paths` 指定的 Role Planner，將相同 Task
   Manifest、Runtime 回傳的 Task Risk／Execution Profile 與已驗證 Project Config 交付 Planner，
   產生不可變 Role Plan。
4. 以相同 Task Manifest 與 Role Plan 呼叫 `operation=resolve-execution`。
5. Runtime 只有在 Preflight 通過且同一次呼叫的 Executor Adapter 准入檢查 accepted 後，才能回傳
   `status=ready`。Dispatcher 必須確認 `executor_verification.accepted=true`，接著只依序載入
   `load_paths`，將 `execution_contract` 交給 Role Entry；正常路徑不另載 `executor-adapter.md`。

Task Manifest、Task Risk、Execution Profile、Role Plan、Resolved Rule Set、Preflight 與 Execution
Contract 的 Task ID 必須一致。每一階段輸出都是下一階段不可變輸入；Runtime 產物預設只保留在記憶體。

正常路徑不得預先載入：

- 完整 Task Manifest Schema 或 Registry；
- `risk-assessment.md`、`execution-profile-resolution.md`；
- 任一 Profile、`rule-resolution.md`、`context-resolution.md`、`preflight.md`；
- 未出現在 Runtime `next.load_paths`／`load_paths` 的 Role、Skill 或 Rule。

`load_paths` 一律相對於 Workflow Root，且必須已由 Runtime canonicalize、驗證與排序。Agent 不得新增、
刪除、改序或用相似檔名替代。

## Runtime 狀態

- `resolve-routing` 成功必須是 exit `0`、`status=resolved`、`next.stage=role-planner`。
- `resolve-execution` 成功必須是 exit `0`、`status=ready`、`preflight.can_execute=true`。
- exit `2` 或合法 `status=blocked` 是 Workflow 決策；保留 diagnostics 並停止，不得進入 fallback。
- exit `64` 時只允許依 diagnostics 修正 LLM 產生的 request 一次，不得改寫使用者需求或降低條件。
- exit `70`、入口不存在、Node 版本不足、宿主無法執行或使用者拒絕精確入口時，視為 Runtime 不可用。

Runtime stdout 必須是單一合法 JSON；stderr 不參與 routing。協議版本、status、exit code 或 Task ID
不一致時 fail closed。

## Markdown fallback

Runtime 技術上不可用時，不得直接載入 fallback 契約。Dispatcher 必須先設定
`AWAITING_FALLBACK_CONSENT`，向目前使用者說明不可用原因，以及 Markdown fallback 會增加 LLM Token
消耗，並詢問是否允許本次需求改用 fallback。

只有目前對話中的使用者在這次詢問之後明確同意，才可載入既有完整契約並執行：Task Analysis →
Risk Assessment → Execution Profile Resolution → selected Profile → Role Planner → Rule Resolution（內含
Context Resolution）→ Preflight → Executor Adapter。過往同意、預設設定、Workflow Config、宿主
白名單、Agent、子代理或其他自動化回覆都不能代替使用者同意，也不得預先假設同意。使用者拒絕或
沒有明確回覆時，以 `RUNTIME_UNAVAILABLE` 停止，不得載入完整 Registry、Schema 或 fallback 契約。

Fallback 的權威來源、stage 順序、安全核心與阻擋條件不得弱化，且最終回覆必須標示
`routing_mode=markdown-fallback`、不可用原因與本次使用者同意的 provenance。

若 Runtime 已成功啟動並因 Manifest、Risk、Profile、Registry、Rule、Context、hash 或 Preflight
回傳 blocker，禁止以 fallback 重新解算。

## 執行中重新分流

Role Entry 回傳 `reroute-required` 時，原 Execution Contract、Rule Set 與 fingerprint 立即失效。將新
fact、evidence 與 reroute reason 合併成新的 Task Manifest，再從 `resolve-routing` 重新開始。風險與
Profile 只能維持或向上升級：

```text
lightweight -> standard -> full
```

同層級也必須完整重建所有 Runtime 產物與 Preflight；禁止沿用舊 `load_paths` 或 fingerprint。新的
Risk／Profile 低於既有核准值，或新結果仍不足以安全涵蓋範圍時，以 `PROFILE_BLOCKED` 停止。

## 終止狀態

- `ANALYSIS_BLOCKED`：Task Manifest 無法形成安全的 Runtime 輸入。
- `AWAITING_FALLBACK_CONSENT`：Runtime 技術上不可用，等待目前使用者決定是否承擔額外 Token 成本。
- `RUNTIME_UNAVAILABLE`：Runtime 技術上不可用，且使用者拒絕或未明確同意 Markdown fallback。
- `RISK_BLOCKED`／`PROFILE_BLOCKED`：Runtime 或 fallback 的風險／Profile 判定阻擋。
- `PLANNING_BLOCKED`：Role Planner 無法產生安全 Role Plan。
- `RESOLUTION_INCOMPLETE`：Rule／Context Resolution 不完整。
- `PREFLIGHT_BLOCKED`：Preflight 不允許執行。
- `READY_FOR_EXECUTION`：Runtime `status=ready` 且 `can_execute=true`。
- `EXECUTION_REJECTED`：Executor Adapter 拒絕無效或已變更的 contract。

阻擋時必須回傳 diagnostics 與原因，不得轉換成預設 Developer 任務。

## 禁止事項

- 以 README、完整 Registry 或未命中規則自行做 routing。
- 自行覆寫 Task Risk、Profile、Resolved Rule Set、load order、hash 或 fingerprint。
- 為了省 Token、時間或避免授權而降低 Profile 或跳過 Runtime blocker。
- 代替 Role Planner 推導 Role-specific repository facts。
- 在 `can_execute=true` 前開始 Develop、Review 或 Analyze。
