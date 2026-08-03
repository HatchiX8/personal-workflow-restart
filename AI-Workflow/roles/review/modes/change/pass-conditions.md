# Change Review PASS 與 FAIL 條件

本 mode 同時遵守 `roles/review/pass-conditions.md`。

## PASS 必要條件

- `git diff --cached` 不為空。
- staged changes 與本次任務需求相符。
- 沒有明顯無關 staged changes。
- 沒有破壞既有 public behavior 或 contract。

## FAIL 條件

- 沒有 staged changes 可檢查。
- 任務需求不明，無法判斷 staged changes 是否完成任務。
- staged changes 未滿足必要需求。
- staged changes 引入明確 bug 或 regression。
- staged changes 包含高風險無關變更。

若只有非 blocking 風險或建議，判定 PASS 並在 report 標記。
