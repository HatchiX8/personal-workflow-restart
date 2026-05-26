# .NET API Development Skill

## 適用情境

當任務涉及公司現有 ASP.NET Core / .NET 5 後端 API 開發、修改、除錯時啟用。

本 Skill 只針對目前既有專案，不追求通用最佳實踐。

---

## 專案前提

本專案目前使用：

- .NET 5
- ASP.NET Core Web API
- SQL Server
- Dapper
- SqlConnection
- `_configuration["SQL:..."]` 取得連線字串

既有程式可能存在：

- Controller 直接操作 SQL
- Controller 直接使用 Dapper
- Controller 直接回傳 API response

AI 不得假設專案使用：

- .NET 6 / .NET 7 / .NET 8
- Entity Framework Core
- Migration
- Minimal API
- MediatR
- AutoMapper
- Clean Architecture
- 最新 C# 語法

---

## 版本限制

本專案固定以 `.NET 5` 為準。

AI 不得使用超出 .NET 5 / C# 9 常見支援範圍的語法與 API。

避免使用：

- Minimal API
- top-level statements
- file-scoped namespace
- global using
- required member
- primary constructor
- collection expression
- ExecuteUpdate / ExecuteDelete
- .NET 6+ / .NET 7+ / .NET 8+ API

若不確定語法是否支援 .NET 5：

- 必須改用保守、舊式、既有專案已出現過的寫法
- 不得自行導入新語法

---

## 任務開始前

開始修改前必須：

1. 搜尋既有相似 API
2. 確認同模組或相近模組寫法
3. 確認既有：
   - Controller 寫法
   - Service 寫法
   - SQL 撰寫風格
   - Dapper 查詢方式
   - Request 來源
   - Response 格式
   - try/catch 錯誤處理方式
4. 理解既有資料流後才能開始修改

不得在未理解既有模式前直接新增架構。

---

## 開發流程

修改前應先：

1. 列出預計修改檔案
2. 說明資料流：
   - Request
   - Controller
   - Service
   - Data Access / Repository
   - Response
3. 確認是否影響既有前端相容性

新增 API 時：

- 必須參考同模組或相近模組寫法
- 優先沿用既有命名與資料夾結構

---

## 分層策略

本專案既有程式可能存在 Controller 直接操作 SqlConnection / Dapper / SQL 的寫法。

AI 不得因為分層原則而主動大規模重構既有程式。

但若任務是新增功能、擴充 API、或新增查詢流程，應優先採用較清楚的分層方式。

---

## 新增功能分層原則

新增 API 時，優先採用：

- Controller：接收 request、驗證參數、呼叫 Service、回傳 response
- Service：處理流程控制、商業邏輯、資料組合
- Data Access / Repository：處理 SqlConnection、Dapper、SQL 查詢

---

## Controller 規則

新增或重寫 API 時：

Controller 應優先只負責：

- Route
- Request 接收
- 基本參數檢查
- 呼叫 Service
- 回傳 Response

應避免在 Controller 撰寫：

- 大量 SQL
- 複雜商業邏輯
- 大量資料轉換
- 大型 LINQ query

若修改的是既有 Controller 內 SQL 寫法：

- 可維持原有結構
- 不強制抽 Service
- 除非任務明確要求重構

---

## Service 規則

新增 Service 時：

Service 應負責：

- 商業邏輯
- 流程控制
- 多筆資料整合
- 權限或條件判斷
- 呼叫 Data Access / Repository

Service 不應直接回傳 `IActionResult`，除非既有專案慣例如此。

---

## Data Access / Repository 規則

新增資料查詢時：

若任務範圍允許，應將：

- SqlConnection
- Dapper query
- SQL 字串
- SQL parameters

集中在 Data Access / Repository 類別中。

本專案目前依 `ServerName` 選擇 SQL Server 連線字串。

若任務涉及資料庫查詢，應優先沿用既有模式：

```csharp
string? sql = "";

if (e.ServerName == "W162")
{
    sql = _configuration["SQL:DatabaseSettings"];
}
else if (e.ServerName == "W164")
{
    sql = _configuration["SQL:DatabaseSettings2"];
}
else
{
    sql = _configuration["SQL:DatabaseSettings3"];
}

var cn = new SqlConnection(sql);
```

除非任務明確要求，不得自行改成：

- DbContext
- EF Core
- Migration
- Unit of Work
- Connection Factory
- Options Pattern
- 新的資料庫存取架構

---

## SQL / Dapper 規則

資料查詢應優先沿用 Dapper。

可使用：

- QueryAsync
- QueryFirstOrDefaultAsync
- QuerySingleOrDefaultAsync
- ExecuteAsync

SQL 參數必須使用 Dapper parameter binding。

建議：

```csharp
await cn.QueryFirstOrDefaultAsync<dynamic>(
    querySql,
    new { KeywordParam = e.Device }
);
```

避免：

```csharp
var querySql = "SELECT * FROM Table WHERE Device = '" + e.Device + "'";
```

不得使用字串拼接組使用者輸入，避免 SQL Injection。

---

## SQL 修改規則

若只是新增查詢條件、欄位或修正查詢：

- 優先修改既有 SQL
- 不重新設計整段查詢
- 不自行改變資料來源 table / view
- 不自行新增 Stored Procedure
- 不自行修改資料庫 schema

除非任務明確要求，不得：

- 新增 Table
- 新增 Column
- 新增 Index
- 新增 Migration
- 改動既有資料庫結構

---

## Request / Response 規則

必須沿用既有 API request / response 風格。

若既有 API 使用：

```csharp
return Ok(data);
```

則優先沿用。

若既有 API 使用：

```csharp
return BadRequest(ex.Message);
```

則可沿用既有風格。

不得主動新增：

- Request DTO
- Response DTO
- ApiResponse<T>
- Result pattern
- 自訂錯誤格式

除非：

- 任務明確要求
- 或既有模組已經使用相同模式

---

## Dependency Injection 規則

若新增 Service / Repository：

1. 必須確認既有 DI 註冊位置
2. 優先沿用既有註冊方式
3. 不得自行引入新的 DI 套件
4. 不得改動既有服務生命週期

除非任務明確要求。

---

## 錯誤處理規則

應優先沿用既有 try/catch 寫法。

常見模式：

```csharp
try
{
    var data = await cn.QueryFirstOrDefaultAsync<dynamic>(querySql, parameters);
    return Ok(data);
}
catch (Exception ex)
{
    return BadRequest(ex.Message);
}
```

除非任務明確要求，不得自行改成：

- Global Exception Middleware
- Filter
- Result Pattern
- 自訂 Error Code
- 統一錯誤 Response Wrapper

---

## 舊程式修改原則

若任務只是：

- 修 bug
- 修改欄位
- 調整 SQL 條件
- 增加查詢參數
- 修改 response 欄位

則應：

- 優先最小修改
- 不順手重構整個 Controller
- 不因為分層原則改動大量舊程式
- 不影響既有 response structure

若任務明確要求重構：

才可將既有 Controller SQL 抽出至 Service / Data Access。

---

## 驗證規則

本任務環境可能無法：

- 連線公司資料庫
- 執行完整 API
- 驗證 SQL 實際查詢結果
- 執行 integration test

若本地環境可執行：

- 可嘗試 `dotnet build`
- 若有測試專案可嘗試 `dotnet test`

若環境限制導致無法執行：

- 不強制 build / test
- 不得假裝已完成驗證

完成修改後必須回報：

- 修改了哪些檔案
- 是否有修改 SQL
- 是否有新增查詢參數
- 是否有改動 response structure
- 是否依賴公司內部資料庫或外部服務
- 哪些部分無法在本地驗證
- 需要工程師人工確認的風險點

---

## C# 檔案新增規則

本專案新增 `.cs` 檔案時，通常不需要手動修改 `.csproj`。

但 AI 新增檔案後仍需確認：

- 檔案位置是否位於正確 project 資料夾內
- namespace 是否符合既有專案結構
- 是否需要新增 DI 註冊
- 是否需要補 using
- 是否有誤新增到錯誤專案或錯誤資料夾

除非確認 `.csproj` 需要手動 include，否則不得主動修改 `.csproj`。