# Change Review Mode Entry

本文件是 Review 角色 `review_mode=change` 的執行入口，只能由
`roles/review/entry.md` 在固定輸入驗證通過後使用。

## 必要輸入

- `role_id=review`
- `allowed_action=review`
- `review_mode=change`
- `scope.change_source=staged`
- Resolved Rule Set 已包含本 mode 與本次 Target 所需 checks

輸入缺少或不一致時回傳 `reroute-required`，不得改用 Feature Review、補載 checks 或擴大 Scope。

## 執行責任

Change Review 用於檢查單一任務完成後、commit 前的 staged changes，主要依據為
`git diff --cached` 與該任務需求。

只檢查本次 staged changes 是否符合任務需求。除非 staged diff 顯示問題與既有程式碼直接
相關，否則不得擴大成完整模組 Review。

執行時依 Resolved Rule Set 已載入的 workflow、restrictions、report、pass conditions 與
checks 進行，不得在本入口建立第二套規則載入流程。
