# AI-Workflow

本目錄是集中式 AI Workflow 的新架構骨架。

入口規則：

- `AI-Workflow/bootstrap.md`
- `AI-Workflow/workflow/common.md`

目前支援角色：

- Developer：負責開發、重構與技術任務執行。
- Project Analyst：負責分析專案並產出專案分析 md 檔，幫助工程師快速上手新專案。
- Review：負責在任務完成或功能完成後進行獨立 review，檢查需求落差、bug、邏輯衝突、資料流、contract 與驗證缺口。

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

目前 bootstrap 支援 Developer、Project Analyst 與 Review。

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

若要執行 Review，可指定：

```txt
角色：Review
Reviewer：Change Reviewer
任務類型：前端任務

本次任務：
檢查目前 staged changes 是否可 commit。
```

或針對完整頁面 / 模組功能：

```txt
角色：Review
Reviewer：Feature Reviewer
任務類型：後端任務

本次任務：
檢查會員 API 模組是否符合完整功能需求。
```

Review 支援兩種 reviewer：

- Change Reviewer：單一任務完成、git add 後、commit 前使用，主要依據 `git diff --cached` 與該任務需求。
- Feature Reviewer：整個頁面或模組功能完成後使用，主要依據完整功能需求與現有完整程式碼，不限定 commit 或最近 diff。

Review 會依任務類型自動載入 checks：

- 所有 Review：讀取 `AI-Workflow/roles/review/checks/common.md`
- 前端任務：額外讀取 `AI-Workflow/roles/review/checks/frontend.md`
- 後端任務：額外讀取 `AI-Workflow/roles/review/checks/backend.md`

Review 預設會產出 markdown report：

- Change Reviewer：`AI-Workflow/reviews/change/<YYYYMMDD-HHmm>-<task-slug>.md`
- Feature Reviewer：`AI-Workflow/reviews/feature/<YYYYMMDD-HHmm>-<feature-slug>.md`

若 prompt 明確指定輸出位置，會寫入指定位置。

若 prompt 明確表示不用落檔，才只在對話中回報。

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
