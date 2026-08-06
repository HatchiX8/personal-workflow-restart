# Risk Assessment 任務風險評估契約

## 責任

Risk Assessment 將已分析的 Task Manifest 轉換為符合 `schemas/task-risk.schema.json` 的獨立
`Task Risk Assessment`。它只依 `policies/task-risk.md` 分類任務風險，不選擇或修改 Role、Skill、
Rule、Context、Execution Profile，也不執行角色工作。

Task Risk Assessment 是新的不可變產物，不得寫回或擴充 Task Manifest。

## 輸入

- 符合 `schemas/task-manifest.schema.json` 且 `status=analyzed` 的不可變 Task Manifest。
- `workflow.config.json` 設定的 `orchestration.task_risk_policy`。
- Workflow Config 中已驗證的 confidence policy。

Task Manifest 的 `task_id` 必須保留到輸出。Manifest 不符合 Schema、狀態不是 `analyzed`，或必要
provenance 缺少時，Risk Assessment 不得推測修復，也不得開始 Profile Resolution。

## 允許使用的證據

只允許使用 Task Manifest 已確認的下列資料：

- `task_type`、`target_mode`、`targets`、`modules` 與 `scope`。
- 已正規化的 `routing_triggers`。
- 上述欄位在 Manifest 中既有的 `provenance`、confidence、evidence 與 candidates。

不得重新解讀 `raw_request`，不得讀取 project／application 檔案、README、Role Planner、Role／Skill
規則或 Registry 內容，也不得由 Role ID、Skill ID 或檔名推導風險。Role／Skill 是否明確指定不會
降低任務風險。

Risk Assessment 不另建第二套 provenance。`risk_facts` 保存正規化事實，`reasons` 以穩定且可追溯
的字串指出來源欄位或 trigger，例如 `task_type=migration`、`target_mode=fullstack`、
`routing_trigger=authentication`。

## Scope 正規化

依下列優先順序產生 `scope_mode`：

1. `scope.change_source=full-project` 或等價 canonical trigger 時為 `full-project`。
2. 已確認包含多個 Module，或存在 `scope=cross-module` trigger 時為 `cross-module`。
3. 已確認唯一 Module，或存在 `scope=module` trigger 時為 `module`。
4. 只有存在高信心 `scope=file` trigger 或等價 Manifest provenance 時才為 `file`。
5. 無法由結構化證據唯一判斷時為 `unknown`，不得解析 `scope.summary` 的自由文字補猜。

`target_mode` 與 `task_type` 必須直接複製 Task Manifest 的 canonical 值，不得重新分類。

## Hard trigger 正規化

將 Task Manifest 中已確認的 canonical 欄位與 routing trigger 對應到
`schemas/task-risk.schema.json` 定義的 hard trigger ID。至少包含：

- `scope_mode=cross-module|full-project`。
- `target_mode=fullstack|mixed`。
- `task_type=migration`。
- Architecture、database／data migration、authentication／authorization／security、payment、公開
  契約、production／infrastructure、破壞性操作、外部寫入及 Workflow 治理核心變更。

只有具高信心 provenance 的事實才能成為已確認 hard trigger。候選存在但信心不足，或候選差距低於
confidence policy 時，必須加入 `unresolved`，並依疑似高風險政策保守輸出 Level 3。

## 判定演算法

1. 驗證 Task Manifest Schema、`status=analyzed`、Task ID 與必要 provenance。
2. 正規化 `scope_mode`，直接複製 `target_mode` 與 `task_type`。
3. 從已確認欄位及 routing triggers 建立去重後的 `risk_facts` 與 `hard_triggers`。
4. 先套用所有 Level 3 hard trigger；`hard_triggers` 非空時必須為 `level=3`。
5. 沒有 hard trigger 時，只有完整符合 Task Risk 政策的限定問答或微小修改才能為 `level=1`。
6. 其餘任務為 `level=2`。多個事實對應不同層級時採最高風險勝出。
7. `confidence` 使用所有實際驅動判定之證據 confidence 的最低值。無可驗證信心來源時不得宣告高
   信心；必須加入 unresolved。
8. 若缺少的事實可能改變層級，設定 `status=needs-resolution`；否則設定 `status=assessed`。

一般資訊不足輸出保守 `level=2`；疑似 Level 3 領域但無法確認或排除時輸出保守 `level=3`。這個
level 是安全下限，不代表 `needs-resolution` 已取得執行准入。

## 輸出

輸出必須包含：

- `schema_version`、原 Task Manifest 的 `task_id` 與 `assessed_at`。
- `level`、`confidence`、`scope_mode`、`target_mode` 與 `task_type`。
- 去重後的 `risk_facts`、`hard_triggers` 與至少一個 `reasons`。
- 固定為 `true` 的 `upward_escalation`。
- `status` 與 `unresolved`。

`status=assessed` 時 `unresolved` 必須為空。`status=needs-resolution` 時 `unresolved` 至少包含一個
穩定診斷 ID。Risk Assessment 不得在輸出中加入 Role、Skill、Rule、Context 或 Profile 欄位。

## 下游契約

Execution Profile Resolver 必須同時驗證 Task Manifest 與 Task Risk Assessment 的 `task_id` 一致，
且風險狀態可供安全分流。Result Reporting 可以消費相同 Task Risk Assessment，但只控制完成回覆，
不得修改風險產物或執行 Profile。

後續階段若發現較高風險事實，必須回傳 `reroute-required`。Risk Assessment 只能產生新的較高層級
產物；不得就地降低已核准層級。
