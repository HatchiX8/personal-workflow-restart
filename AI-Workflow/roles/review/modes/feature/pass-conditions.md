# Feature Review PASS 與 FAIL 條件

本 mode 同時遵守 `roles/review/pass-conditions.md`。

## PASS 必要條件

- 完整功能需求已確認。
- Review Scope 已明確界定。
- 主要使用者流程可由現有程式碼支持。
- 功能需求有對應實作覆蓋。
- 跨檔案 contract 沒有明確不一致。
- loading、empty、error、success 等必要狀態已處理，或未處理部分不影響完成判定。

## FAIL 條件

- 完整功能需求不存在或過度模糊，無法判斷完成狀態。
- Review Scope 無法界定。
- 主要使用者流程無法完成。
- 需求有明確遺漏。
- 跨檔案 contract 不一致，會造成 runtime、build 或功能錯誤。
- 重要邊界情境缺失，會造成使用者流程失敗。

若只有非 blocking 風險、未知事項或建議，判定 PASS 並在 report 標記。
