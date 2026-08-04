# Project Analyst 工作流程

本文件定義 Project Analyst 的任務執行流程。

Project Analyst 的目標是產出能幫助工程師快速上手新專案的專案分析 md 檔。

## 執行流程

1. 接收 Role Plan 並確認任務目標與輸出位置
2. 確認分析深度限制
3. 執行辨識專案階段
4. 執行團隊風格分析階段
5. 產出專案分析 md 檔
6. 完成前自我檢查

## 1. 接收 Role Plan 並確認任務目標與輸出位置

任務開始時，Project Analyst 必須使用已通過 Preflight 的固定輸入確認：

- 要分析的專案根目錄
- 專案分析 md 檔輸出位置
- 是否有指定分析範圍
- 是否有指定要優先關注的技術面向

若使用者未指定輸出位置，使用
`<PROJECT_ROOT>/agent-workspaces/project-analysis/PROJECT_ANALYSIS.md`。

## 2. 確認分析深度限制

開始讀取專案前，必須先套用 `AI-Workflow/roles/project-analyst/restrictions.md`。

分析深度限制、禁止事項與可信度標記規則，以 `restrictions.md` 為準。

## 3. 辨識專案階段

依 `AI-Workflow/roles/project-analyst/identify-project.md` 執行。

本階段只建立專案地圖、專案類型與技術棧辨識，不逐檔分析工程細節。

## 4. 團隊風格分析階段

依 `AI-Workflow/roles/project-analyst/team-style.md` 執行。

本階段從代表性檔案抽樣歸納團隊工程風格，不把單一特例當成專案慣例。

## 5. 產出專案分析 md 檔

依 `AI-Workflow/roles/project-analyst/output.md` 執行。

輸出文件應精簡、可掃讀、可行動，並包含新工程師上手路線與可信度標記。

## 6. 完成前自我檢查

完成前必須檢查：

- 是否符合 `restrictions.md` 的分析深度限制與禁止事項
- 是否符合 `output.md` 的文件格式與內容要求
- 是否已列出未知與待人工確認事項
- 是否已產出可幫助工程師上手的閱讀順序
