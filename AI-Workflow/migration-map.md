# Workflow 架構圖

## Workflow 入口

```text
一般 Prompt
  -> Project Root Host Adapter（AGENTS.md 或 CLAUDE.md）
  -> Host Adapter 指定的絕對 bootstrap.md
  -> Dispatcher
  -> LLM Task Manifest
  -> Runtime resolve-routing
  -> LLM Role Plan
  -> Runtime resolve-execution
  -> Runtime load_paths
  -> Role Entry / Execute
```

目前宿主實際載入之 Host Adapter 中的絕對 Bootstrap 路徑是唯一入口。Workflow Root 是已載入
`bootstrap.md` 的所在目錄；後續 Workflow 路徑都相對於此 Root。Project Config 固定由 Host Adapter
所在目錄的 `project.config.json` 提供。入口驗證失敗時，Workflow 必須停止。

## 專案邊界

```text
<PROJECT_ROOT>/
  AGENTS.md 或 CLAUDE.md
  project.config.json
```

Codex 將共用 Host Adapter 模板安裝為 `AGENTS.md`；Claude Code 將同一模板改名為 `CLAUDE.md`，不透過
`@AGENTS.md` 轉接。專案只保存 Host Adapter、Project Config 與專案專屬 Context。集中式 Workflow
Root 保存 Bootstrap、Runtime、Orchestration、Registry、Schema、Role 與 Skill 規則。

## 階段責任

1. Bootstrap 驗證 Workflow Root、Workflow Config、Project Root、Project Config、Runtime 與 fallback 契約。
2. LLM 產生 Task Manifest，不自行判定風險、Profile 或規則路徑。
3. Runtime `resolve-routing` 判定 Risk、Profile 與 Role Planner。
4. LLM 依指定 Planner 產生 Role Plan。
5. Runtime `resolve-execution` 完成 Registry、Rule、Context、Preflight 與 Executor 驗證。
6. Execute 只讀取 Runtime 核准的 `load_paths`，不重新進行 routing。

Runtime 技術上不可用時，流程先停在 `AWAITING_FALLBACK_CONSENT`。只有目前使用者明確同意，才能
載入 Markdown fallback；Agent 或子代理不得代為同意。

## 輸入邊界

- 一般 Prompt 只需要描述需求。
- Role 與 Skill 可以使用精確 Registry ID 選填。
- Task Type、Target、Module、Scope 與 Review Mode 由 Task Analysis 或 Project Config 產生。
- 未知 Role／Skill、必要欄位歧義與模組 Context 歧義都必須停止。

## 角色入口邊界

所有角色使用 `roles/<role-id>/entry.md` 作為唯一入口。Executor Adapter 負責將已解析的 Task Manifest、Role Plan、Execution Contract、Rule Set 與 Context 交給 Role Entry；Role Entry 負責角色行為、專業規範、限制與輸出格式。

Role Entry 不得重新選擇 Role、Skill、Target、Context 或規則路徑。若執行期間發現需要改變核准 Scope 或 Rule Set，必須交回 Dispatcher。

## Developer Skill 配置

Developer 的主流程只負責開發任務規劃與執行契約，技術差異由可組合的 Skill 承擔：

```text
developer.frontend.base / developer.backend.base  # 目標能力
developer.language.javascript / typescript         # 程式語言
developer.runtime.node-js                          # 執行環境
developer.frontend.vue / react                     # 前端框架
developer.refactor.general                         # 任務技法
```

- `.NET` Skill 已移除；團隊重新採用時再建立獨立套件。
- 舊 Node.js 後端 Skill 的通用後端規則已併入 `developer.backend.base`，Node.js 特有內容移至 `developer.runtime.node-js`。
- 舊前端 JavaScript／TypeScript Skill 已移至跨目標的 `language/` 分類。
- 舊專案結構 Skill 已移除，專案結構由選填的 Project Context 提供。
- 舊架構變更 Skill 已移除；目標能力、語言、Runtime、Framework 與任務技法由 Rule Resolution 組合。
- Developer Task Log、`learning`／`formal` 執行模式與 Project Config 的模式預設值已移除；所有任務使用固定角色輸出契約。

## 驗證

```powershell
node AI-Workflow/tests/validate-workflow.mjs
git diff --check
```
