# Agent Workspaces

本目錄集中保存 Project Analyst 與 Module Analyst 產生的本機分析報告，避免將 Agent 分析產物寫入被分析的工作專案。

預設結構：

```text
analysis/
  <project-slug>/
    project/
      PROJECT_ANALYSIS.md
    modules/
      frontend/
      backend/
      fullstack/
      unknown/
```

- Project Analysis 使用固定檔名，重新分析同一專案時可更新既有文件。
- Module Context 使用 timestamp 與 module slug 建立新報告；只有使用者明確指定時才更新既有文件。
- 每份報告都必須記錄 Project Name、Project Root、Project Config Path 與分析時間，避免同名專案混淆。
- `analysis/` 內容預設由 Git 忽略，只保留本說明與 `.gitkeep`。
