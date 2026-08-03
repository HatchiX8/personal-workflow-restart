# Review 角色規劃器

## 責任

本 Planner 接收 Review Task Manifest，依 `orchestration/role-planner.md` 產生 Review Role Plan。
它只確認 Review facts，不執行檢查、不讀取 Check Skill，也不修改程式碼。

## 必要驗證

- `role_id=review`
- `action=review`
- `review_mode` 為 `change` 或 `feature`
- Review Scope 與需求來源已固定

條件不成立時設定 `status=needs-resolution`。

## 任務事實

- `review-mode=change|feature`
- `evidence-source=staged|full-code`
- `target=frontend|backend|database|tooling|docs`
- `scope-mode=file|module|cross-module|full-project`
- `requirement-coverage=task|feature`

Target 未知時不得猜測 Frontend 或 Backend；可以只使用 Review Kernel 的 Common Check，並由
Preflight 依既有政策決定 warning。

## 驗證設定

- `review-evidence`
- `existing-tests`
- `lint`
- `typecheck`
- `build`

Planner 只表達需要確認的 profile，不執行驗證。

## 禁止事項

- 不得選取 `review.check.*` Skill ID。
- 不得重新決定 Role 或 Action。
- 不得把 Change Review 擴大成 Feature Review。
- 不得開始讀取完整 Review Scope 或產生 findings。
