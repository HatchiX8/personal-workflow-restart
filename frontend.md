# Frontend Rules

## TypeScript Rules

- 不允許使用 any
- 所有 props 必須定義型別
- 所有 emit 必須定義型別

## Vue Rules

- 使用 Composition API
- 使用 script setup
- 禁止直接修改 props

## Architecture Rules

### views
- 負責頁面組裝
- 不處理複雜商業邏輯

### stores
- 管理業務狀態
- 不處理 UI 行為
- 禁止繞過既有 state 管理流程
- component 不允許直接修改 store 資料，應透過既有 action / method 更新狀態

### composables
- 管理共用邏輯
- 不直接依賴頁面

### services
- 專注 API 呼叫
- 不處理畫面狀態
- API 層不得處理 UI 邏輯

### components
- 共用元件禁止耦合業務邏輯
- 禁止 UI component 直接處理商業邏輯
- 禁止在 component 內直接呼叫 API

## Naming Rules

- composables 使用 use 開頭
- store 使用 useXXXStore
- 型別使用 PascalCase
- enum 使用大寫
- Boolean 使用 is / has / can 開頭

## Frontend Review Checklist

- 是否出現 any
- 是否直接修改 props
- component 是否直接呼叫 API
- component 是否處理過多商業邏輯
- store 是否處理 UI 行為
- composable 是否直接依賴頁面
- 是否有巨型 component
- 是否已執行 TypeScript typecheck
