# Change Reviewer PASS Conditions

本文件定義 Change Reviewer 的 PASS 條件。

## PASS

Change Reviewer 只有在以下條件全部成立時，才能判定 PASS：

- `git diff --cached` 不為空
- staged changes 與本次任務需求相符
- 沒有 blocking finding
- 沒有明顯無關 staged changes
- 沒有破壞既有 public behavior 或 contract
- 驗證狀態已確認，或未驗證風險已明確標記且不構成 blocker

## FAIL

只要符合以下任一條件，必須判定 FAIL：

- 沒有 staged changes 可檢查
- 任務需求不明，導致無法判斷 staged changes 是否完成任務
- staged changes 未滿足任務必要需求
- staged changes 引入明確 bug 或 regression
- staged changes 包含高風險無關變更
- 必要驗證缺失且變更風險高

## Conditional PASS

Change Reviewer 不使用 Conditional PASS。

若有必須修正的問題，判定 FAIL。

若只有非 blocking 風險或建議，判定 PASS，並在 report 中清楚標記。
