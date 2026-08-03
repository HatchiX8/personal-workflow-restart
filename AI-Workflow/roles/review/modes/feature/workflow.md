# Feature Review Workflow

本 mode 依 `roles/review/workflow.md` 執行，並提供下列階段差異。

## Confirm Scope

- 確認完整功能需求、主要使用者流程、必要狀態、邊界情境與完成標準。
- 界定頁面、模組、入口與不在本次 Review 的內容。

## Collect Evidence

- 建立完整功能路徑與程式碼地圖。
- 讀取核准 Scope 內的 component、hook、store、service、API、types、schema 與 tests。
- 檢查使用者入口、狀態、資料流、API interaction 及 loading／empty／error／permission。

## Apply Checks

- 確認每個需求具有對應實作、可完成的使用者流程與必要資料狀態。
- 檢查需求是否被其他邏輯覆蓋或破壞。

## Validate

- 檢查必要邊界情境與已執行或缺少的驗證。
