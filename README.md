# Controlled Agent Workflow

本 repository 是集中式 AI Workflow 規則庫。建議安裝在應用程式專案之外，讓多個專案共用
同一份 Bootstrap、Orchestration、Registry、Role 與 Skill 規則。

不要把整個 `AI-Workflow/` 複製到每個應用程式專案。各專案只需要：

```text
<PROJECT_ROOT>/
  AGENTS.md
  project.config.json
```

## 安裝集中式 Workflow

將本 repository 放在固定位置。實際包含 `bootstrap.md` 與 `workflow.config.json` 的
`AI-Workflow` 目錄就是 Workflow Root。

每個專案根目錄的 `AGENTS.md` 必須保存該集中式 `bootstrap.md` 的唯一絕對路徑。只有這個
Host Adapter 可以包含絕對 Workflow 路徑。

## 設定專案入口

將本 repository 根目錄的下列兩個檔案放到使用 Workflow 的專案根目錄：

```text
AGENTS.md
project.config.json
```

接著只需調整：

- `AGENTS.md`：將唯一 Bootstrap 絕對路徑改為集中式 Workflow 的實際安裝位置。
- `project.config.json`：將 `project_id` 改為目前專案的唯一識別。

Agent 會依序執行：

```text
<PROJECT_ROOT>/AGENTS.md
  -> <AGENTS 指定的絕對 bootstrap.md>
  -> workflow.config.json
  -> <PROJECT_ROOT>/project.config.json
  -> Dispatcher
```

載入 Bootstrap 後：

- Workflow Config、Schema、Registry、Orchestration、Role、Skill 與 Workflow Context 路徑，
  全部相對於 Workflow Root。
- Project Config 與 Project Context 路徑，全部相對於 Project Root。
- Prompt、環境變數與 Project Config 都不得覆寫 Workflow Root。

若 Bootstrap、Workflow Config 或 Project Config 不存在或無法驗證，Workflow 必須停止，不得
搜尋其他副本或使用 Prompt 路徑繼續。

## Claude Code 設定

Claude Code 預設讀取專案根目錄的 `CLAUDE.md`。若專案同時支援 Codex 與 Claude Code，建立：

```text
<PROJECT_ROOT>/
  AGENTS.md
  CLAUDE.md
  project.config.json
```

`CLAUDE.md` 只使用相對路徑引用同目錄的 Host Adapter：

```markdown
@AGENTS.md
```

Claude Code 若限制讀取專案外目錄，啟動時仍須授權集中式 Workflow Root：

```text
claude --add-dir <WORKFLOW_ROOT>
```

`<WORKFLOW_ROOT>` 是操作命令的安裝位置參數，不是規則內的第二個 Workflow Root 定義。實際
權威入口仍只有 `AGENTS.md` 中的 Bootstrap 絕對路徑。

## 專案設定

每個專案根目錄必須包含 `project.config.json`。此檔案保存專案身分、相容 Workflow
版本與專案 Context，不保存 Workflow 的實體安裝路徑。

直接使用本 repository 根目錄的檔案：

```text
project.config.json
```

放到應用程式專案根目錄後，將 `project_id` 改為目前專案的唯一識別。格式只能使用小寫英文字母、
數字與連字號，例如：

```json
{
  "project_id": "purchase-system",
  "project_root": "."
}
```

其餘欄位可以先保留預設值：

- `project_id` 是專案唯一識別。
- `project_root` 一般使用 `.`。
- `workflow_compatibility` 宣告可接受的集中式 Workflow 版本。
- `project_contexts` 宣告可以按需載入的 Project Context；新專案可以先使用空陣列。
- `module_registry` 指向專案自己的 Module Registry；尚未建立時使用 `null`。
- `module_aliases` 保存模組名稱與 canonical Module ID 的對應。
- `auto_skills` 保存該專案固定要自動加入的 Skill；通常先維持空陣列。
- `context_resolution` 與 `context_policy` 定義 Context 身分、選取與阻擋政策。

Project Config 中所有 Context 與 Module Registry 路徑都相對於 Project Root，不得填入集中式
Workflow 的安裝路徑。

## 加入 Project Context

Project Context 不是啟動 Workflow 的必要條件。新專案可以先使用：

```json
"project_contexts": []
```

一般 Developer／Review 任務不會只因陣列為空而停止。需要建立專案共用背景時，先在專案內建立
Context 文件，再將它登錄到 `project_contexts`：

```json
"project_contexts": [
  {
    "context_id": "project-context.current",
    "path": "ai-context/project.md",
    "status": "current",
    "current": true,
    "targets": []
  }
]
```

只有 `current=true`、身分相符且 Target 相容的 Context 可以自動載入。需要強制特定 Action
必須具備 Project Context 時，再調整 `context_policy.require_project_context_for`；預設範本不
強制任何 Action。

## 專案安裝檢查

新專案完成後應具有：

```text
<PROJECT_ROOT>/
  AGENTS.md
  project.config.json
```

若使用 Claude Code，再加入同層的 `CLAUDE.md`。`AGENTS.md` 是唯一保存集中式 Bootstrap
絕對路徑的檔案；`project.config.json` 不得宣告或覆寫 Workflow Root。

## 使用方式

一般情況只需要描述任務。Workflow 會自動推導 Action、Role、Target、Scope 與適用 Skill。
`角色`與 `Skill` 是選填欄位；若已確定要使用的角色或 Skill，可以使用 Registry 中的精確 ID，
減少 Agent 判斷。

### 情境一：開發任務

```text
角色：developer
Skill：developer.language.typescript

請調整 Vue 3 訂單列表的付款狀態顯示邏輯。
修改範圍限制在訂單列表元件與直接使用的 composable，不改變既有 API contract。
完成後執行既有 lint 與 typecheck，並回報修改檔案與驗證結果。
```

已知語言或框架時可以明確寫在需求中。未指定其他 Skill 時，Workflow 仍會依 Vue、Frontend 等
高信心事實選取相容 Skill。

### 情境二：Review 任務

```text
角色：review

請 Review 目前 staged changes，確認這次訂單付款狀態修正是否符合需求。
只檢查 staged diff 與理解直接風險所需的相鄰檔案，重點確認資料流、錯誤處理與既有 API contract。
請先列出 blocking findings，再回報 PASS 或 FAIL；不要修改程式碼。
```

使用「staged changes」與「單次修正」可讓 Workflow 推導 Change Review；若要檢查完整頁面、功能
或模組，應明確寫「完整功能 Review」並提供功能範圍與需求來源，讓 Workflow 推導 Feature
Review。

### 情境三：模組分析

```text
角色：module-analyst

請分析 Lunch 模組的前端訂單頁面與後端 API。
整理模組入口、責任邊界、前後端資料流、request／response contract、可修改範圍與不可越界範圍。
只進行唯讀分析，不提出重構方案；產出可供後續 Developer 與 Review 使用的 Module Context。
```

模組名稱應使用 `project.config.json` 或 Module Registry 已登錄的 canonical ID／alias。若只分析
Frontend 或 Backend，直接在需求中說明即可，Workflow 會選取對應 Analysis Skill。

## Prompt 撰寫建議

為減少 Agent 推導歧義，建議在 Prompt 中提供：

- 明確動作：開發、修正、重構、Review、專案分析或模組分析。
- 明確對象：功能、頁面、API、模組名稱，或已確認的檔案／資料夾。
- 技術資訊：Vue、React、Node.js、JavaScript、TypeScript，或其他已確認技術。
- 範圍邊界：允許修改或閱讀的範圍，以及不得變更的 contract 或既有行為。
- 完成條件：預期結果、需要執行的驗證，以及希望回報的內容。
- Review 證據：staged diff、完整功能需求、指定頁面或模組範圍。

只有下列欄位可以使用結構化格式：

```text
角色：<Registry role_id>
Skill：<Registry skill_id>
```

不要使用 `任務類型：`、`Target：`、`Module：`、`Scope：` 或 `Review Mode：` 等欄位直接控制
routing，也不需要提供 Workflow 路徑、規則路徑或 Context 路徑。請將這些資訊自然地寫進任務
描述，由 Task Analysis 與 Registry 驗證後推導。

## 結果回覆層級

Workflow 會依任務範圍與風險自動選擇完成回覆層級，不需要在 Prompt 指定 Level：

- Level 1：單一檔案、單一 Target 且沒有高風險事實的微小修改。
- Level 2：一般開發、Review 或限定範圍分析，也是資訊不足時的預設層級。
- Level 3：跨模組、全專案、Full Stack、Migration，或涉及架構、資料、權限、安全與公開契約的任務。

執行前判定的是最低層級；若驗證失敗、發現重大風險，或 Review 出現 blocker／high finding，
Agent 只能向上提升。這項設定只控制對話中的完成回覆，不會縮減 Review report、Project Analysis
或 Module Context 等正式產物。使用者仍可用自然語句要求「簡短回覆」或「完整報告」，但不得降低
必要風險資訊。

## 驗證入口

完成 `AGENTS.md` 與 Project Config 設定後，送出：

```text
測試 AI Workflow 規則運作
```

成功時 Agent 必須只回覆：

```text
測試規則運作成功
```

## 驗證規則庫

在本 repository 根目錄執行：

```powershell
node AI-Workflow/tests/validate-workflow.mjs
```
