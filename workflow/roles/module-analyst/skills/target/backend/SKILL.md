---
name: backend
description: Module Analyst 的後端 Target 分析規則。當作用中 stack 的 target=backend，或指定模組明確屬於 API、資料庫、服務邏輯、Job 或外部整合時使用。
---

# Module Analyst 後端 Target Skill

Backend Module Analysis 適用於 API、database、service logic、backend job、server route、資料處理流程與外部服務整合。

## 分析目標

後端模組分析的目標是建立後續 agent 修改 API、service 或資料流程時可遵守的 context。

必須釐清：

- API / route / job / service 入口
- request、response、error format 與 status code contract
- service layer 責任與外部呼叫端
- database model、query、transaction 或 persistence 邊界
- validation、authorization、ownership 與 permission 檢查
- 外部服務、queue、event、cache 或 file side effects
- 可修改與不可越界的後端範圍

## 建議觀察來源

優先讀取：

- route、controller 或 handler
- service / use case / domain module
- request / response type
- validation schema
- model、repository、query 或 ORM schema
- error helper 或 middleware 使用方式
- 少量直接相關測試

只在必要時讀取：

- 呼叫此 API 的前端 API client
- shared middleware
- shared model 或 schema
- database migration
- external service client
- OpenAPI / Swagger 文件

讀取 shared middleware、shared schema 或 external client 時，只確認 contract，不展開成共用層分析。

## Backend Boundary

輸出必須標記：

- 此模組擁有的 API、route、service、job 或 repository 範圍
- 此模組可直接修改的 handler、service、validation 或 query 範圍
- 外部傳入的 params、body、query、headers、context 或 auth state
- 對外回傳的 response shape、status code、error format 或 event
- 不應在本模組任務中任意修改的 shared schema、middleware、database structure、external client 或其他模組 contract

## Data Flow

需整理：

- request 如何進入 route / handler
- validation 與 authorization 何時發生
- handler 如何呼叫 service、repository 或 external client
- service 如何讀寫資料或產生副作用
- success path 如何回傳 response
- failure path 如何回傳 error
- transaction 或多步驟寫入的成功 / 失敗邊界

若存在 async job、queue 或 event flow，需標記：

- 觸發來源
- payload contract
- retry、idempotency 或重入風險
- partial failure 風險

## Contract Context

需整理後續 agent 不可破壞的 contract：

- route path 與 method
- request params / query / body / headers
- response shape
- status code
- error format
- validation schema
- auth / ownership / tenant scope
- database model 或欄位使用
- external service request / response mapping
- event、queue 或 job payload
- OpenAPI / Swagger 文件對應位置，若存在

若 contract 只由使用方式推論，必須標記為「根據結構推論」。

## Data Consistency And Side Effects

需整理：

- create / update / delete 涉及的資料欄位
- transaction boundary
- cache invalidation 或 refresh
- external API call
- file、email、notification、queue、event 等副作用
- failure path 是否可能留下 partial state

可標記為後續 Review agent 應檢查的風險：

- request / response contract 可能破壞呼叫端
- validation 或 authorization 邊界不明
- transaction 不明導致資料可能部分成功
- external service 失敗處理不明
- error format 不一致
- OpenAPI / Swagger 文件可能需要同步確認

## Output Additions

後端模組 context 需額外包含：

- API / service 入口
- request / response / error contract
- service and repository responsibility map
- database and transaction boundary
- validation and authorization boundary
- external integration and side effects
- backend-only 可修改範圍
- shared schema / database / middleware 不可越界範圍

## Stop Conditions

遇到以下情況應停止或標記待確認：

- 無法確認主要 API、service 或 job 入口
- 無法確認 request / response contract
- 模組依賴 shared schema，但 shared schema contract 不明
- 修改邊界必須跨越 database structure、shared middleware、external client 或其他模組 contract 才能成立
