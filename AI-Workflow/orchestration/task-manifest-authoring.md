# Task Manifest 精簡撰寫契約

本契約是 Runtime 正常路徑中，LLM 在呼叫 Node CLI 前唯一需要載入的任務分析說明。完整推導規則位於
`task-analysis.md`，只供 Markdown fallback 與除錯使用。LLM 負責把自然語言正規化為事實，不得自行
判定 Task Risk、Execution Profile、Rule、Context 或 `load_paths`。

## 輸出形狀

產生符合下列形狀的 Task Manifest。所有陣列都必須去重；無法安全確認的值使用 schema 允許的
`unknown`／`null`／空陣列，並將穩定原因加入 `unresolved`，不得猜測。

```json
{
  "schema_version": "1.0",
  "task_id": "task-...",
  "created_at": "RFC3339 timestamp",
  "raw_request": "未修改的原始需求",
  "action": "develop|review|analyze|unknown",
  "task_type": "feature|change|bugfix|refactor|migration|maintenance|analysis|unknown",
  "role_id": "developer|review|project-analyst|module-analyst|null",
  "skill_ids": [],
  "targets": ["frontend|backend|database|tooling|docs"],
  "target_mode": "single|fullstack|mixed|unknown",
  "project": {
    "project_id": "來自已驗證 Project Config",
    "project_root": ".",
    "config_path": "project.config.json"
  },
  "modules": [],
  "scope": {
    "summary": "需求範圍摘要",
    "include_paths": [],
    "exclude_paths": [],
    "change_source": "request|staged|worktree|full-project"
  },
  "routing_triggers": [],
  "review_mode": "change|feature|null",
  "analysis_mode": "project|module|null",
  "provenance": {},
  "unresolved": [],
  "status": "analyzed|needs-resolution"
}
```

`task_manifest.project.project_root` 是 Project Root-relative 的身分欄位，必須固定為 `.`；不得填入
canonical 絕對路徑。Runtime Request 外層的 `project_root` 才可攜帶 canonical Project Root，並由
Runtime 驗證其與啟動 cwd 完全相同。

`modules[]` 每項使用 `{module_id,name,aliases,candidate_paths}`。`provenance` 至少為 `action`、
`task_type`、`role_id`、`skill_ids`、`targets`、`modules`、`scope`、`routing_triggers`、`review_mode` 與
`analysis_mode` 提供 `{source,confidence,evidence,candidates}`；`source` 只能是 `explicit`、`config`、
`registry`、`repository-evidence` 或 `inference`。必要 routing 信心須至少為 `0.90`，候選差距小於
`0.10` 視為 unresolved。

## 精簡語意規則

- 修改、修正、新增或重構為 `develop`／`developer`；Review 已完成變更為 `review`／`review`；分析
  全專案或模組為 `analyze`，並依已確認範圍使用 `project-analyst` 或 `module-analyst`。
- 使用者明確提供的 `角色：<role_id>` 或 `Skill：<skill_id>` 原樣保留，交由 Runtime 精確驗證。
  不得讀取完整 Registry，也不得用相似名稱修正未知 ID。
- Develop 必須解析至少一個 Target。Project Analysis、未限制 Target 的 Module Analysis，或可安全只
  使用 common checks 的 Review，才能讓 Target 為空。Module Analysis 的空 Targets 表示先執行
  target-neutral repository discovery，不代表已確認沒有 Frontend／Backend。
- 只有確定同時包含 frontend 與 backend 時使用 `target_mode=fullstack`；多個其他 Target 使用
  `mixed`；唯一 Target 使用 `single`。
- Review 的 `review_mode` 必須由 staged/worktree 單次變更或完整 feature 範圍明確支持；Analyze 的
  `analysis_mode` 必須由 project/module 範圍明確支持。
- 一般任務的路徑只能來自使用者明示或可重現的 repository evidence。Module Analysis 若明確指定
  唯一模組名稱，可直接將該名稱記錄為 Module 搜尋種子；`candidate_paths` 可以為空，不得因此要求
  Module Registry 或既有 Module Context。實際檔案範圍由 Module Analyst 在執行階段以只讀搜尋建立。

## 風險輸入事實

LLM 只記錄已確認的 canonical fact／trigger；Node Runtime 才能將它們映射為風險層級。至少保留：

- scope：`scope=file`、`scope=module`，以及 hard trigger `cross-module`、`full-project`；
- 多 Target／遷移：`fullstack`、`mixed-target`、`migration`；
- 架構／Runtime：`architecture-change`、`runtime-migration`、`framework-migration`、
  `shared-library-multi-consumer`；
- 資料：`database-schema`、`data-migration`、`bulk-data-change`、`transaction-integrity`；
- 身分與安全：`authentication`、`authorization`、`security`、`secrets-credentials`、
  `sensitive-data`；
- 金流與公開契約：`payment`、`monetary-flow`、`public-api-contract`、`sdk-contract`、
  `event-contract`、`webhook-contract`；
- 營運與破壞性操作：`production-deployment`、`infrastructure-change`、`destructive-operation`、
  `distributed-concurrency`、`file-delete`、`mass-move-or-rewrite`、`git-history-rewrite`、`rollback`、
  `external-system-write`；
- Workflow 核心規則：`workflow-governance-change`。

Trigger 必須有 provenance。疑似高風險但不能確認或排除時加入 unresolved，不得填入低風險預設值。

## 完成條件

所有必要欄位皆已高信心解析時設定 `status=analyzed`；否則設定 `needs-resolution`。產生 Manifest 後
立即依 `runtime-dispatch.md` 呼叫 Runtime，不讀取 Task Manifest Schema、Registry 或確定性編排契約。
