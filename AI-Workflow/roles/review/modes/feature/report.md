# Feature Review Report

本 mode 同時遵守 `roles/review/output.md` 與 `policies/report-file-policy.md`。

## 預設檔案

```text
AI-Workflow/reviews/feature/<YYYYMMDD-HHmm>-<feature-slug>.md
```

- feature slug 由頁面、模組、功能名稱或 Review Scope 產生。
- 無法安全產生 slug 時使用 `feature-review`。

## Mode 專屬區塊

```text
## Requirement Coverage

- Covered: <已確認覆蓋的需求>
- Missing: <缺少或未確認的需求>
- Unknown: <需求不明或需要人工確認的部分>

## Scope

- Feature/page/module reviewed: <範圍>
- Primary sources: <主要檔案或資料夾>
- Out of scope: <不在本次 Review 的範圍>
```

Blocking Finding 必須提供對應 Requirement、檔案／程式碼 Evidence，以及功能不能視為完成的
Impact。
