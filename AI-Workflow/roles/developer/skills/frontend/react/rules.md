# Developer React 開發 Skill

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
