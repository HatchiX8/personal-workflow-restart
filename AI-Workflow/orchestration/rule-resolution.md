# Rule Resolution 規則推導契約

## 責任

Rule Resolution 將 Task Manifest、Task Risk、Execution Profile Contract 與 Role Plan 轉換為符合
`schemas/resolved-rule-set.schema.json` 的 `Resolved Rule Set`。它只能選取 Registry 已登錄的規則與
Context，不得檢查 README 來做 routing、重新解讀原始需求、重算風險、替換 Profile 或執行工作。

## 輸入與允許使用的來源

- 不可變的 Task Manifest。
- `status=assessed` 的不可變 Task Risk Assessment。
- `status=selected` 的不可變 Execution Profile Contract。
- 符合 `schemas/role-plan.schema.json` 的不可變 Role Plan。
- `registry/roles.json`、`registry/skills.json`、`registry/rule-bundles.json` 與 `registry/modules.json`。
- 用於 Project 身分與 Context policy 的 Project Config。
- 只有 Registry 路徑已完成選取後，才能讀取檔案 bytes，且用途僅限計算 content hash。

禁止使用 `documentation_files`、README 內容、未知檔案或 filesystem 檔名相似度作為 routing 來源。

## 選取演算法

1. Task Manifest、Task Risk、Execution Profile 與 Role Plan 必須具有相同 Task ID；Manifest 與 Role
   Plan 的 Role、Action 必須一致，Task Risk 與 Profile 的風險層級及確定性映射必須一致，且 Role
   Plan 必須為 `status=planned`。
2. 必須存在 active `role_id`；否則輸出 `status=incomplete` 與 `role-unresolved`。
3. 選取 Role 的 `required_bundle_ids`，再遞迴選取其 Registry dependency。
4. Optional bundle 與 Skill selectors 只能根據已正規化的 Manifest 欄位及 Role Plan 高信心 facts 判斷。Skill 進入 selector 候選集合前，`skill.role_id` 必須精確等於 Task Manifest 與 Role Plan 的 `role_id`；其他角色 Skill 必須直接排除。
5. Registry 登錄的 standalone rule 只有在 trigger 可確定成立時才能加入。
6. 明確 `skill_ids` 必須以精確 Skill ID 解析，不得使用 alias，且 `skill.role_id` 必須等於目前 Role；不相容時輸出 `skill-role-incompatible:<skill-id>`。Conditional Skill 必須由 Role Plan 的高信心 `skill_selectors` 完整符合 Skill Manifest selectors；`manual_review`、`deprecated` 與 `legacy` Skill 永遠不得自動載入。
7. 每個已選 Skill 都必須使用 Registry 路徑、dependency 與數值 `precedence` 建立 Rule Set rule，不得從 Skill 名稱推導路徑。
8. 使用已驗證的 Project 身分、Module 候選、Targets、任務風險事實與 Context policy 呼叫 `context-resolution.md`。Rule Set 只能加入該契約回傳的 Context record、required flag、reason 與 diagnostic。Timestamp 順序永遠不得作為選取規則。
9. 依 `rule_id` 去重、遞迴解析 inclusion dependency，並偵測循環。Skill 可以依賴同角色 Skill 或 Common Rule；若 Skill dependency 指向其他角色 Skill，輸出 `skill-dependency-role-incompatible:<skill-id>:<dependency-id>`。`load_order` 必須使用確定性的 topological order 計算；只有同時 ready 的節點才能依 rule ID 決定先後。`precedence_rank` 只保留供衝突裁決，不得影響 inclusion 或 `load_order`。

每個已選項目都必須有可供工程師閱讀的 `reason`，例如 `role=developer selected developer.base` 或 `explicit skill developer.language.typescript`。`registry_source` 必須指出實際使用的 Registry record。README 一律是工程文件，不得納入 Rule Set 或參與 routing。

## Execution Profile 模式

- `lightweight`：只使用 Role required bundle、明確 Skill、它們的 dependency，以及 trigger 已由
  Manifest 高信心確認的必要安全規則。不得依 repository evidence 新增 fact 或自動載入需要額外
  Role-specific 推導的 conditional Skill。
- `standard`：使用本契約既有 selector 演算法，但候選只限目前 Role、Project、唯一 Module、Target
  與高信心 facts 命中的項目；這是現有 targeted selection，不得弱化 dependency、conflict、hash、
  Context required policy 或 precedence。
- `full`：完整執行本契約所有選取、dependency、Context、hash 與凍結步驟。

Profile 只限制候選來源與解析深度，不得略過 Role required bundle、必要 dependency、衝突檢查、
路徑驗證、hash、fingerprint 或 required Context。若目前 Profile 無法安全產生完整 Rule Set，輸出
`status=incomplete` 與 `profile-escalation-required`，不得在 Resolver 內自行升級。

## Hash 與凍結

- `content_hash` 為 `sha256:` 加上所選 UTF-8 檔案 bytes 的 SHA-256。
- 使用 stable-key JSON serialization 將 Resolved Rule Set canonicalize；rules 依 `load_order` 排序，contexts 依 `context_id` 排序。
- `fingerprint` 是 canonical payload 的 SHA-256；payload 不包含 `generated_at`、`fingerprint` 與暫時性 diagnostic 文字。
- 任一已選檔案不存在、無法讀取或內容變更，都會使 Rule Set 成為 incomplete。Preflight 必須在允許執行前重新計算 hash。

Bootstrap 與 orchestration contract 不加入 executable rules；它們透過 execution envelope 中的 Workflow version 識別。

## 推導不完整

若 Task Risk／Profile 缺少或不一致、Role Plan 缺少／不一致、Role 未知、缺少必要 bundle／rule／Skill、dependency 發生循環、必要 selector 信心不足，或必要 Context 無法唯一選取，必須設定 `status=incomplete` 並保留 `unresolved`。不得用文件、名稱相似的規則或未追蹤的 Context 候選替代。
