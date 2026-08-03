# Review PASS 與 FAIL 基準

## PASS

只有下列共同條件全部成立時，才能判定 PASS：

- Review Scope 與需求判定依據已確認。
- 沒有 blocking finding。
- 驗證狀態已確認，或未驗證風險已明確標記且不構成 blocker。
- mode pass conditions 的全部必要條件成立。

## FAIL

下列任一共同條件成立時，必須判定 FAIL：

- Scope 或需求過度模糊，無法安全判斷完成狀態。
- 存在必須修正的 blocking finding。
- 必要驗證缺失且風險高。
- mode pass conditions 的任一 FAIL 條件成立。

## Conditional PASS

Review 不使用 Conditional PASS。

若只有非 blocking 風險、未知事項或建議，判定 PASS，並在 report 中清楚標記。
