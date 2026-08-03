# Controlled Agent Workflow

本 repository 是集中式 AI Workflow 規則庫。建議安裝在應用程式專案之外，讓多個專案共用
同一份 Bootstrap、Orchestration、Registry、Role 與 Skill 規則。

不要把整個 `AI-Workflow/` 複製到每個應用程式專案。各專案只需要：

```text
<PROJECT_ROOT>/
  AGENTS.md
  .ai-workflow/
    project.config.json
```

## 安裝集中式 Workflow

將本 repository 放在固定位置。實際包含 `bootstrap.md` 與 `workflow.config.json` 的
`AI-Workflow` 目錄就是 Workflow Root。

每個專案根目錄的 `AGENTS.md` 必須保存該集中式 `bootstrap.md` 的唯一絕對路徑。只有這個
Host Adapter 可以包含絕對 Workflow 路徑。

## 設定專案入口

將本 repository 根目錄的 `AGENTS.md` 放到使用 Workflow 的專案根目錄，再將其中唯一的
Bootstrap 絕對路徑調整為實際安裝位置。

Agent 會依序執行：

```text
<PROJECT_ROOT>/AGENTS.md
  -> <AGENTS 指定的絕對 bootstrap.md>
  -> workflow.config.json
  -> <PROJECT_ROOT>/.ai-workflow/project.config.json
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
  .ai-workflow/
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

每個專案必須建立 `.ai-workflow/project.config.json`。此檔案保存專案身分、相容 Workflow
版本與專案 Context，不保存 Workflow 的實體安裝路徑。

最小結構可參考本 repository 的 `.ai-workflow/project.config.json`：

- `project_id` 是專案唯一識別。
- `project_root` 一般使用 `.`。
- `workflow_compatibility` 宣告可接受的集中式 Workflow 版本。
- `project_contexts` 與 `module_registry` 都以 Project Root 為基準。

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
