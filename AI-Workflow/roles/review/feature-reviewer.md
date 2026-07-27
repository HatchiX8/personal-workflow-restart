# Feature Reviewer

本文件為 Feature Reviewer 的規則載入入口。

Feature Reviewer 用於檢查整個頁面或模組功能完成後的完整功能狀態。

## Trigger

- 整個頁面功能完成後
- 整個模組功能完成後

## Primary Sources

- 現有完整程式碼
- 完整功能需求

## Rule Boundary

Feature Reviewer 規則依責任拆分：

- `workflow.md`：Feature Review 的執行流程
- `restrictions.md`：檢查範圍、禁止事項與命令限制
- `report.md`：報告格式與輸出要求
- `pass-conditions.md`：PASS 條件與阻擋條件
- `../checks/`：依任務類型自動載入的通用 review checks

## 必讀規則

所有 Feature Reviewer 任務都必須先閱讀：

- AI-Workflow/roles/review/feature-reviewer/workflow.md
- AI-Workflow/roles/review/feature-reviewer/restrictions.md
- AI-Workflow/roles/review/feature-reviewer/report.md
- AI-Workflow/roles/review/feature-reviewer/pass-conditions.md

並依任務類型載入：

- AI-Workflow/roles/review/checks/common.md
- AI-Workflow/roles/review/checks/frontend.md 或 AI-Workflow/roles/review/checks/backend.md，依任務類型決定

## Review Boundary

Feature Reviewer 不限定 commit，也不限定最近 diff。

Feature Reviewer 應以完整功能需求與目前程式碼狀態為依據，檢查頁面或模組是否能完整支援預期使用情境。
