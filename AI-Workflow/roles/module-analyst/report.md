# Module Analyst Report Output

本文件定義 Module Analyst 的 module context 報告輸出位置、檔名規則與報告落檔要求。

## Output File

Module Analyst 預設必須產出 markdown module context report。

report 必須使用 UTF-8 編碼。

report 內容必須以中文呈現。

程式碼識別字、檔案路徑、指令、API 欄位名稱、資料表名稱、錯誤訊息與 contract 欄位可保留原文。

若使用者指定輸出位置，必須寫入指定位置。

若使用者未指定輸出位置，依任務類型寫入：

```txt
AI-Workflow/module-context/frontend/<YYYYMMDD-HHmm>-<module-slug>.md
AI-Workflow/module-context/backend/<YYYYMMDD-HHmm>-<module-slug>.md
AI-Workflow/module-context/fullstack/<YYYYMMDD-HHmm>-<module-slug>.md
AI-Workflow/module-context/unknown/<YYYYMMDD-HHmm>-<module-slug>.md
```

任務類型對應：

- 前端任務：`AI-Workflow/module-context/frontend/`
- 後端任務：`AI-Workflow/module-context/backend/`
- 同時涉及前端與後端：`AI-Workflow/module-context/fullstack/`
- 任務類型無法判斷：`AI-Workflow/module-context/unknown/`

若使用者明確表示不用落檔、只要在對話中回報，才可不寫入 report 檔案。

## File Name Rules

檔名規則：

- timestamp 使用本地時間 `YYYYMMDD-HHmm`
- module slug 由模組名稱、主要路徑、頁面名稱、API 名稱或 service 名稱產生
- slug 需短、可讀、使用小寫英文、數字與 hyphen
- 若無法安全產生 slug，使用 `module-context`

範例：

```txt
AI-Workflow/module-context/frontend/20260728-1330-member-profile.md
AI-Workflow/module-context/backend/20260728-1330-order-api.md
AI-Workflow/module-context/fullstack/20260728-1330-checkout-flow.md
```

若輸出資料夾不存在，Module Analyst 可建立必要資料夾。

## Existing Report Rules

若指定輸出位置已存在：

- 若任務明確要求更新既有 module context，可直接更新
- 若任務未明確要求覆蓋，應先詢問使用者
- 若要保留歷史脈絡，應建立新的 timestamp report，不覆蓋既有檔案

## Report Template

```txt
# Module Context: <module-name>

## Result

Status: READY | PARTIAL | BLOCKED

Reason:
- <一到三點說明 context 狀態>

## 分析範圍與可信度說明
## Engineer Summary
## Agent 使用方式
## 模組概覽
## 模組邊界
## 主要入口與關鍵檔案
## 資料流與 Contract
## 狀態、錯誤與副作用
## 可修改範圍
## 不可越界範圍
## 後續 Agent 指引
## 風險、未知與待確認事項

## Report File

- Path: <report output path>
```

## Status Rules

Status 使用：

- READY：已能建立足夠邊界，後續 agent 可依本 context 修改
- PARTIAL：可建立部分邊界，但仍有重要 contract 或上下游待確認
- BLOCKED：模組範圍、入口或必要 contract 無法確認，不能安全提供修改邊界

PARTIAL 不代表任務失敗，但後續 agent 必須遵守待確認事項，不得自行擴大修改。

BLOCKED 時不得假裝完成 module context，必須列出阻塞原因與可安全補充的下一步。
