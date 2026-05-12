# 架構規則

## views
- 負責頁面組裝
- 不處理複雜商業邏輯

## stores
- 管理業務狀態
- 不處理 UI 行為

## composables
- 管理共用邏輯
- 不直接依賴頁面

## services
- 專注 API 呼叫
- 不處理畫面狀態