# 任務結果回報政策

## 適用範圍

本政策消費已凍結的共用 Task Risk，且只控制 Agent 完成角色工作後，在對話中提供的任務結果回覆。Review report、Project Context、
Module Context 或使用者指定的正式文件，仍須完整遵守角色 output／report 規則，不得因回覆層級而
刪減必要內容。

本政策不得建立、降低或覆寫 `Task Risk.level` 與已選 Execution Profile。要求較詳細的完成回覆只
能提高 Result Reporting 層級，不得提高 Execution Risk；反之，任何回覆判定也不得降低已核准的
Execution Profile。

角色規則要求的必要語意優先於共用格式。例如 Review 必須保留 PASS／FAIL 與 blocking findings，
Analyst 必須回報正式產物狀態與實際路徑；這些資訊應合併到對應層級的區塊，不另建空泛段落。

## 結構化契約

Role Planner 必須以不可變 Task Risk 作為基線，產生：

```json
{
  "result_reporting": {
    "minimum_level": 2,
    "reasons": ["task-risk-level:2"],
    "upward_escalation": true
  }
}
```

- `minimum_level` 是執行前可使用的最低層級，只能是 `1`、`2` 或 `3`。
- `reasons` 必須記錄一個以上可追溯的判定原因，不得只寫主觀描述。
- `upward_escalation` 必須固定為 `true`。
- `minimum_level` 不得低於 `Task Risk.level`；`reasons` 必須包含 Task Risk level 或對應 risk fact 的可追溯理由。
- Preflight 必須驗證此契約，並原樣凍結到 `execution_contract.result_reporting`。

## 執行前判定

先以 `Task Risk.level` 作為 `minimum_level` 基線。Result Reporting 不得重新執行 Task Risk
分類，也不得因輸出偏好改寫共用 Task Risk facts。使用者要求完整報告、詳細設計說明或風險評估
時，只把 `minimum_level` 向上提高到 Level 3；沒有此類輸出要求時保持 Task Risk 基線。資訊不足
造成的風險層級由 Risk Assessment 處理，本政策不得自行降為 Level 1。

### Level 1：低風險任務

Task Risk 為 Level 1，且沒有輸出專屬升級條件時使用。Level 1 的任務類型與必要條件完全以共用
Task Risk 政策及已凍結 Task Risk 為準，本政策不得另建一套風險條件。

使用者要求完整報告或詳細設計說明時，任務風險仍維持 Level 1，但 Result Reporting 提高為
Level 3。

### Level 2：一般任務

Task Risk 為 Level 2，且沒有輸出專屬 Level 3 升級條件時使用。

Level 2 的任務類型、資訊不足政策與必要條件完全以共用 Task Risk 政策及已凍結 Task Risk 為準。
本政策不得重新解讀 Scope、Target、Task Type 或 risk facts。

### Level 3：高風險任務

Task Risk 為 Level 3 時必須使用 Level 3。Level 3 hard trigger 與風險事實完全以共用 Task Risk
政策及已凍結 Task Risk 為準，本政策不得重算、增刪或降級。

此外，使用者明確要求完整報告、設計決策或風險評估時，只將 Result Reporting 提高至 Level 3；
此輸出專屬條件不得加入 Task Risk hard trigger，也不得觸發較高 Execution Profile。

## 執行後升級

Execute 不得降低 `minimum_level`，也不得藉由回覆層級變更降低或替換 Execution Profile。發生下列任一情況時，必須提高到 Level 3：

- 關鍵驗證失敗，或高風險路徑無法驗證。
- 發現原契約內可處理但影響重大的資料、權限、安全、契約或回滾風險。
- Review 產生 blocker 或 high finding。
- 任務只完成部分內容，且剩餘事項可能影響正確性或上線安全。

一般非關鍵驗證未執行、可接受限制或 warning，至少提高到 Level 2。執行後升級只改變完成回覆詳細度，
不得藉此改變 Role、Skill、Scope、Target、Module、Context 或 Rule Set；需要改變這些契約時仍須
回傳 `reroute-required`，並由 Dispatcher 依只允許向上的風險與 Profile 重新分流政策處理。

## 回覆格式

### Level 1

僅回報：

- 完成內容
- 驗證結果

### Level 2

回報：

- 完成內容
- 修改範圍
- 驗證結果
- 已知限制（如有）

### Level 3

回報：

- 任務摘要
- 修改檔案與模組
- 關鍵設計決策
- 驗證與測試
- 風險、限制與後續事項

沒有風險、限制、後續事項或角色必要內容時，必須省略對應區塊，不得產生「無」、「沒有」或
其他空泛段落。不得為符合格式重複相同資訊。
