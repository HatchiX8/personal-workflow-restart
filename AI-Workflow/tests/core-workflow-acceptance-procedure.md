# 核心 Workflow 人工驗收流程

## 驗收目標

使用實際 Prompt 確認 Agent 能：

1. 讀取集中式 Workflow 入口。
2. 推導或接受指定角色。
3. 讀取對應角色 Workflow。
4. 推導或接受指定 Skill。
5. 讀取對應 Skill 的 `rules.md`。

驗收取得 Resolved Rule Set 後停止，不執行實際開發、Review 或分析工作。

## 驗收前準備

- 從待驗收專案根目錄啟動 Agent。
- 確認專案根目錄 `AGENTS.md` 已設定可讀取的 Bootstrap 絕對路徑。
- 專案根目錄具有 `AGENTS.md` 與 `project.config.json`。
- 每個情境使用全新任務，避免上一個情境的 Context 影響結果。

## 驗收用 Prompt 外框

將下列外框與個別情境的實際任務合併後送出：

```text
本次只進行 Workflow 路由驗收，不執行實際任務。

請依下方任務執行 Bootstrap、Task Analysis、Role Planner 與 Rule Resolution。
取得 Resolved Rule Set 後立即停止，不得進入角色執行階段。

請只回報實際解析結果與讀取到的 md 路徑，不要回報預期路徑。

---

<放入驗收情境的實際 Prompt>
```

個別任務內容使用：

`AI-Workflow/tests/core-workflow-acceptance-scenarios.md`

## 操作流程

1. 建立全新 Agent 任務。
2. 貼上驗收 Prompt 外框與一個實際情境。
3. 等待 Agent 回報 Rule Resolution 結果。
4. 使用下方範本記錄結果。
5. 對照情境文件中的預期 Role 與 Skill。
6. 結果正確即 PASS；缺少、誤選或開始執行實際任務即 FAIL。

## 模型分配

| 驗收情境 | 建議模型 | 原因 |
|---|---|---|
| Developer／指定角色與 Skill | GPT-5.6 快速版 | Role 與 Skill 都已明確指定 |
| Review／指定角色、未指定 Skill | GPT-5.6 快速版 | 只需從後端 Target 選取 Check Skill |
| Module Analyst／前後端模組分析 | GPT-5.6 標準版 | 需要解析 Module、多 Target 與兩個 Analysis Skill |
| Project Analyst／專案分析 | GPT-5.6 快速版 | Role 明確，且目前不需要選取 Skill |
| 未指定角色／Node.js 後端重構 | GPT-5.6 標準版 | 需要推導 Action、Role、Target、Runtime 與多個 Skill |
| 未指定角色／指定 TypeScript Skill | GPT-5.6 標準版 | 需要由任務與 Language Skill 相容性推導 Role |

GPT-5.6 深度版不需要參與正常驗收。只有快速版或標準版產生不一致結果時，才使用深度版分析
Task Manifest、Role Plan 與 Skill selectors，不重新執行實際任務。

## 回報範本

```text
驗收結果：PASS / FAIL

指定角色：無 / <role_id>
指定 Skill：無 / <skill_id>
本次任務：<任務摘要>

推導 Action：<develop / review / analyze>
推導角色：<role_id>

讀取核心 Workflow：
- <md 路徑>

讀取角色 Workflow：
- <md 路徑>

讀取 Skill：
- 無
或
- <skill rules.md 路徑>

未解析項目：
- 無
或
- <unresolved>

備註：
- <選填>
```

## 精簡回報範例

```text
驗收結果：PASS

指定角色：無
指定 Skill：無
本次任務：前端訂單模組分析

推導 Action：analyze
推導角色：module-analyst

讀取核心 Workflow：
- bootstrap.md
- orchestration/dispatcher.md
- orchestration/task-analysis.md
- orchestration/role-planner.md
- orchestration/rule-resolution.md

讀取角色 Workflow：
- roles/module-analyst/planner.md
- roles/module-analyst/workflow.md

讀取 Skill：
- roles/module-analyst/skills/analysis/frontend/rules.md

未解析項目：
- 無
```

## PASS／FAIL 判定

PASS：

- 實際 Role 與情境預期一致。
- 核心 Workflow 路徑完整。
- Role Planner 與角色 Workflow 路徑正確。
- 相關 Skill 的 `rules.md` 已載入。
- 沒有載入其他角色 Skill。
- Agent 在 Rule Resolution 後停止。

FAIL：

- 未讀取集中式 Bootstrap 或核心 orchestration。
- Role 錯誤、使用預設 Role，或忽略明確 Role。
- Skill 缺少、誤選，或忽略明確 Skill。
- 使用 README 代替 `rules.md`。
- 在取得 Rule Set 前開始執行實際任務。

Project Analyst 情境目前沒有 active Skill；該情境的「讀取 Skill：無」是正確結果。
