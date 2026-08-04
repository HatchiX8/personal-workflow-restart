# AI Workflow

AI Workflow 採集中式安裝。每個應用程式專案的根目錄只保留 `AGENTS.md` 與 `project.config.json`；Host Adapter 以唯一絕對路徑載入集中式 `bootstrap.md`。一般任務只需要描述需求，Workflow 會依序完成任務分析、規則推導與 Preflight。

## 最簡單的用法

```text
修正午餐訂單列表無法更新付款狀態的問題。
```

使用者不需要在 Prompt 內提供 Workflow 路徑、Task Type、Target、Module Context 路徑或規則檔案路徑。

`角色`與 `Skill` 是選填欄位。未提供時，Workflow 會依需求內容與 Registry 推導；明確提供時，仍須通過 Registry 與 Preflight 驗證。

```text
角色：developer
Skill：developer.language.typescript

調整 TypeScript 前端訂單列表元件的資料型別。
```

Review 與 Developer Skill 是不同的輸入範圍；明確指定時，Role 與 Skill 必須通過相容性驗證。

## 執行階段

```text
Bootstrap
  -> Dispatcher
  -> Task Analysis
  -> Role Planner
  -> Rule Resolution
  -> Preflight
  -> Execute
```

- Bootstrap 只尋找 Workflow Root、Workflow Config、Project Config 與核心 orchestration contract。
- Task Analysis 產生結構化 Task Manifest，推導 Action、Task Type、Target、Module 與 Scope。
- Role Planner 執行該角色的 `roles/<role-id>/planner.md`，產生 Role Plan、Skill selectors 與
  Result Reporting 最低層級，不直接載入 Skill 規則。
- Rule Resolution 根據 Task Manifest 與 Role Plan，只從 Registry 選取本次需要的角色核心、Skill、Review 與 Context 規則。
- Preflight 驗證 Manifest、Registry、規則檔案、Context、inclusion dependency、獨立 load order、Hash 與 Rule Set fingerprint；precedence 只用於規則衝突裁決。
- Execute 透過 `orchestration/role-entry-contract.md` 將固定輸入交給 `roles/<role-id>/entry.md`，不重新判斷角色、Skill 或 Context。

Workflow Root 是 Host Adapter 實際載入之 `bootstrap.md` 的所在目錄。只有專案根目錄
`AGENTS.md` 保存絕對 Bootstrap 路徑；其餘 Workflow 路徑都相對於 Workflow Root。Bootstrap
不搜尋 Git Root 下的規則副本，也不接受 Prompt、環境變數或 Project Config 提供替代路徑。
Project Config 固定從生效之專案根目錄的 `project.config.json` 讀取。

## 停止條件

Workflow 遇到下列情況會停止，並回報原因，不會直接使用模型預設值或猜測相似規則：

- Workflow Root、Workflow Config 或 Project Config 無法唯一解析。
- Action、Role、明確 Skill、Target 或 Module 無法安全解析。
- Required Rule、Required Skill 或 Required Context 不存在、無法讀取或版本不符合。
- Module Context 沒有確認的 `project_id`、`current` 指標或唯一 Target 對應。
- Registry 存在重複 ID、無效路徑、dangling dependency 或循環依賴。
- Rule Set 在 Preflight 後內容 Hash 或 fingerprint 改變。

Review 在 Target 未知時可以只載入 Common Checks，但若其他必要資訊缺失，仍會被 Preflight 阻擋。

## 規則來源

README 一律是工程使用說明，不是 routing source，也不得登錄為 execution rule。正式 routing source 是：

- `AI-Workflow/workflow.config.json`
- `AI-Workflow/registry/*.json`
- `AI-Workflow/orchestration/*.md`
- `AI-Workflow/schemas/*.json`
- `AI-Workflow/roles/**` 中既有角色規則
- 已通過 Registry 選取的 Project／Module Context

角色入口固定為 `AI-Workflow/roles/<role-id>/entry.md`，只接收 Task Manifest、Role Plan、Resolved
Rule Set 與通過 Preflight 的 Execution Contract。Execution Contract 會凍結 Result Reporting
最低層級；執行後只能依驗證失敗或新風險向上提升。新增 Role、Skill 或 Context 時，應先更新對應
Manifest 或 Registry 契約，再建立回歸 fixture。

## Catalog 與 Module Registry

`catalog/modules.json` 只保存集中式 Workflow 可辨識的 Module ID、顯示名稱與 aliases；Agent
routing 實際讀取的是 `registry/modules.json`。Project Analysis、Module Context、Review report、
Project 綁定與 current pointer 都不得寫入 Catalog，應由各專案的 `project.config.json`、專案
Module Registry 或 `agent-workspaces/` 維護。

目前 Module Registry 尚未自動從 Catalog 生成，修改 Module 時必須同步兩份檔案並更新 Registry
snapshot。詳細步驟見 `catalog/README.md`。

## 任務完成回覆

`policies/result-reporting.md` 將對話完成回覆分為三層：微小修改使用 Level 1、一般任務預設
Level 2、高風險或大範圍任務使用 Level 3。這個層級只控制完成回覆的詳細程度，不會縮減 Review
report、Project Analysis 或 Module Context 等正式產物。沒有風險、限制或後續事項時，Agent 必須
省略對應區塊。

## 專案產物

集中式 Workflow Root 只保存規則、Schema、Registry 與測試，不保存個別專案產生的 Markdown。
未指定輸出位置時，正式產物統一寫入：

```text
<PROJECT_ROOT>/agent-workspaces/
├─ project-analysis/PROJECT_ANALYSIS.md
├─ module-context/<frontend|backend|fullstack|unknown>/
└─ reviews/<change|feature>/
```

所有路徑以 Project Root 為基準。使用者指定的輸出位置優先；Agent 完成時仍須回報實際路徑。

## 選填控制欄位

一般情況只需要描述需求。使用者可以選填 canonical Role 與 Skill：

```text
角色：developer
Skill：developer.language.typescript

調整 TypeScript 前端訂單列表元件的資料型別。
```

Role 與 Skill 必須使用 Registry 中的精確 ID。未知、停用或不相容的值會被 Preflight 阻擋，不會套用相似 alias 或預設值。

Task Type、Target、Module、Scope 與 Review Mode 都由 Task Analysis、Project Config 與 Registry 推導，不接受 Prompt 結構化欄位直接指定。Workflow Root 與 Bootstrap 路徑也不能透過 Prompt 覆寫。

## 入口健康檢查

送出以下完整 Prompt：

```text
測試 AI Workflow 規則運作
```

Bootstrap 完成 Root、Workflow Config 與 Project Config 驗證後，必須只回覆：

```text
測試規則運作成功
```

健康檢查不會進入 Dispatcher。

## 驗證

使用 Node 內建模組執行完整契約驗證，不需要安裝第三方套件：

```powershell
node AI-Workflow/tools/build-skill-registry.mjs
node AI-Workflow/tools/build-rule-registry.mjs
node AI-Workflow/tools/refresh-registry-snapshots.mjs
node AI-Workflow/tests/validate-workflow.mjs
```

Skill Registry 與核心 Rule Registry 都是生成產物，不應手動編輯。驗證範圍包含 JSON parse、Config references、Role Planner、Skill Package、Registry IDs、來源 snapshot drift、inclusion dependency 與循環、active rule／skill paths、canonical Role Entry、真實 SHA-256 的 reference resolution/preflight/executor bytes re-read、Phase 3/4/5 expected，以及 Task Analysis evidence assertions。Task Analysis 的自然語言判斷由模型完成；Node 僅驗證已產生 Manifest 的 evidence 與 explicit 欄位。
