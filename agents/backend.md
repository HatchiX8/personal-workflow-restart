# Backend Rules

本文件定義後端開發時的通用規範。

目標：

- 維持 API 一致性
- 提升可讀性與可維護性
- 降低 AI 自行發散實作
- 保留工程師介入與調整空間

# API 設計規則

## RESTful API 原則

當情境適合時，API 應優先遵循 RESTful API 設計。

## 路由命名

應優先使用資源(Resource)命名，而非動詞命名。

建議：

- GET `/api/users`
- GET `/api/users/{id}`
- POST `/api/users`

避免：

- GET `/api/getUsers`
- POST `/api/createUser`

---

## HTTP Method 使用原則

- GET：取得資料
- POST：新增資料或執行不可重複操作
- PUT：完整更新資源
- PATCH：部分更新資源
- DELETE：刪除資源

---

## Response 規則

除非任務明確要求：

- 不得隨意修改既有 response structure
- 不得破壞既有前端相容性
- 不得自行新增不必要欄位

若需要調整 API 格式：

- 必須先確認是否影響既有使用端
- 優先保持向下相容

---

# 分層規則

## Controller

Controller 應只負責：

- Request 接收
- Response 回傳
- Model Validation
- 呼叫 Service

避免：

- 複雜商業邏輯
- 大量資料轉換
- 直接撰寫大型 SQL / Query

---

## Service

Service 應負責：

- 商業邏輯
- 流程控制
- 資料整合
- 權限判斷
- 多來源資料處理

---

## Repository / Data Access

若專案存在 Repository 或 Data Access Layer：

- DB Query 應集中管理
- 避免重複 Query
- 避免 Query 分散在多個 Controller

若既有專案未使用 Repository：

- 優先遵循既有專案架構
- 不強制重構

---

# DTO 規則

## Request DTO

- API Input 應優先使用 DTO
- Validation 應集中管理
- 避免直接接收 Entity

---

## Response DTO

- API Output 應優先使用 DTO
- 避免直接暴露資料庫 Entity
- 避免將內部欄位直接回傳前端

---

# 錯誤處理規則

## Exception

避免：

- 直接將 Exception Message 回傳前端
- 洩漏 Stack Trace
- 洩漏內部路徑資訊

---

## Status Code

應依情境使用適當 HTTP Status：

- 400：Request 格式錯誤
- 401：未登入
- 403：無權限
- 404：資源不存在
- 409：資料衝突
- 500：伺服器錯誤

---

# 資料庫規則

除非任務明確要求：

- 不得自行修改 Schema
- 不得新增 Migration
- 不得新增 Table / Column

---

## Query 規則

- 避免重複 Query
- 避免不必要全表掃描
- 優先維持既有 Query Style

若需優化：

- 應先確認是否影響既有功能

---

# 可維護性規則

## 命名

應優先遵循既有專案命名風格。

避免：

- 為了個人偏好大量改名
- 無意義縮寫
- 命名風格混亂

---

## 重構規則

除非任務明確要求：

- 不主動大規模重構
- 不為了「理論最佳化」改動大量程式
- 不在功能開發時順便全面改架構

---

# AI 行為限制

AI 應優先：

- 延續既有專案架構
- 理解既有實作模式
- 保持低侵入性修改

避免：

- 自行發明新架構
- 任意導入新套件
- 未經要求切換設計模式

---

# 工程師優先原則

本規則為預設方向。

若工程師有明確需求：

- 工程師決策優先
- 可覆蓋本規則
- 可依專案需求調整

AI 不應強制執行與專案衝突的規則。

