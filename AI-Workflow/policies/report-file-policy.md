# 報告檔案共用政策

## 編碼與語言

- Markdown report 必須使用 UTF-8 編碼。
- 內容必須以中文呈現。
- 程式碼識別字、路徑、指令、API 欄位與錯誤訊息可以保留原文。

## 輸出位置

- 使用者指定輸出位置時，必須寫入指定位置。
- 使用者明確表示不用落檔、只在對話中回報時，才可不建立 report 檔案。
- 未指定位置時，使用角色 output／report 規則定義的預設位置。
- 角色規則中的預設輸出路徑一律相對於已驗證的 Project Root 解析，不得相對於 Workflow Root，
  也不得把專案產物寫入集中式 `AI-Workflow/`。
- Review、Module Context 與 Project Analysis 的預設根目錄統一為
  `<PROJECT_ROOT>/agent-workspaces/`，再依產物類型分流。
- 需要的輸出資料夾不存在時，可以建立必要資料夾。

## 檔名

- timestamp 使用本地時間 `YYYYMMDD-HHmm`。
- slug 必須短、可讀，只使用小寫英文、數字與 hyphen。
- 無法安全產生 slug 時，使用角色 report 規則定義的 fallback。

## 回報

完成時必須回報實際 report 路徑。未產生檔案時，必須明確說明原因。
