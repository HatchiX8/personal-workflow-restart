# Controlled Agent Workflow

集中式 AI Workflow 規則庫，讓多個專案與 Agent 平台共用同一份 Bootstrap、Registry、Role、Skill
與執行規則。使用者只需描述任務，LLM 負責語意理解，Node.js Runtime 負責風險與規則路由。

## 安裝需求

將本 repository 放在固定位置，並安裝 Node.js 20.11.0 以上版本。不需要 `npm install`、第三方套件、
常駐服務、資料庫或網路。

## 設定專案入口

將對應平台的入口檔與 `project.config.json` 放到專案根目錄即可：

```text
<PROJECT_ROOT>/
  AGENTS.md          # Codex
  或 CLAUDE.md       # Claude Code
  project.config.json
```

若檔案尚未預先設定，確認入口檔包含正確的 `AI-Workflow/bootstrap.md` 絕對路徑，並將
`project.config.json` 的 `project_id` 改為目前專案的唯一識別。

## 多 Agent 平台與執行授權

Codex、Claude Code 與其他能執行 Node.js 的 Agent 都可以使用本 Workflow。第一次執行時，依平台
提示允許以下 Runtime 指令即可：

```text
node <WORKFLOW_ROOT>/runtime/resolve-task.mjs --stdin
```

Runtime 只讀取設定與規則，不連網、不寫檔。Runtime 無法執行時會改用 Markdown fallback；Runtime
已執行並回傳阻擋時則直接停止。Claude Code 若需要讀取專案外的集中式 Workflow，啟動時加入：

```text
claude --add-dir <WORKFLOW_ROOT>
```

## 最簡單的使用方式

一般情況直接描述任務即可，角色與 Skill 可以省略：

```text
請修正訂單列表無法更新付款狀態的問題。
修改範圍限制在訂單模組，完成後執行既有測試。
```

建議在需求中說明要做什麼、允許處理的範圍，以及完成條件與需要執行的驗證。

## Agent 產物目錄

Review、Module Context 與 Project Analysis 預設寫入專案根目錄的 `agent-workspaces/`：

```text
<PROJECT_ROOT>/agent-workspaces/
  project-analysis/
  module-context/
  reviews/
```

使用者另有指定時，以指定位置為準。

## 安裝健康檢查

完成入口檔與 `project.config.json` 設定後，送出：

```text
測試 AI Workflow 規則運作
```

成功時只會回覆：

```text
測試規則運作成功
```

## 進階文件

- [Project／Module Context 設定](docs/project-context.md)
- [Workflow 架構與維護](AI-Workflow/README.md)
- [Workflow 架構圖](AI-Workflow/migration-map.md)
