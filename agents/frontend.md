# Frontend Rules

本文件定義前端開發時的通用規範。

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

## UI / Style Rules

### Styling Strategy

- 優先沿用專案現有樣式方案，不主動引入新的 UI / CSS 套件。
- 修改畫面前，必須先確認專案目前使用的樣式方式：
  - UnoCSS
  - Tailwind CSS
  - SCSS / CSS Modules
  - 一般 CSS / scoped CSS
  - Naive UI / Element Plus / Ant Design Vue 等 UI library
- 若專案已使用 UnoCSS，新增或調整樣式時優先使用 UnoCSS atomic class。
- 若專案未使用 UnoCSS，禁止自行新增 UnoCSS 設定或安裝套件。
- 若專案已使用 Naive UI，優先使用既有 Naive UI 元件完成 UI。
- 若專案未使用 Naive UI，禁止自行安裝或引入 Naive UI。
- 若專案已有共用元件，優先使用既有共用元件，不重複建立相同用途元件。
- 若專案已有 icon 套件或 icon component，優先沿用既有 icon 實作。
- 禁止為單一需求新增新的 UI library、icon library 或 CSS framework。

### UI Migration Rules

- 搬移或重構 UI 時，一次只處理一個區塊或一個元件。
- 不得同時進行「搬移結構、改寫樣式、重構邏輯、調整響應式」。
- 若需要從 CSS 改為 atomic class，必須逐步轉換，並保持原本版面比例、間距、字級與互動狀態。
- 不得因樣式重構改變原有資料流、API 呼叫、store 使用方式或事件名稱。
- 若樣式來源不明，應先回報目前偵測到的樣式方案，再進行修改。
