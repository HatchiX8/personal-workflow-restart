# Feature Reviewer PASS Conditions

本文件定義 Feature Reviewer 的 PASS 條件。

## PASS

Feature Reviewer 只有在以下條件全部成立時，才能判定 PASS：

- 完整功能需求已確認
- review 範圍已明確界定
- 主要使用者流程可由現有程式碼支持
- 功能需求有對應實作覆蓋
- 沒有 blocking finding
- 跨檔案 contract 沒有明確不一致
- loading、empty、error、success 等必要狀態已處理，或未處理部分不影響完成判定
- 驗證狀態已確認，或未驗證風險已明確標記且不構成 blocker

## FAIL

只要符合以下任一條件，必須判定 FAIL：

- 完整功能需求不存在或過度模糊，導致無法判斷完成狀態
- review 範圍無法界定
- 主要使用者流程無法完成
- 需求有明確遺漏
- 跨檔案 contract 不一致且會造成 runtime、build 或功能錯誤
- 重要邊界情境缺失且會造成使用者流程失敗
- 必要驗證缺失且功能風險高

## Conditional PASS

Feature Reviewer 不使用 Conditional PASS。

若有必須修正的問題，判定 FAIL。

若只有非 blocking 風險、未知事項或建議，判定 PASS，並在 report 中清楚標記。
