# Review 角色入口

本文件是 Review 角色的唯一執行入口，由 Executor Adapter 呼叫。入口只接收已通過 Preflight
的固定輸入，不負責解析原始 Prompt、推導 reviewer mode、選擇 checks 或載入規則。

## 固定輸入

- `Task Manifest`：已解析的 Action、Role、Target、Scope 與 `review_mode`。
- `Task Risk Assessment`：已凍結的風險層級、理由與 hard triggers。
- `Execution Profile Contract`：已核准的 Profile、必要階段與升級契約。
- `Role Plan`：由 `roles/review/planner.md` 產生的固定流程、檢查 selectors 與輸出需求。
- `Resolved Rule Set`：已選 mode、checks、Context、載入順序、優先級與 fingerprint。
- `Preflight Result.execution_contract`：允許執行的 Role、Action、入口、Risk Level、Execution Profile 與 Rule Set fingerprint。

## 入口驗證

開始執行前，必須確認：

- `role_id=review`
- `allowed_action=review`
- Role Plan 的 `planner_entry=roles/review/planner.md`，且 Role、Action 與 Task Manifest 一致
- `review_mode` 為 `change` 或 `feature`
- Resolved Rule Set 已包含該 mode 的入口與必要 checks
- `Resolved Rule Set` 與 `execution_contract` 的入口及 fingerprint 一致
- Task Risk、Execution Profile 與 `execution_contract` 的層級及 Profile ID 一致

任一條件缺少或不一致時，回傳 `reroute-required`，交回 Dispatcher 處理。不得在本入口重新
判斷 mode、Target、Scope、Context、checks、風險或 Profile。

## 角色責任

Review 負責依核准 Scope 檢查變更品質、需求符合度與風險，不負責直接開發新功能、重構或替代
Developer 完成實作。

- `change`：檢查單一任務完成後、commit 前的 staged changes。
- `feature`：檢查整個頁面或模組完成後的完整功能狀態。

通過入口驗證後，只能依 `Resolved Rule Set.load_order` 使用已載入的 mode、checks、output 與
Context 規則。入口不得變更 reviewer mode、Target、規則載入順序或優先級。

## 執行結果

- `completed`：已完成 Review 並依 mode 規則產出判定與報告。
- `blocked`：角色規則內的停止條件成立，且不需要改變 routing。
- `reroute-required`：固定輸入不足、不一致、發現更高風險，或需要較高 Profile、不同 mode、checks、Scope、Target 或 Context。

報告內容與落檔位置依已載入的 mode report 規則及使用者明確要求決定。本入口不得建立新的
輸出政策。
