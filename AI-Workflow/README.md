# AI-Workflow

本目錄是集中式 AI Workflow 的新架構骨架。

入口規則：

- `AI-Workflow/bootstrap.md`
- `AI-Workflow/workflow/common.md`

目前支援角色：

- Developer：負責開發、重構、review 與技術任務執行。
- Project Analyst：負責分析專案並產出專案分析 md 檔，幫助工程師快速上手新專案。

目前規則搬移狀態：

- `AGENTS.md` → `AI-Workflow/bootstrap.md`
- `AGENTS.md` 的 Developer 規則 → `AI-Workflow/roles/developer.md`
- `agents/` → `AI-Workflow/roles/developer/`

全角色通用規則：

- UTF-8 檔案讀寫規則：`AI-Workflow/bootstrap.md`
- 必要規則檔案缺失處理：`AI-Workflow/bootstrap.md`
- 角色判斷流程：`AI-Workflow/bootstrap.md`
- 任務模式：`AI-Workflow/workflow/common.md`

## Prompt 指定角色

目前 bootstrap 支援 Developer 與 Project Analyst。

若要讓不同專案共用同一份集中式規則，建議在專案根目錄建立 `.env`：

```txt
AI_WORKFLOW_ROOT=<path-to-ai-workflow>
```

`.env` 必須加入 `.gitignore`，不得上傳版本控制。

## 環境變數

| 參數名稱 | 必填 | 說明 |
| --- | --- | --- |
| `AI_WORKFLOW_ROOT` | 否 | 指向集中式 `AI-Workflow` 目錄。未設定時，預設使用目前專案根目錄下的 `AI-Workflow/`。 |

設定 `.env` 後，prompt 只需要指定角色：

```txt
角色：Developer
```

若要分析新專案並產出專案分析文件，可指定：

```txt
角色：Project Analyst

本次任務：
分析目前專案，並將專案分析文件輸出到 docs/PROJECT_ANALYSIS.md。
```

可同時指定任務類型、任務模式與 skill：

```txt
角色：Developer
任務類型：前端任務
任務模式：學習模式
指定 skill：project-structure

本次任務：
修改 AssetCard component 樣式。
```

若需要臨時覆蓋 `.env`，可在 prompt 指定 `AI-Workflow 路徑` 或 `Bootstrap 路徑`。

若 prompt 未指定路徑，且 `.env` / 系統環境變數沒有 `AI_WORKFLOW_ROOT`，則預設使用目前專案根目錄下的 `AI-Workflow/`。
