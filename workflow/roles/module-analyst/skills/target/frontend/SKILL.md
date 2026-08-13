---
name: frontend
description: Module Analyst 的前端 Target 分析規則。當作用中 stack 的 target=frontend，或指定模組明確屬於前端 UI、狀態、路由或互動流程時使用。
---

# Module Analyst 前端 Target Skill

Frontend Module Analysis 適用於 Vue component、React component、UI modules、frontend state、frontend route、composables、hooks、stores 與使用者互動流程。

## 分析目標

前端模組分析的目標是建立後續 agent 修改 UI 或前端資料流時可遵守的 context。

必須釐清：

- UI 模組入口
- component 階層與責任邊界
- props、events、slots、callbacks 或 context contract
- local state、store state、server state 的資料流
- API client、query、mutation 或 cache 依賴
- routing、permission、loading、empty、error 狀態
- 可修改與不可越界的前端範圍

## 建議觀察來源

優先讀取：

- page、route 或 feature entry
- 主要 component
- 同模組 composables / hooks
- 同模組 store 或 state slice
- API client 或 query/mutation 定義
- type、schema、validation 檔案
- 少量直接相關測試

只在必要時讀取：

- parent component
- child component
- shared component
- global store
- router config
- API response type 或 backend contract 文件

讀取 shared component 或 global store 時，只確認 contract，不展開成 shared layer 分析。

## Frontend Boundary

輸出必須標記：

- 此模組擁有的 UI 範圍
- 此模組可直接修改的 component、composable、store 或 style 範圍
- 外部傳入的 props、route params、query params、context 或 store state
- 對外送出的 events、callbacks、navigation、mutation 或 store update
- 不應在本模組任務中任意修改的 shared component、global store、API client 或 route contract

## Data Flow

需整理：

- 使用者操作如何觸發 state change 或 API call
- props / route / store / API data 如何進入模組
- derived state 如何產生
- submit、save、delete、refresh、retry 等主要操作如何流動
- 成功後 UI、store、cache 或 route 如何更新
- 失敗後 error 如何呈現或回復

若存在 async flow，需標記：

- loading state 來源
- 重複送出或重複觸發風險
- stale data 或 stale closure 風險
- unmount、route change 或 tab change 後的狀態風險

## Contract Context

需整理後續 agent 不可破壞的 contract：

- props shape
- event payload
- callback signature
- slot 或 children 使用方式
- route params / query params
- store action / getter / state shape
- query key / cache key
- API request / response shape
- validation rule 與 server error mapping

若 contract 只由使用方式推論，必須標記為「根據結構推論」。

## State And UX Conditions

需整理模組既有狀態：

- initial
- loading
- empty
- success
- error
- disabled
- permission denied
- not found

不得針對視覺風格、排版喜好或命名偏好提出修改建議。

可標記為後續 Review agent 應檢查的風險：

- 主要操作沒有明確成功或失敗回饋
- loading / disabled 狀態可能阻斷主要流程
- API 成功後畫面或 cache 可能不同步
- route params 或 props 變更後資料可能不更新
- server validation error 無法回到使用者流程

## Output Additions

前端模組 context 需額外包含：

- UI 入口
- component responsibility map
- props / events / store / route contract
- user flow summary
- API and cache dependency
- frontend-only 可修改範圍
- shared UI / global state 不可越界範圍

## Stop Conditions

遇到以下情況應停止或標記待確認：

- 無法確認主要 UI 入口
- 無法確認 props / route / store / API 資料來源
- 模組依賴 shared component，但 shared component contract 不明
- 修改邊界必須跨越 global store、shared API client 或 route contract 才能成立
