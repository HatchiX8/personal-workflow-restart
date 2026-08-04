# Developer 輸出規則

## 正式執行結果

Developer 必須保留足以產生完成回覆的下列執行結果：

- 修改了哪些檔案。
- 完成了哪些需求。
- 已執行的驗證與結果。
- 無法執行的驗證、原因與建議指令。
- 是否有未完成事項。
- 是否有需要人工確認的風險。

## 對話完成回覆

完成回覆依 `policies/result-reporting.md` 與
`execution_contract.result_reporting.minimum_level` 選擇 Level 1～3。Level 1 不需要另外列出修改
檔案；Level 2 與 Level 3 才依共用政策展開修改範圍或檔案與模組。

若驗證失敗、關鍵驗證無法執行、只完成部分需求，或發現重大契約／資料／權限風險，必須依
共用政策向上提升層級。沒有風險、限制或未完成事項時，不得建立空泛區塊。
