---
name: backend
description: Review 的後端 Target 檢查規則。當作用中 stack 的 target=backend，或受檢變更明確涉及 API、資料庫、服務邏輯、Job 或外部整合時使用。
---

# Review 後端 Target Skill

Backend checks 適用於 API、database、service logic、backend job、server route、資料處理流程與外部服務整合。

不得針對風格偏好、命名喜好、資料夾偏好或非必要重構提出 blocking finding。

## API Contract

需檢查：

- request params、body、query、headers 是否與呼叫端或文件一致
- response shape、status code、error format 是否一致
- required / optional 欄位是否被正確處理
- backward compatibility 是否被破壞
- 若專案存在 Swagger / OpenAPI 文件，實際 API 實作是否與文件定義一致
- 若 API 行為、request、response、status code 或 error format 有變更，Swagger / OpenAPI 文件是否同步更新

可列為 blocking finding：

- API response shape 與既有呼叫端不一致
- 必要參數未驗證導致 runtime failure 或錯誤資料
- status code 或 error format 破壞既有錯誤處理
- Swagger / OpenAPI 文件存在但與實際 API contract 不一致，且會誤導呼叫端或造成整合錯誤

## Service Logic

需檢查：

- business rule 是否完整套用
- 分支條件是否互相衝突
- success path 與 failure path 是否清楚分離
- idempotency、retry 或重入行為是否有明確風險

可列為 blocking finding：

- 主要 business rule 被跳過
- failure path 仍寫入資料或回傳成功
- 重複呼叫會造成明確錯誤資料或重複副作用

## Data Persistence

需檢查：

- create、update、delete 是否處理必要欄位
- transaction boundary 是否覆蓋必須一起成功或失敗的操作
- 查詢條件是否可能讀到或寫到錯誤資料
- nullable、unique、foreign key 等資料限制是否被考慮

可列為 blocking finding：

- 寫入不完整資料導致後續流程失敗
- 多步驟更新部分成功造成資料不一致
- 查詢條件錯誤導致跨使用者、跨租戶或跨範圍資料混淆

## Authorization And Ownership

需檢查：

- 需要權限的操作是否檢查 authorization
- resource ownership、tenant、scope 是否被限制
- backend 是否避免只依賴 frontend 隱藏操作入口

可列為 blocking finding：

- 未授權使用者可讀取或修改資料
- tenant 或 owner 條件缺失
- 後端信任前端傳入的權限狀態

## External Integration

需檢查：

- 外部服務失敗是否正確處理
- timeout、retry、partial failure 是否不會造成假成功
- request/response mapping 是否符合實際 contract
- secret、token、credential 是否沒有被輸出到 log 或 response

可列為 blocking finding：

- 外部服務失敗時仍回傳成功
- response mapping 錯誤導致資料錯置
- sensitive value 被暴露到 log、error 或 response
