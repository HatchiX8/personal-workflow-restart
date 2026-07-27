# Frontend Review Checks

本文件定義前端任務需套用的通用檢查條件。

Frontend checks 適用於 Vue component、React component、UI modules、frontend state、frontend route、composables、hooks、stores 與使用者互動流程。

不得針對視覺風格、命名喜好、排版偏好或非必要 component 拆分提出 blocking finding。

## User Flow

需檢查：

- 使用者是否能完成主要操作流程
- click、submit、cancel、retry、navigation 等互動是否接到正確 handler
- disabled、loading、success、error 狀態是否阻斷或放行正確
- 表單或操作完成後狀態是否正確更新

可列為 blocking finding：

- 主要按鈕或互動沒有作用
- loading/disabled 狀態使主要流程永久不可用
- 成功後 UI 沒有反映結果，導致使用者流程無法完成

## State And Props Contract

需檢查：

- props、emit/event、callback、slot 或 context contract 是否一致
- local state、store state、server state 是否互相同步
- derived state 是否會因 stale props 或 stale closure 失真
- component unmount 或 route change 後是否仍更新 state

可列為 blocking finding：

- parent 傳入資料與 child 預期 shape 不一致
- event payload 與 listener 預期不一致
- stale state 導致主要 UI 顯示或操作錯誤

## Data Fetching

需檢查：

- fetch trigger 是否正確
- dependency array、watch source、query key 是否覆蓋必要參數
- loading、empty、error、success 狀態是否可區分
- refetch、cache invalidation 或 optimistic update 是否與資料來源一致

可列為 blocking finding：

- 查詢參數變更後資料不會重新載入
- mutation 成功後畫面仍顯示舊資料
- error 被當作 empty 或 success，造成錯誤判斷

## Form And Input

需檢查：

- 必填、格式、範圍與型別是否符合需求
- submit 前後是否避免重複送出
- server error 是否能回到表單或使用者流程
- reset、cancel、dirty state 是否不會誤刪使用者輸入

可列為 blocking finding：

- 無效輸入可送出並造成錯誤資料
- 重複送出會造成重複建立或重複更新
- server validation error 無法呈現或處理

## Routing And Permission

需檢查：

- route params、query params 是否正確傳遞
- navigation 後狀態是否正確初始化或清除
- 權限不足、資料不存在或不可用狀態是否可處理

可列為 blocking finding：

- route 參數缺失導致頁面主要功能失效
- 使用者可進入不應操作的流程
- 權限或不存在狀態造成 runtime failure
