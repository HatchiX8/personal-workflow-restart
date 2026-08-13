---
name: backend
description: Developer 的後端 Target 規則。當 project.config.json 的作用中 stack 宣告 target=backend，或 repository evidence 明確顯示本次工作屬於後端、API、資料服務或伺服器端時使用。
---

# Developer 後端 Target Skill

套用所有後端任務共通的 API、分層、資料存取、副作用與驗證規則。語言、Runtime 與 Framework 規則由其他槽位 Skills 補充。

## API Contract

- 優先維持既有 API path、HTTP method、request、response、status code 與 error format。
- 不得因內部重構破壞既有呼叫端。
- 新增或修改 API 時，必須確認 required／optional 欄位與向下相容性。
- API Input 與 Output 應優先使用明確 DTO、schema 或等價的邊界型別。
- 不得直接暴露資料庫 Entity、內部欄位或未整理的例外資訊。
- 若任務需要改變 public contract，必須在修改前確認影響範圍與使用端。

## Router／Route

Router 或 Route registration 只負責：

- 定義 HTTP method 與 path。
- 掛載 middleware、validation 與 handler。
- 將請求導向 Controller 或等價邊界層。

不得包含：

- 商業邏輯。
- 資料庫查詢。
- 大量 request／response 轉換。
- 與路由註冊無關的副作用。

## Controller／Handler

Controller 或 Handler 應負責：

- 接收 params、query、headers 與 body。
- 執行或協調 request validation。
- 取得已驗證的身分與權限資訊。
- 呼叫 Service 或 use case。
- 將結果轉換為 API response。

不得包含：

- 複雜商業流程。
- 大型 SQL 或資料存取細節。
- 大量資料轉換。
- 跨多個外部服務的流程協調。

若既有專案沒有獨立 Controller 層，仍應維持 API 邊界與商業邏輯的責任可辨識，不得為套用本規則主動大規模改造。

## Service／Use Case

Service 或 Use Case 應負責：

- 商業規則與流程控制。
- 協調 Repository、Data Access 與外部服務。
- 權限、條件與狀態轉換。
- 多來源資料整合。
- 決定交易或副作用的執行順序。

不得直接依賴特定 HTTP request／response 物件，除非既有架構明確以此為慣例。

## Repository／Data Access

Repository 或 Data Access 應負責：

- Query 與資料庫存取。
- create、update、delete。
- transaction 內的資料操作。
- 將資料庫結果轉換為基礎資料物件。

不得負責：

- HTTP status code。
- Request／Response 組裝。
- 商業流程決策。
- 與資料存取無關的外部服務呼叫。

若既有專案沒有 Repository 層，優先延續既有模式，不得只因通用分層規則強制新增。

## DTO 與 Validation

- Request DTO、schema 或等價邊界型別應描述 API Input。
- Response DTO、schema 或等價邊界型別應描述 API Output。
- Validation 應靠近輸入邊界並集中管理，避免同一規則散落在多個層級。
- 不得以未驗證的 client input 直接進行資料寫入、權限判斷或 query 組合。
- Validation error 必須能被呼叫端辨識，不得被當成 success。

## 錯誤處理

- 不得將 stack trace、內部路徑、connection string、credential 或未整理的 Exception message 回傳給使用端。
- 主要流程失敗時不得回報成功。
- 不得吞掉會造成資料不一致或錯誤狀態的例外。
- Status code 與 error format 應延續既有 API contract。
- Retry、fallback 與 default value 不得掩蓋真正失敗。

## 資料庫與副作用

除非任務明確要求，不得：

- 修改 schema。
- 新增 migration、table 或 column。
- 改變既有 transaction boundary。
- 更換資料存取技術。

Query 與寫入必須：

- 使用安全的參數綁定，不得拼接未驗證輸入。
- 維持既有資料來源與查詢風格。
- 確認 create、update、delete 的必要條件。
- 避免重複 query 與不必要全表掃描。
- 確認多步驟寫入失敗時不會留下未說明的 partial state。

## 模組內共用邏輯

- 共用邏輯應依實際用途命名，不得使用無法表達責任的垃圾桶名稱。
- mapper、validator、formatter、calculator、constants、types、client 等名稱只能在責任相符時使用。
- 新增共用檔案前，必須確認它只服務目前 Scope，或已由任務明確核准為跨模組共用。
- 不得為單一使用點建立沒有實際價值的抽象層。

## 修改與重構限制

- 優先採用最小影響修改。
- 不得為套用分層規則主動大規模重構既有程式。
- 不得順手改變 API path、Request／Response、資料庫 schema 或依賴。
- 不得把 Controller、Service 與 Repository 的責任混合得更難辨識。
- 需要跨模組、跨層或改變 public contract 時，先說明影響並依使用者授權及相關 Task Skill 處理。

## 驗證

依專案實際提供的指令與本次修改範圍執行：

- lint。
- typecheck 或語言對應的靜態檢查。
- build。
- unit、integration 或直接相關測試。

若指令不存在、環境無法連線必要服務或無法完成驗證，必須回報未驗證項目與原因，不得宣告已完整驗證。
