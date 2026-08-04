# Agent Workspaces

本資料夾是目前專案所有 Agent 正式 Markdown 產物的統一根目錄。路徑相對於 Project Root，
不得寫入集中式 `AI-Workflow/`。

## 目錄結構

```text
agent-workspaces/
├─ project-analysis/
│  └─ PROJECT_ANALYSIS.md
├─ module-context/
│  ├─ frontend/
│  ├─ backend/
│  ├─ fullstack/
│  └─ unknown/
├─ reviews/
│  ├─ change/
│  └─ feature/
└─ examples/
   ├─ project-a/
   └─ project-b/
```

## 分類

- `project-analysis/`：Project Analyst 產生的專案地圖、技術棧、入口、團隊風格與上手資訊。
- `module-context/`：Module Analyst 依 Target 產生的模組邊界、資料流與 Contract。
- `reviews/`：Review 依 Change／Feature mode 產生的報告。
- `examples/`：Context 格式範例，不是目前專案的 active Context。

Project Analysis 與 Module Context 只有在 `project.config.json` 或專案 Module Registry 完成登錄後，
才會成為可自動載入的 Context；單純存在於本資料夾不代表已啟用。
