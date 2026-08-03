# Change Review Workflow

本 mode 依 `roles/review/workflow.md` 執行，並提供下列階段差異。

## Confirm Scope

- 確認本次單一任務需求、完成條件與指定風險。
- 任務需求不存在或過度模糊時，無法完整判定 PASS。

## Collect Evidence

- 以 `git diff --cached` 作為主要來源。
- staged diff 為空時，不得判定 PASS。
- 只讀取理解 staged changes 直接風險所需的鄰近檔案。

## Apply Checks

- 檢查 staged changes 是否直接對應需求、遺漏必要行為、引入無關變更或改變未要求的 public
  behavior。

## Validate

- 確認 lint、typecheck、build、test 或手動驗證狀態。
- 未執行驗證不必自動 FAIL，但必須標記驗證缺口。
