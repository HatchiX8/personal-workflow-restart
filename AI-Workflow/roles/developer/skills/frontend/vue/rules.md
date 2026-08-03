# Developer Vue 開發 Skill

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
