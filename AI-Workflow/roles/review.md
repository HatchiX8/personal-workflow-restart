# Review Role Rules

本文件為 Review 角色的規則載入入口。

Review 負責在不同完成階段檢查變更品質、需求符合度與風險，不負責直接開發新功能、重構或替代 Developer 完成實作。

## Role Scope

Review 目前拆分為兩個 reviewer：

- Change Reviewer：檢查單一任務完成後、git add 後、commit 前的 staged changes
- Feature Reviewer：檢查整個頁面或模組功能完成後的完整功能狀態

## Rule Boundary

本角色規則依 reviewer 類型拆分：

- `review.md`：Review 角色入口、載入規則、規則優先級
- `review/change-reviewer.md`：Change Reviewer 的載入入口
- `review/change-reviewer/`：Change Reviewer 的細部流程、限制、報告格式與 PASS 條件
- `review/feature-reviewer.md`：Feature Reviewer 的載入入口
- `review/feature-reviewer/`：Feature Reviewer 的細部流程、限制、報告格式與 PASS 條件
- `review/checks/`：依任務類型自動載入的通用 review checks
- `reviews/`：Review report 的預設輸出位置

目前使用 reviewer 入口 md 搭配同名資料夾拆分細部規則。

不拆分 `skills/`。

Review 的 Change Reviewer 與 Feature Reviewer 是角色執行模式，不是可選技能。

任務類型檢查屬於 Review 的基礎條件規則，放在 `review/checks/`。

若未來需要新增 security、performance、accessibility、database migration 等使用者可明確指定的專門 review 模式，才新增 `review/skills/`。

## Rule Bootstrap

若解析後的 AI Workflow Root 不存在 `roles/review/`：

- 停止 Review 任務執行
- 不得自行推測 Review 規則
- 不得使用模型預設 review 行為替代缺少的規則
- 回報缺少 Review 規則環境

若必要 reviewer 規則檔案不存在：

- 停止 Review 任務執行
- 列出缺少的 Review 規則檔案
- 不得以其他 reviewer 規則替代

若必要 task checks 檔案不存在：

- 停止 Review 任務執行
- 列出缺少的 checks 檔案
- 不得以模型預設檢查替代

## Reviewer Resolution

每次 Review 任務都必須先判斷 reviewer 類型。

判斷流程：

1. 若任務明確指定 `Change Reviewer`，讀取 `AI-Workflow/roles/review/change-reviewer.md`。
2. 若任務明確指定 `Feature Reviewer`，讀取 `AI-Workflow/roles/review/feature-reviewer.md`。
3. 若任務情境為單一任務完成、git add 後、commit 前，預設使用 Change Reviewer。
4. 若任務情境為整個頁面或模組功能完成後，預設使用 Feature Reviewer。
5. 若 reviewer 類型無法判斷，停止 Review 任務並要求明確指定。

## Task Type Check Resolution

每次 Review 任務都必須依任務類型載入 checks。

使用者不需要指定 checks 檔案；Review 需依任務類型自動判斷。

判斷流程：

1. 所有 Review 任務都必須讀取 `AI-Workflow/roles/review/checks/common.md`。
2. 若任務明確指定為前端任務，或 review 範圍主要涉及 Vue component、React component、UI modules、frontend state、frontend route，讀取 `AI-Workflow/roles/review/checks/frontend.md`。
3. 若任務明確指定為後端任務，或 review 範圍主要涉及 API、database、service logic、backend job、server route，讀取 `AI-Workflow/roles/review/checks/backend.md`。
4. 若任務同時涉及前端與後端，必須同時讀取 frontend 與 backend checks。
5. 若任務類型無法判斷，至少讀取 common checks，並在 report 中標記 task type unknown。

第一版 checks 只檢查 bug、邏輯衝突、資料流、contract、驗證缺口。

不得針對風格偏好、命名喜好或非必要重構提出 blocking finding。

## Report Output

Review 預設必須產出 markdown report。

report 必須使用 UTF-8 編碼。

report 內容必須以中文呈現；程式碼識別字、檔案路徑、指令、API 欄位名稱與錯誤訊息可保留原文。

若使用者指定輸出位置，必須寫入指定位置。

若使用者未指定輸出位置，依 reviewer 類型寫入：

- Change Reviewer：`AI-Workflow/reviews/change/<YYYYMMDD-HHmm>-<task-slug>.md`
- Feature Reviewer：`AI-Workflow/reviews/feature/<YYYYMMDD-HHmm>-<feature-slug>.md`

若使用者明確表示不用落檔、只要在對話中回報，才可不寫入 report 檔案。

report 檔名應使用：

- timestamp：本地時間 `YYYYMMDD-HHmm`
- slug：由任務名稱、功能名稱或 review 範圍產生的短名稱

若無法安全產生 slug，使用：

- Change Reviewer：`change-review`
- Feature Reviewer：`feature-review`

report 輸出資料夾不存在時，Review 可建立必要資料夾。

## 必讀規則

所有 Review 任務都必須先閱讀：

- AI-Workflow/roles/review/change-reviewer.md 或 AI-Workflow/roles/review/feature-reviewer.md

對應 reviewer 入口檔會再載入其細部規則。

所有 Review 任務也必須依任務類型載入：

- AI-Workflow/roles/review/checks/common.md
- AI-Workflow/roles/review/checks/frontend.md 或 AI-Workflow/roles/review/checks/backend.md，依任務類型決定

## Supported Reviewer

### Change Reviewer

觸發時機：

- 單一任務完成
- git add 後
- commit 前

主要依據：

- `git diff --cached`
- 該任務需求

### Feature Reviewer

觸發時機：

- 整個頁面或模組功能完成後

主要依據：

- 現有完整程式碼
- 完整功能需求

限制：

- 不限定 commit
- 不限定最近 diff

## 規則優先級

規則衝突時，依以下優先級處理：

1. 明確指定的 reviewer 資料夾規則
2. AI-Workflow/roles/review/checks/*.md
3. AI-Workflow/roles/review/change-reviewer.md 或 AI-Workflow/roles/review/feature-reviewer.md
4. AI-Workflow/roles/review.md

## 未知情況處理

若 Review 規則未明確定義：

- 優先依任務需求判斷
- 優先標記風險而非直接改寫
- 不主動擴大檢查範圍
- 不主動修改程式碼
- 輸出需區分明確問題、風險與建議
