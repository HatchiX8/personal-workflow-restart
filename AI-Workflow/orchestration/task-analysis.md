# Task Analysis 任務分析契約

> 載入政策：本檔是完整 Markdown fallback 與除錯規格。Runtime 正常路徑不得載入本檔，應只載入
> `task-manifest-authoring.md`，再由 Node 驗證完整 Task Manifest Schema 與 Registry 相容性。

## 責任

Task Analysis 將原始需求轉換為符合 `schemas/task-manifest.schema.json` 的 `Task Manifest`。它只描述任務，不選擇規則檔案、不載入 Context，也不執行工作。

Task Analysis 只提供後續 Risk Assessment 所需、已由本階段確認的任務事實、provenance 與 routing
trigger。它不得在本階段計算 `task_risk.level`、選擇 Execution Profile，或計算 Result Reporting
層級。

## 允許使用的來源

- 使用者的原始需求。
- `workflow.config.json` 中的 confidence policy。
- Project Config 的身分資訊與已設定 alias。
- `registry/roles.json`、`registry/skills.json` 與 `registry/modules.json`。
- 只有在路徑證據明確、可重現，且已記錄於 provenance 時，才能使用 repository 路徑證據。

README、角色規則檔與 Module Context 內容都不是 Task Analysis 的來源。Module Analysis 不得為了
取得檔案路徑而預先讀取 Module Context。

## 明確控制欄位

一般需求不需要結構化欄位。使用者只可以選填下列 canonical 控制欄位：

```text
角色：<role_id>
Skill：<skill_id>
```

- `role_id` 必須精確存在於 `registry/roles.json`，不得用 display name 或 alias 取代。
- `skill_id` 必須精確存在於 `registry/skills.json`，且必須為 active 並與解析後 Role 相容。
- 未知、停用或不相容的明確值必須加入 unresolved，設定 `status=needs-resolution`，不得猜測相似值或使用預設值替代。
- Task Type、Target、Module、Scope 與 Review Mode 不是 Prompt 控制欄位。若需求使用 `欄位：值` 格式直接指定其中任一欄位，加入 `unsupported-prompt-control-field:<field>` unresolved 項目並設定 `status=needs-resolution`；不得直接寫入對應 Manifest 欄位。
- Workflow Root 或 Bootstrap 路徑輸入不受支援。若原始需求包含這類欄位，加入 `unsupported-workflow-path-input` unresolved 項目並設定 `status=needs-resolution`。

## 欄位推導

所有與 routing 相關的欄位都必須有 `provenance` 項目，且包含 `source`、`confidence`、`evidence` 與 `candidates`。必要項目為 `action`、`task_type`、`role_id`、`skill_ids`、`targets`、`modules`、`scope`、`routing_triggers`、`review_mode` 與 `analysis_mode`。

使用下列來源政策：

- 通過 Registry 驗證的明確 Role／Skill：`source=explicit`、`confidence=1.0`。
- Project Config 身分或 alias：`source=config`、`confidence=1.0`。
- Registry 精確對應：`source=registry`、`confidence=1.0`。
- 可重現的 repository 訊號：`source=repository-evidence`，並在 evidence 中記錄路徑。
- 自然語言分類：`source=inference`。

套用 `workflow.config.json` 的 confidence policy。routing 必要欄位必須達到 `>= 0.90`。候選差距低於 `0.10` 時，不論分數皆視為歧義。中等信心值可以記錄為 metadata，但不得驅動必要 routing；低信心值必須列入 unresolved。

### Action 與 Role

- 只有需求明確要求修改程式碼或規則時，implement、fix、add、update、refactor 等 Develop 動詞才能推導為 `action=develop`。
- review、inspect a diff、check a completed feature 等 Review 動詞推導為 `action=review`。
- map、investigate、document architecture 等 Analyze 動詞推導為 `action=analyze`。
- 除非已明確提供 Role，否則將 Action 對應到 Registry 中唯一 active Role。
- 明確 Role 優先，但其 Registry Action 必須與需求相容。Develop 需求若明確指定 Review，必須列為 unresolved，不得靜默轉換。
- Analyze 只有在明確需求證據支持時，才能判斷 `analysis_mode=project` 或 `module`；否則可以確定 Action，但 Role 仍須保持 unresolved。

### Task Type 與 Targets

Canonical task type 為 `feature`、`change`、`bugfix`、`refactor`、`migration`、`maintenance` 與 `analysis`。

- 需求包含 fix／bug／error 且信心高時，對應為 `bugfix`。
- 需求包含 refactor／reorganize／reduce duplication 且信心高時，對應為 `refactor`。
- 新增或建立新能力對應 `feature`；有明確邊界的調整對應 `change`。
- Frontend、backend、database、tooling 與 docs 是彼此獨立的 `targets`。
- 確認同時包含 frontend 與 backend 時，正規化為 `target_mode=fullstack`。
- Project Analysis、未限制 Target 的 Module Analysis，或可安全只使用 common checks 的 Review，
  可以讓 Target 為空。Module Analysis 的空 Targets 表示以角色基礎規則進行跨 Target discovery；
  Develop 仍必須解析出 Target，Preflight 才能通過。

### Module、Scope 與角色模式

- 一般執行任務的 Module 透過明確 Registry ID／alias、需求或 repository evidence 比對。
- `role_id=module-analyst` 且 `analysis_mode=module` 時，使用者明確指定的單一模組名稱本身就是合法的
  discovery identity，不要求 Registry ID、alias 設定、project binding、current pointer 或既有 Context。
  將原始名稱與明示別名保留在 `modules[0]`；`candidate_paths` 可以為空。
- Module Analysis 若同時出現多個無法區分的模組名稱才列為 unresolved；缺少預先設定路徑本身不是
  unresolved。
- 使用者主動提供的背景資料、文件、限制或已知邊界必須保留在 `scope.summary` 與對應
  provenance；明確提供的路徑依既有路徑證據規則記錄。這類輸入是任務證據，不要求使用者
  另外登錄或命名為 Context。
- `scope.summary` 是需求結果的精簡重述。`include_paths` 與 `exclude_paths` 只能包含明確提供或有 repository 證據的路徑。除非 Review 明確指出 `staged`、`worktree` 或 `full-project`，否則 `change_source` 為 `request`。
- 從確定的任務事實填入 `routing_triggers`，例如 `architecture`、`structure-change`、`runtime=node-js` 或 `developer-self-review`。Trigger 必須有 provenance，Rule Resolution 不得再從原始文字找回 trigger。

### Risk Assessment 輸入事實

Task Analysis 必須把已確認且會影響風險的事實保留在 canonical Manifest 欄位或
`routing_triggers`，供 `risk-assessment.md` 單向消費。至少涵蓋可由需求安全確認的：

- Scope 範圍：單一檔案、極小範圍、單一模組、cross-module 或 full-project。
- Target 與 target mode：single、fullstack 或 mixed。
- Task Type，以及修改是否為多檔案或多項修改。
- architecture、structure-change、database schema、data migration／backfill、public API／event／webhook
  contract、authentication、authorization、security、payment／monetary flow、production／infrastructure、
  destructive operation、file-delete、rollback、外部系統寫入與 Workflow 治理規則修改等訊號。
- 可逆性、資料狀態影響與契約影響，但只能記錄需求已明示或有允許來源證據支持的值。

會驅動 Level 3 的 trigger 必須使用 `schemas/task-risk.schema.json` 的 canonical hard trigger ID，例如
`architecture-change`、`database-schema`、`data-migration`、`authentication`、`public-api-contract`、
`production-deployment`、`destructive-operation` 或 `workflow-governance-change`；不得把同義自由文字直接
作為可執行分流條件。

每個 risk-related fact 與 trigger 都必須有 provenance，包含 `source`、`confidence`、`evidence` 與
`candidates`；不得因缺少證據而填入低風險預設值。無法確認的項目應維持未知或列入 unresolved，
由 Risk Assessment 依資訊不足政策處理。相同事實不得為了 Result Reporting 再推導一次。

下列內容不是 Task Analysis 的責任：

- 將 fact 或 trigger 對應成 Level 1、2、3。
- 將風險層級對應成 `lightweight`、`standard` 或 `full`。
- 因使用者要求詳細報告而提高任務風險；該要求只能保留為輸出偏好證據。
- 依風險結果選取 Role、Skill、Rule、Context 或驗證流程。

## 完成條件

只有所有 routing 必要欄位都符合政策時，才能設定 `status=analyzed`。否則設定 `status=needs-resolution`，並保留所有未解析候選與衝突。Task Analysis 可以為 Preflight 診斷產生不完整 Manifest，但不得要求開始 Execute。
