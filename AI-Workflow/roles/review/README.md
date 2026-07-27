# Review Role Rules

本資料夾提供 Review 角色的 AI Agent review 規則基底。

Review 負責在任務完成或功能完成後進行獨立檢查。

Review 不負責直接開發新功能、重構或替代 Developer 完成實作。

## 使用方式

- 入口規則使用 `AI-Workflow/bootstrap.md`
- Review 角色入口使用 `AI-Workflow/roles/review.md`
- Review 細部規則放在 `AI-Workflow/roles/review/`
- Report 預設輸出到 `AI-Workflow/reviews/`

## Prompt 指定角色

使用 Review 角色時，任務 prompt 建議明確指定：

```txt
角色：Review
Reviewer：Change Reviewer
任務類型：前端任務

本次任務：
檢查目前 staged changes 是否可 commit。
```

或：

```txt
角色：Review
Reviewer：Feature Reviewer
任務類型：後端任務

本次任務：
檢查會員 API 模組是否符合完整功能需求。
```

## Reviewer 類型

### Change Reviewer

使用情境：

- 單一任務完成
- git add 後
- commit 前

主要依據：

- `git diff --cached`
- 該任務需求

規則入口：

- `AI-Workflow/roles/review/change-reviewer.md`

細部規則：

- `AI-Workflow/roles/review/change-reviewer/workflow.md`
- `AI-Workflow/roles/review/change-reviewer/restrictions.md`
- `AI-Workflow/roles/review/change-reviewer/report.md`
- `AI-Workflow/roles/review/change-reviewer/pass-conditions.md`

### Feature Reviewer

使用情境：

- 整個頁面功能完成後
- 整個模組功能完成後

主要依據：

- 現有完整程式碼
- 完整功能需求

限制：

- 不限定 commit
- 不限定最近 diff

規則入口：

- `AI-Workflow/roles/review/feature-reviewer.md`

細部規則：

- `AI-Workflow/roles/review/feature-reviewer/workflow.md`
- `AI-Workflow/roles/review/feature-reviewer/restrictions.md`
- `AI-Workflow/roles/review/feature-reviewer/report.md`
- `AI-Workflow/roles/review/feature-reviewer/pass-conditions.md`

## 任務類型 Checks

Review 會依任務類型自動載入 checks，不需要使用者指定 checks 檔案。

- 所有 Review：讀取 `AI-Workflow/roles/review/checks/common.md`
- 前端任務：額外讀取 `AI-Workflow/roles/review/checks/frontend.md`
- 後端任務：額外讀取 `AI-Workflow/roles/review/checks/backend.md`

checks 第一版只檢查：

- 需求落差
- bug
- 邏輯衝突
- 資料流破壞
- contract 不一致
- error handling 問題
- 驗證缺口

checks 不針對風格偏好、命名喜好、排版偏好或非必要重構提出 blocking finding。

## Report 輸出

Review 預設必須產出 markdown report。

若使用者指定輸出位置，必須寫入指定位置。

若未指定輸出位置，依 reviewer 類型寫入：

- Change Reviewer：`AI-Workflow/reviews/change/<YYYYMMDD-HHmm>-<task-slug>.md`
- Feature Reviewer：`AI-Workflow/reviews/feature/<YYYYMMDD-HHmm>-<feature-slug>.md`

若使用者明確表示不用落檔、只要在對話中回報，才可不寫入 report 檔案。

## 規則修改原則

- Review 角色入口修改：`AI-Workflow/roles/review.md`
- Change Reviewer 載入入口修改：`AI-Workflow/roles/review/change-reviewer.md`
- Feature Reviewer 載入入口修改：`AI-Workflow/roles/review/feature-reviewer.md`
- Change Reviewer 流程、限制、報告格式、PASS 條件修改：`AI-Workflow/roles/review/change-reviewer/`
- Feature Reviewer 流程、限制、報告格式、PASS 條件修改：`AI-Workflow/roles/review/feature-reviewer/`
- 任務類型通用檢查修改：`AI-Workflow/roles/review/checks/`
