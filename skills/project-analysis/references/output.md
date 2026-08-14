# Project Analysis Output

正式文件集中保存在 Workflow Root，不寫入被分析的工作專案。使用者只要求對話說明時不建立文件；要求文件時使用：

```text
<Workflow Root>/agent-workspaces/analysis/<project-slug>/project/PROJECT_ANALYSIS.md
```

- project slug 優先使用 `project.config.json` 的 `project.name` 正規化的 lowercase kebab-case；沒有可用設定時使用工作專案根目錄名稱並標記來源。
- 使用固定檔名更新同一專案的 context；更新前必須以報告內的 Project Root 確認是同一專案，否則不覆蓋。
- 文件使用 UTF-8，並在對話中回報實際路徑。

## 必要結構

```text
# Project Analysis
## 分析識別
## 分析範圍與可信度說明
## 專案概覽
## 技術棧
## Project Config 與 Repository Evidence
## 專案啟動與主要入口
## 資料夾地圖
## 核心模組與責任
## 團隊工程風格
## 新工程師上手路線
## 建議閱讀順序
## 風險、未知與待確認事項
```

### 分析識別

包含 Project Name、正規化後的 Project Root、Project Config Path（或未載入）、Project Slug、含時區的 Analyzed At。

### 內容要求

- 技術棧用表格列出分類、技術或工具、判斷來源與可信度。
- Config 比對逐一列出宣告 stack 與 repository evidence；衝突須同時列出雙方來源，不自動修改設定。
- 專案地圖只描述主要資料夾與高階責任，不逐檔摘要。
- 團隊風格區分穩定慣例、局部慣例與待人工確認。
- 提供新工程師上手路線及 5 至 10 個有閱讀目的的建議路徑。
- 重要結論標記為明確事實、結構推論或待人工確認，並提供來源路徑。

不得輸出 secret、credential、connection string、大量程式碼、code review finding、重構建議、架構改造方案或未確認的啟動／部署步驟。
