# AI-Workflow

本目錄是集中式 AI Workflow 的新架構骨架。

入口規則：

- `AI-Workflow/bootstrap.md`
- `AI-Workflow/workflow/common.md`

目前只有一個角色：

- Developer

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

目前 bootstrap 只支援 Developer。

若要讓不同專案共用同一份集中式規則，建議在專案根目錄建立 `.env`：

```txt
AI_WORKFLOW_ROOT=<path-to-ai-workflow>
```

`.env` 必須加入 `.gitignore`，不得上傳版本控制。

設定 `.env` 後，prompt 只需要指定角色：

```txt
角色：Developer
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
