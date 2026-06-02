# Node.js Backend Refactor Skill

## 適用情境

當重構任務涉及 Node.js 後端時，啟用本 Skill。

適用範圍包含：

- Express API
- TypeScript / JavaScript 後端
- router / controller / service / repository 分層
- API request / response 整理
- 資料庫查詢邏輯整理
- 商業邏輯拆分
- 模組內共用邏輯整理
- 權限驗證與 middleware 使用方式整理

若任務不是 Node.js 後端重構，不得使用本 Skill。

---

## 分層規則

Node.js 後端模組建議採用以下分層：

```txt
modules/
└─ module-name/
   ├─ router.ts
   ├─ controller.ts
   ├─ service.ts
   ├─ repository.ts
   ├─ types.ts
   ├─ constants.ts
   └─ mapper.ts
```

並非每個模組都必須具備所有檔案。

只在必要時新增檔案。

---

## router.ts

router.ts 只負責 API 路由註冊。

允許：

- 定義 HTTP method
- 定義 route path
- 掛載 middleware
- 掛載 controller function

不得包含：

- 商業邏輯
- 資料庫查詢
- Request body 複雜處理
- Response 組裝
- try / catch 業務錯誤處理

範例責任：

```txt
POST /api/ai/monthly-report
→ validateAuth
→ validateMonthlyReportRequest
→ monthlyReportController.generate
```

---

## controller.ts

controller.ts 負責處理 API 進出邊界。

允許：

- 讀取 req.params
- 讀取 req.query
- 讀取 req.body
- 取得 req.user / userId
- 套用或協調 request validation
- 呼叫 service
- 回傳 response
- 處理 HTTP status code

不得包含：

- SQL 查詢
- 複雜商業邏輯
- 大量資料轉換
- AI Prompt 組裝
- 直接呼叫 Python AI Service
- 直接操作資料庫 transaction

Controller 應保持薄層。

---

## service.ts

service.ts 負責商業流程與 use case。

允許：

- 執行主要業務流程
- 協調多個 repository
- 協調外部 service client
- 套用業務規則
- 整理要回傳給 controller 的結果
- 決定是否呼叫 Python AI Service
- 處理 userId + period 這類業務條件
- 處理重複請求鎖定邏輯

不得包含：

- Express req / res
- HTTP route 註冊
- 原始 SQL 字串
- 直接處理資料庫連線細節
- 前端 UI 狀態邏輯

Service 是主要商業邏輯所在。

---

## repository.ts

repository.ts 負責資料庫溝通。

允許：

- SQL 查詢
- 資料庫 insert / update / delete
- 查詢條件組合
- transaction 內的資料操作
- 將資料庫 row 轉成基礎資料物件

不得包含：

- Express req / res
- HTTP status code
- 商業流程判斷
- AI Prompt 組裝
- 呼叫外部 API
- 複雜報表分析邏輯

Repository 回傳資料，不決定業務流程。

---

## 模組內共用檔案命名

不得建立模糊命名檔案：

- utils.ts
- helper.ts
- helpers.ts
- common.ts
- shared.ts

若需要在模組內抽出共用邏輯，必須依照用途命名。

建議命名：

- mapper.ts：資料轉換，例如 DB row → DTO、service result → response
- validator.ts：模組內驗證規則
- formatter.ts：格式化輸出，例如日期、金額、文字
- calculator.ts：計算邏輯，例如報酬率、統計值、比例
- constants.ts：常數，例如限制值、預設值、錯誤訊息 key
- types.ts：TypeScript type / interface / enum
- client.ts：模組專用外部 API client
- locks.ts：模組專用請求鎖或併發控制

新增共用檔案前必須確認：

- 是否只服務於目前模組
- 是否有明確命名
- 是否不會變成垃圾桶檔案
- 是否不應該放在既有 service / mapper / calculator

若無法明確命名，代表不應該抽出。

---

## 重構限制

重構時不得：

- 改變 API 路徑
- 改變 Request / Response 結構
- 改變資料庫 schema
- 新增 migration
- 新增套件依賴，除非使用者明確要求
- 將 controller 與 service 混在一起
- 將 service 與 repository 混在一起
- 讓 controller 直接查資料庫
- 讓 repository 處理商業邏輯
- 讓 router 處理 request body
- 一次重構多支 API
- 一次跨多個模組大改

每次重構只處理一支 API 或一個明確模組範圍。

---

## 操作流程

### 重構前

必須先確認：

- 本次重構目標
- 涉及哪一支 API
- 涉及哪些檔案
- 是否會影響 API path
- 是否會影響 request / response
- 是否會影響資料庫查詢

若需求不明確，必須先以最小範圍處理。

不得自行擴大重構範圍。

---

### 重構中

必須遵守：

- 先理解現有資料流
- 先保留現有行為
- 優先移動邏輯，不優先重寫邏輯
- controller 只保留 API 邊界邏輯
- service 保留業務流程
- repository 保留資料庫溝通
- 共用函式只放在模組內
- 不新增全域共用資料夾

若發現需要跨層大改，必須停止並回報拆分建議。

---

### 重構後

必須檢查：

- router 是否只註冊路由
- controller 是否沒有 SQL
- controller 是否沒有複雜業務邏輯
- service 是否沒有 req / res
- service 是否沒有原始 SQL
- repository 是否沒有 HTTP status code
- repository 是否沒有商業流程判斷
- 是否沒有新增 utils / helpers / common / shared
- 是否沒有改變 API path
- 是否沒有改變 request / response
- 是否沒有改變資料庫 schema

---

## 驗證方式

重構完成後，依專案可用 script 執行驗證。

優先執行：

```bash
npm run typecheck
```

接著執行：

```bash
npm run lint
```

若專案有測試：

```bash
npm run test
```

若專案需要 build 驗證：

```bash
npm run build
```

若上述 script 不存在，必須回報缺少哪些驗證指令。

不得在未驗證的情況下宣告完全完成。

---

## 完成輸出要求

完成後必須回報：

```md
## Node.js Backend Refactor Summary

### Target API

### Goal

### Changed Files

### Layer Responsibility Check

### API Changes

### Database Changes

### Dependency Changes

### Validation

### Notes
```

若沒有變更，填寫：

無

不得省略。
