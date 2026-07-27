# Feature Reviewer Workflow

本文件定義 Feature Reviewer 的任務執行流程。

Feature Reviewer 的目標是在整個頁面或模組功能完成後，確認目前完整程式碼是否支援完整功能需求與主要使用情境。

## 執行流程

1. 確認完整功能需求
2. 確認 review 範圍
3. 依任務類型載入 checks
4. 建立功能路徑與程式碼地圖
5. 檢查需求覆蓋
6. 套用 task checks
7. 檢查邊界情境與驗證狀態
8. 產出 review report
9. 判定 PASS 或 FAIL

## 1. 確認完整功能需求

開始 review 前必須先確認：

- 頁面或模組的完整功能需求
- 主要使用者流程
- 必要狀態與邊界情境
- 使用者指定的完成標準

若完整功能需求不存在，必須在報告中標記無法完整判定 PASS。

## 2. 確認 review 範圍

需明確界定：

- 要 review 的頁面、模組或功能區
- 主要入口檔
- 相關 component、hook、store、service、API 或 test
- 不在本次 review 範圍內的內容

## 3. 依任務類型載入 checks

必須依 `AI-Workflow/roles/review.md` 的 Task Type Check Resolution 載入 checks。

所有 Feature Review 都必須套用 `checks/common.md`。

前端任務需額外套用 `checks/frontend.md`。

後端任務需額外套用 `checks/backend.md`。

若同時涉及前後端，需同時套用 frontend 與 backend checks。

## 4. 建立功能路徑與程式碼地圖

Feature Reviewer 可閱讀完整功能所需的現有程式碼。

閱讀重點：

- 使用者入口
- 狀態與資料流
- API 或 service interaction
- error、loading、empty、permission 等狀態
- tests 或驗證方式

## 5. 檢查需求覆蓋

需檢查每個功能需求是否：

- 有對應實作
- 有可完成的使用者流程
- 有必要的資料狀態處理
- 未被其他邏輯覆蓋或破壞

## 6. 套用 task checks

依已載入的 checks 檢查 bug、邏輯衝突、資料流、contract 與驗證缺口。

不得把風格偏好、命名喜好或非必要重構列為 blocking finding。

## 7. 檢查邊界情境與驗證狀態

需檢查：

- loading、empty、error、success 狀態
- invalid input 或 edge cases
- 權限或不可用狀態
- 已執行或缺少的驗證

## 8. 產出 review report

報告格式依 `report.md`。

 findings 必須優先於摘要輸出。

## 9. 判定 PASS 或 FAIL

PASS 條件依 `pass-conditions.md`。

若存在 blocking finding，必須判定 FAIL。
