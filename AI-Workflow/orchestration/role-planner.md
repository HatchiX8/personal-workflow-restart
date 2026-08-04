# Role Planner 角色規劃契約

## 責任

Role Planner 位於 Task Analysis 與 Rule Resolution 之間。Dispatcher 依 Task Manifest 的
`role_id` 呼叫該角色的 `roles/<role-id>/planner.md`，並產生符合
`schemas/role-plan.schema.json` 的 Role Plan。

Role Planner 不執行角色工作、不讀取 Skill 規則內容，也不決定規則檔案路徑。

## 輸入

- 已完成且 `status=analyzed` 的 Task Manifest。
- Workflow Config、Project Config 與 Role Registry。
- Task Analysis 已確認的 Project、Module、Target、Scope、Role mode 與明確 Skill ID。
- 只供事實判斷使用的 repository evidence。

## 輸出

Role Plan 必須包含：

- 與 Task Manifest 相同的 `task_id`、`role_id` 與 `action`。
- 實際使用的 `planner_entry`。
- 可供 Registry selector 比對的標準化 facts。
- 由 facts 產生的 `skill_selectors`，不得直接猜測 Skill ID。
- 依 `orchestration.result_reporting` 共用政策產生 `result_reporting`，包含最低回覆層級與理由。
- 本角色需要的 validation profiles 與 Context 類型。
- Planner 無法安全判斷的 unresolved 項目。

使用者明確指定的 Skill ID 保留在 Task Manifest，由 Rule Resolution 驗證；Role Planner
不得替換、修正或產生相似 Skill ID。

## Facts

每個 fact 使用穩定的 `fact_id` 與一個以上的值，例如：

```text
target=frontend
runtime=node-js
framework=vue
risk=layering-change
review-mode=change
analysis-depth=sampled
```

fact 必須包含來源、信心與 evidence。只有高信心事實可用於 conditional Skill 自動載入。

Result Reporting 只能依 Task Manifest、已確認 facts 與使用者對回覆詳細度的自然語意判定。資訊
不足時使用 Level 2，不得猜測為 Level 1；任何 Level 3 條件成立時必須選擇 Level 3。角色 Planner
不得自行建立不同的層級定義。

Planner 應推導能力需求與技術事實，不應知道未來有哪些 Skill。新增 Skill 時，應由 Skill
Manifest selectors 對應既有 facts；不得要求修改 Planner。

## 四個角色

### Developer

推導 Task Type、Target、Runtime、Framework、Architecture／Migration risk、Scope mode、
Validation needs 與 Project／Module Context requirements。

### Review

推導 Review mode、Evidence source、Target、Scope、Requirement coverage 與 Check profile。

### Project Analyst

推導分析範圍、分析深度、專案型態訊號、取樣需求與輸出 profile。

### Module Analyst

推導唯一 Module、Target、Boundary、Data Flow／Contract 分析需求與輸出 profile。

## 禁止事項

- 不得重新選擇 Role 或改變 Action。
- 不得讀取或執行 Skill 的 `rules.md`。
- 不得以檔名猜測 Skill。
- 不得建立另一套 precedence、dependency 或 conflict 規則。
- 不得降低共用 Result Reporting 政策要求的最低層級。
- 不得開始修改、Review 或分析專案。
- 不得將低信心推論轉成自動載入 selector。

## 狀態

- `planned`：所有必要 facts 已解析，可進入 Rule Resolution。
- `needs-resolution`：存在必要 unresolved，Dispatcher 必須停止或要求補充。

Rule Resolution 必須同時接收 Task Manifest 與 Role Plan。兩者的 Task ID、Role 與 Action
不一致時必須阻擋。
