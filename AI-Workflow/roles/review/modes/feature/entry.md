# Feature Review Mode Entry

本文件是 Review 角色 `review_mode=feature` 的執行入口，只能由
`roles/review/entry.md` 在固定輸入驗證通過後使用。

## 必要輸入

- `role_id=review`
- `allowed_action=review`
- `review_mode=feature`
- Task Manifest 已固定完整功能需求與 Review Scope
- Resolved Rule Set 已包含本 mode 與本次 Target 所需 checks

輸入缺少或不一致時回傳 `reroute-required`，不得改用 Change Review、補載 checks 或自行縮放
Scope。

## 執行責任

Feature Review 用於檢查整個頁面或模組功能完成後的完整功能狀態，主要依據為完整功能需求與
目前程式碼。

Feature Review 不限定 commit 或最近 diff，應檢查核准 Scope 內的完整使用情境與功能狀態。

執行時依 Resolved Rule Set 已載入的 workflow、restrictions、report、pass conditions 與
checks 進行，不得在本入口建立第二套規則載入流程。
