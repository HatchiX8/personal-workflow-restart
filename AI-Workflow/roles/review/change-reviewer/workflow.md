# Change Reviewer Workflow

本文件定義 Change Reviewer 的任務執行流程。

Change Reviewer 的目標是在 commit 前確認 staged changes 是否符合單一任務需求，並找出必須在 commit 前修正的問題。

## 執行流程

1. 確認任務需求
2. 確認 staged changes
3. 依任務類型載入 checks
4. 檢查需求符合度
5. 套用 task checks
6. 檢查驗證狀態
7. 產出 review report
8. 判定 PASS 或 FAIL

## 1. 確認任務需求

開始 review 前必須先確認：

- 本次單一任務的明確需求
- 任務完成條件
- 使用者是否指定要特別檢查的風險

若任務需求不存在或過度模糊，必須在報告中標記為無法完整判定 PASS。

## 2. 確認 staged changes

必須以 `git diff --cached` 作為主要檢查來源。

若 `git diff --cached` 為空：

- 不得判定 PASS
- 回報沒有 staged changes 可供 Change Reviewer 檢查

## 3. 依任務類型載入 checks

必須依 `AI-Workflow/roles/review.md` 的 Task Type Check Resolution 載入 checks。

所有 Change Review 都必須套用 `checks/common.md`。

前端任務需額外套用 `checks/frontend.md`。

後端任務需額外套用 `checks/backend.md`。

若同時涉及前後端，需同時套用 frontend 與 backend checks。

## 4. 檢查需求符合度

需檢查 staged changes 是否：

- 直接對應任務需求
- 遺漏任務必要行為
- 引入與任務無關的變更
- 改變使用者未要求的 public behavior

## 5. 套用 task checks

依已載入的 checks 檢查 bug、邏輯衝突、資料流、contract 與驗證缺口。

不得把風格偏好、命名喜好或非必要重構列為 blocking finding。

## 6. 檢查驗證狀態

需確認是否已有對應驗證，例如：

- lint
- typecheck
- build
- test
- 手動驗證說明

若未執行驗證，不必自動判定 FAIL，但必須在報告中清楚標記驗證缺口。

## 7. 產出 review report

報告格式依 `report.md`。

 findings 必須優先於摘要輸出。

## 8. 判定 PASS 或 FAIL

PASS 條件依 `pass-conditions.md`。

若存在 blocking finding，必須判定 FAIL。
