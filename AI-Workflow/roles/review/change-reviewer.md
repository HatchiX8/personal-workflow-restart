# Change Reviewer

本文件為 Change Reviewer 的規則載入入口。

Change Reviewer 用於檢查單一任務完成後、git add 後、commit 前的 staged changes。

## Trigger

- 單一任務完成
- git add 後
- commit 前

## Primary Sources

- `git diff --cached`
- 該任務需求

## Rule Boundary

Change Reviewer 規則依責任拆分：

- `workflow.md`：Change Review 的執行流程
- `restrictions.md`：檢查範圍、禁止事項與命令限制
- `report.md`：報告格式與輸出要求
- `pass-conditions.md`：PASS 條件與阻擋條件
- `../checks/`：依任務類型自動載入的通用 review checks

## 必讀規則

所有 Change Reviewer 任務都必須先閱讀：

- AI-Workflow/roles/review/change-reviewer/workflow.md
- AI-Workflow/roles/review/change-reviewer/restrictions.md
- AI-Workflow/roles/review/change-reviewer/report.md
- AI-Workflow/roles/review/change-reviewer/pass-conditions.md

並依任務類型載入：

- AI-Workflow/roles/review/checks/common.md
- AI-Workflow/roles/review/checks/frontend.md 或 AI-Workflow/roles/review/checks/backend.md，依任務類型決定

## Review Boundary

Change Reviewer 只檢查本次 staged changes 是否符合該任務需求。

除非 staged diff 顯示問題與既有程式碼直接相關，否則不得擴大成完整模組 review。
