# Module Context Output

正式文件集中保存在 Workflow Root；使用者只要求對話說明時不建立文件。輸出使用 UTF-8，內容以後續 Developer、Review 與工程師能理解並遵守為目的。

## 必要結構

```text
# Module Context: <module-name>
## 分析識別
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
```

分析識別包含 Project Name、絕對 Project Root、Project Config Path、Project Slug、Module Name 或主要路徑、Target 與含時區的 Analyzed At。

文件必須描述入口、上游呼叫端、下游依賴、輸入輸出、props／events／API／schema 等 contract、狀態與副作用、可修改與不可越界範圍。重要結論附來源，並標記明確事實、結構推論或待人工確認。不得輸出敏感值、大量程式碼、逐檔摘要、具體改法、重構方案或主觀風格評價。
