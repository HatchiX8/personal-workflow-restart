# Review PASS 與 FAIL 基準

## PASS

只有下列共同條件全部成立時，才能判定 PASS：

- Review Scope 與需求判定依據已確認。
- Review mode 已確認為 `change` 或 `feature`。
- 沒有 blocking finding。
- 驗證狀態已確認，或未驗證風險已明確標記且不構成 blocker。

## FAIL

下列任一共同條件成立時，必須判定 FAIL：

- Scope 或需求過度模糊，無法安全判斷完成狀態。
- 無法確認 Review mode，且不同模式會產生明顯不同的檢查範圍。
- 存在必須修正的 blocking finding。
- 必要驗證缺失且風險高。

## Conditional PASS

Review 不使用 Conditional PASS。

若只有非 blocking 風險、未知事項或建議，判定 PASS，並在 report 中清楚標記。
