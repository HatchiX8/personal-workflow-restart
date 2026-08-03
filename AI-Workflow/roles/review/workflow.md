# Review 工作流程

所有 Review 任務依序執行下列固定流程。Change 與 Feature mode 只能補充每個階段的 Scope 與
Evidence 差異，不得替換或重新排序。

## 1. Confirm Scope

- 確認需求、Review mode、Scope 與完成判定依據。
- 套用已選 mode 的 Scope 規則。

## 2. Collect Evidence

- 依 mode workflow 收集 staged changes 或完整功能程式碼。
- 只使用角色限制允許的唯讀命令。

## 3. Apply Checks

- 所有 Review 套用 `checks/common.md`。
- Target Check 只能來自 Resolved Rule Set 已選 Review Skill。
- 不得在 Execute 階段補載或推測 Check Skill。

## 4. Classify Findings

- 依 `restrictions.md` 與 mode restrictions 區分 blocking findings、risks 與 suggestions。
- 每個 finding 必須具有 Evidence、Impact 與最小必要修正方向。

## 5. Validate

- 確認既有測試與可用驗證結果。
- 未執行或無法確認的驗證必須明確標記。

## 6. Decide

- 依 `pass-conditions.md` 與 mode pass conditions 判定 PASS 或 FAIL。
- Review 不使用 Conditional PASS。

## 7. Report

- 依 `output.md`、共用 report policy 與 mode report 規則產出中文報告。
- findings 必須優先於摘要。
