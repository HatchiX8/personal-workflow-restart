# Frontend Rules

本文件定義前端開發時的通用規範。

本文件分為：

- Universal Frontend Rules：所有前端任務皆適用
- Framework-specific Rules：依專案框架套用
- Language-specific Rules：依專案語言套用
- Architecture Rules：依既有專案分層套用
- UI / Style Rules：所有 UI 任務皆適用
- Frontend Review Checklist：任務完成後檢查

若專案技術棧未明確符合某一節規則，不得強行套用該節規則。

---

## Universal Frontend Rules

- UI 與商業邏輯必須分離。
- 不允許破壞既有資料流。
- 優先維持既有架構、命名、資料流與狀態管理方式。
- 優先採用最小影響修改。
- 不主動新增抽象層。
- 不主動進行大型重構。
- 不主動移動資料夾或重新命名檔案。
- 不得為單一需求新增新的 UI library、icon library 或 CSS framework。
- 不得刪除既有功能。
- 不得未經任務明確要求變更既有 public API。
- 共用 UI component 不應耦合特定業務邏輯。
- component 不應處理複雜商業邏輯。
- component 不應直接呼叫 API，除非專案既有架構明確允許。
- API 呼叫、資料轉換、狀態管理、畫面呈現應維持清楚責任邊界。
- 若既有專案已經有一致模式，優先遵守既有模式，而不是套用通用偏好。

---

## Framework-specific Rules

### Vue Rules

適用於 Vue 專案。

- 優先使用 Composition API。
- 若專案已使用 `script setup`，新增或修改 component 時應沿用 `script setup`。
- 禁止直接修改 props。
- props 應透過 emit、callback、store action 或既有資料流更新。
- composable 應管理可重用邏輯，不直接依賴特定頁面。
- composable 命名使用 `use` 開頭。
- 若專案使用 Pinia，store 命名優先使用 `useXXXStore`。
- component 不應直接修改 store state，應透過既有 action / method 更新狀態。
- emit event 名稱不得任意變更，避免破壞父子元件資料流。

### React Rules

適用於 React 專案。

- 優先使用 function component。
- hooks 必須遵守 React hooks rules。
- 禁止直接修改 props。
- props 更新應透過 callback、state setter、context action、store action 或既有資料流。
- 共用邏輯優先抽出為 custom hook。
- custom hook 命名使用 `use` 開頭。
- component 不應混入 API 呼叫、資料轉換與複雜商業邏輯，除非專案既有架構如此設計。
- state 應放在最接近實際使用範圍的位置。
- 避免不必要的全域狀態。
- effect 應有明確依賴，不得用來掩蓋資料流問題。
- 不得為了消除 dependency warning 任意移除 dependency。
- callback、memo、memoized value 僅在有實際效益或既有風格要求時使用。

---

## Language-specific Rules

### TypeScript Rules

適用於 TypeScript 專案。

- 不允許使用 `any`，除非有明確理由並以註解說明。
- 所有 props 必須定義型別。
- event、emit、callback payload 必須定義型別。
- API response、store state、重要資料結構應有明確型別。
- 型別命名使用 PascalCase。
- Boolean 命名優先使用 `is` / `has` / `can` 開頭。
- enum 或常數集合依專案既有慣例命名。
- 不得使用型別斷言掩蓋資料結構不明確的問題。
- 涉及 TypeScript / Vue / React 前端邏輯時，完成後應執行 typecheck。

### JavaScript Rules

適用於 JavaScript 專案。

- 不要求 TypeScript typecheck。
- 複雜資料結構應透過清楚命名、JSDoc、schema、validator 或既有專案模式補足可讀性。
- props、callback、API response 的資料形狀需能從命名、註解或既有結構理解。
- 禁止以語意不明的鬆散物件傳遞重要資料。
- 避免使用隱式型別轉換處理重要邏輯。
- 若專案已有 JSDoc 或 runtime validation 慣例，新增或修改程式碼應沿用。
- 若專案有 lint，完成後應執行 lint。

---

## Architecture Rules

### views / pages

- 負責頁面組裝。
- 不處理複雜商業邏輯。
- 不直接實作可重用業務規則。
- 可負責組合 layout、區塊、資料來源與事件流。
- 若頁面邏輯變複雜，應優先抽至 composable、hook、store 或 service，但不得過度抽象化。

### components

- 負責 UI 呈現與局部互動。
- 共用元件禁止耦合特定業務邏輯。
- 禁止 UI component 直接處理複雜商業邏輯。
- 禁止 UI component 直接呼叫 API，除非專案既有模式允許。
- component props 應保持語意清楚。
- component 不應依賴特定頁面。
- 避免巨型 component。
- 若拆分 component，應以實際可讀性與責任邊界為準，不為了拆分而拆分。

### stores / state

- 管理業務狀態。
- 不處理純 UI 呈現細節，除非該 UI 狀態具跨元件共享需求。
- 禁止繞過既有 state 管理流程。
- component 不允許直接修改 store 資料，應透過既有 action / method / reducer 更新狀態。
- 不得引入隱式共享狀態。
- 不得重複實作既有 store 中已存在的商業邏輯。

### composables / hooks

- 管理共用邏輯。
- 不直接依賴特定頁面。
- 不應混入無關責任。
- 應維持輸入與輸出清楚。
- 若只被單一元件使用，除非可讀性明顯改善，否則不必強行抽出。
- 不得在 composable / hook 中隱藏難以追蹤的副作用。

### services

- 專注 API 呼叫與外部資料存取。
- 不處理畫面狀態。
- 不處理 UI 邏輯。
- 不直接依賴 component、view 或 page。
- API 層不得處理 UI 顯示文字、toast、modal 或 loading 呈現。
- response 轉換若屬於業務資料標準化，可放在 service 或專案既有資料層。

---

## Naming Rules

- composable / hook 使用 `use` 開頭。
- store 命名依專案既有慣例；若無慣例，Vue Pinia 優先使用 `useXXXStore`。
- component 命名應清楚描述用途。
- 型別使用 PascalCase。
- Boolean 使用 `is` / `has` / `can` 開頭。
- event / callback 命名應描述實際行為。
- 不得僅因個人偏好重新命名既有變數、function、檔案或 component。
- 命名調整需有明確可讀性、語意一致性或維護性理由。

---

## UI / Style Rules

### Styling Strategy

- 優先沿用專案現有樣式方案，不主動引入新的 UI / CSS 套件。
- 修改畫面前，必須先確認專案目前使用的樣式方式，例如：
  - UnoCSS
  - Tailwind CSS
  - SCSS / CSS Modules
  - 一般 CSS / scoped CSS
  - CSS-in-JS
  - Naive UI / Element Plus / Ant Design Vue / MUI / Ant Design 等 UI library
- 若專案已使用 UnoCSS，新增或調整樣式時優先使用 UnoCSS atomic class。
- 若專案未使用 UnoCSS，禁止自行新增 UnoCSS 設定或安裝套件。
- 若專案已使用 Tailwind CSS，新增或調整樣式時優先使用既有 Tailwind 設定。
- 若專案未使用 Tailwind CSS，禁止自行新增 Tailwind CSS 設定或安裝套件。
- 若專案已使用 UI library，優先使用既有 UI library 元件完成 UI。
- 若專案未使用特定 UI library，禁止自行安裝或引入。
- 若專案已有共用元件，優先使用既有共用元件，不重複建立相同用途元件。
- 若專案已有 icon 套件或 icon component，優先沿用既有 icon 實作。
- 禁止為單一需求新增新的 UI library、icon library 或 CSS framework。

### UI Migration Rules

- 搬移或重構 UI 時，一次只處理一個區塊或一個元件。
- 不得同時進行「搬移結構、改寫樣式、重構邏輯、調整響應式」。
- 若需要從 CSS 改為 atomic class，必須逐步轉換，並保持原本版面比例、間距、字級與互動狀態。
- 不得因樣式重構改變原有資料流、API 呼叫、store 使用方式或事件名稱。
- 若樣式來源不明，應先回報目前偵測到的樣式方案，再進行修改。

### UI Quality Rules

- UI 元素與文字不得互相重疊。
- 文字必須能在 mobile 與 desktop 尺寸下正常容納。
- button、tab、input、card、modal 等互動元件需具備合理 hover、focus、disabled、loading 狀態。
- 表單錯誤訊息應清楚且不破壞版面。
- 不得用裝飾性樣式掩蓋資訊層級不清的問題。
- 優先維持既有 spacing、font size、color token 與 design system 規範。
- 若沒有 design system，應採取保守一致的視覺調整。

---

## Frontend Review Checklist

任務完成後，必須依修改範圍檢查：

### Scope

- 是否僅修改本次任務相關範圍。
- 是否修改無關模組。
- 是否刪除既有功能。
- 是否變更既有 public API。
- 是否主動重新命名檔案或移動資料夾結構。

### Data Flow

- 是否破壞既有資料流。
- 是否繞過既有狀態或資料管理流程。
- 是否引入隱式共享狀態。
- props 是否被直接修改。
- event / callback / action 名稱是否維持相容。

### Component Responsibility

- component 是否直接呼叫 API。
- component 是否處理過多商業邏輯。
- 共用 component 是否耦合特定業務。
- 是否有巨型 component。
- 是否出現重複 UI 邏輯或重複商業邏輯。

### Store / State

- store 是否處理不必要的 UI 行為。
- component 是否直接修改 store state。
- 是否繞過既有 action / method / reducer。
- 是否新增不必要的全域狀態。

### Composable / Hook

- composable / hook 是否直接依賴頁面。
- composable / hook 是否隱藏難以追蹤的副作用。
- composable / hook 的輸入與輸出是否清楚。
- 是否為了抽象而抽象。

### TypeScript

適用於 TypeScript 專案。

- 是否出現 `any`。
- props 是否定義型別。
- event / emit / callback payload 是否定義型別。
- API response 或重要資料結構是否有明確型別。
- 是否已執行 TypeScript typecheck。

### JavaScript

適用於 JavaScript 專案。

- 複雜資料結構是否可理解。
- props / callback / API response 的資料形狀是否清楚。
- 是否出現隱式型別轉換造成的風險。
- 若專案有 JSDoc / schema / validator 慣例，是否已沿用。

### Vue

適用於 Vue 專案。

- 是否直接修改 props。
- 是否符合既有 Composition API / Options API 使用方式。
- emit 是否維持既有事件名稱與 payload。
- composable 是否符合既有命名與責任邊界。

### React

適用於 React 專案。

- hooks 是否遵守 React hooks rules。
- effect dependency 是否正確。
- 是否有不必要的 re-render 風險。
- 是否使用 state 掩蓋可由 props 或 derived data 表達的資料。
- callback / memo 是否有實際必要。

### Validation

- 若專案有 lint，是否已執行 lint。
- 若專案有 test，是否已執行本次修改影響範圍的 test。
- 若專案有 build，是否已執行 build。
- 若專案使用 TypeScript，是否已執行 typecheck。
- 若因環境限制無法執行驗證，是否已在輸出結果中明確說明原因與建議手動執行指令。