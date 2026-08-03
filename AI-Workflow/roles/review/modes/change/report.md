# Change Review Report

本 mode 同時遵守 `roles/review/output.md` 與 `policies/report-file-policy.md`。

## 預設檔案

```text
AI-Workflow/reviews/change/<YYYYMMDD-HHmm>-<task-slug>.md
```

- task slug 由任務名稱或 staged changes 的主要目的產生。
- 無法安全產生 slug 時使用 `change-review`。

## Mode 專屬區塊

```text
## Scope Check

- Staged changes source: git diff --cached
- Task requirement checked: yes | no | partial
- Unrelated staged changes: none | found | unknown
```

Blocking Finding 的 Evidence 必須提供檔案路徑或 staged diff reference，Impact 必須說明為何
commit 前必須修正。
