# 任務結果回報政策

## 適用範圍

本政策只控制 Agent 完成角色工作後，在對話中提供的任務結果回覆。Review report、Project Context、
Module Context 或使用者指定的正式文件，仍須完整遵守角色 output／report 規則，不得因回覆層級而
刪減必要內容。

角色規則要求的必要語意優先於共用格式。例如 Review 必須保留 PASS／FAIL 與 blocking findings，
Analyst 必須回報正式產物狀態與實際路徑；這些資訊應合併到對應層級的區塊，不另建空泛段落。

## 結構化契約

Role Planner 必須產生：

```json
{
  "result_reporting": {
    "minimum_level": 2,
    "reasons": ["default-general-task"],
    "upward_escalation": true
  }
}
```

- `minimum_level` 是執行前可使用的最低層級，只能是 `1`、`2` 或 `3`。
- `reasons` 必須記錄一個以上可追溯的判定原因，不得只寫主觀描述。
- `upward_escalation` 必須固定為 `true`。
- Preflight 必須驗證此契約，並原樣凍結到 `execution_contract.result_reporting`。

## 執行前判定

先判斷 Level 3；不符合 Level 3 時，只有符合 Level 1 全部條件才使用 Level 1；其餘一律使用
Level 2。資訊不足時不得猜測為 Level 1。

### Level 1：微小修改

必須同時符合：

- Scope 已高信心確認為單一檔案或等價的極小範圍。
- 只有單一 Target，且不是 Full Stack 或 mixed target。
- Task Type 為 change、bugfix 或 maintenance。
- 沒有 Level 3 風險事實。
- 任務描述未要求完整報告或詳細設計說明。

### Level 2：一般任務

下列情況使用 Level 2：

- 一般 Feature、Change、Bugfix、Refactor、Review 或限定範圍分析。
- Scope、風險或證據不足以安全判定 Level 1，但尚未符合 Level 3。
- 有非關鍵限制、警告或未驗證項目，需要在完成回覆中說明。

### Level 3：高風險任務

任一條件成立即使用 Level 3：

- Scope 為 cross-module 或 full-project。
- Target mode 為 fullstack 或 mixed。
- Task Type 為 migration。
- 已確認 architecture、database schema／data migration、public API contract、authentication、
  authorization、security、payment／monetary flow、destructive operation、file-delete 或 rollback 風險。
- 使用者明確要求完整報告、設計決策或風險評估。

## 執行後升級

Execute 不得降低 `minimum_level`。發生下列任一情況時，必須提高到 Level 3：

- 關鍵驗證失敗，或高風險路徑無法驗證。
- 發現原契約內可處理但影響重大的資料、權限、安全、契約或回滾風險。
- Review 產生 blocker 或 high finding。
- 任務只完成部分內容，且剩餘事項可能影響正確性或上線安全。

一般非關鍵驗證未執行、可接受限制或 warning，至少提高到 Level 2。升級只改變完成回覆詳細度，
不得藉此改變 Role、Skill、Scope、Target、Module、Context 或 Rule Set；需要改變這些契約時仍須
回傳 `reroute-required`。

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
