# Refactor Skills 使用說明

本 README 提供工程師撰寫 prompt 時呼叫 refactor skills 的方式。

refactor skills 的目標是讓 Agent 在可控範圍內整理既有程式碼，包含命名、函式拆分、分層責任、重複邏輯與模組內資料轉換整理。

## 目前支援範圍

目前可直接執行的 refactor skill：

- `general-refactor.md`：重構入口與範圍判定規則
- `node-backend-refactor.md`：Node.js / TypeScript / JavaScript 後端重構規則

目前尚未支援直接執行：

- `python-backend-refactor.md`
- `frontend-refactor.md`

若任務需要尚未支援的 refactor skill，Agent 必須停止並回報缺少對應規則，不得自行推測。

## 何時使用 Refactor Skills

當任務目標是整理既有程式碼，且不改變功能行為時，使用 refactor skills。

適合使用的情境：

- 整理命名
- 拆分過大的 function
- 調整 controller / service / repository 責任邊界
- 移除同一模組內的重複邏輯
- 抽出同一模組內的 mapper / formatter / calculator
- 降低單一函式內過深的條件分支
- 整理單一 API 的後端流程

不適合使用的情境：

- 新增功能
- 修 bug
- 調整 API 行為
- 改變 API path
- 改變 Request / Response 結構
- 新增套件依賴
- 調整資料庫 schema
- 同時重構前端與後端
- 同時重構多支 API 或多個模組

## Prompt 基本格式

建議在 prompt 開頭明確寫出任務是 refactor，並指定目標、範圍與限制。

```txt
任務類型：Refactor Task
指定 refactor skill：Node.js Backend Refactor

本次任務：
重構 users API 的 controller / service / repository 責任邊界。

主要目標：
讓 controller 只處理 API 進出邊界，service 負責業務流程，repository 負責資料庫查詢。

範圍：
- 只處理 GET /api/users/:id
- 只修改 users 模組
- 不修改其他 API

限制：
- 不改變 API path
- 不改變 Request / Response 結構
- 不改變資料庫 schema
- 不新增套件依賴
```

## 呼叫 Node.js Backend Refactor

當重構任務涉及 Express API、TypeScript / JavaScript 後端、router / controller / service / repository 分層時，指定 Node.js Backend Refactor。

```txt
任務類型：Refactor Task
指定 refactor skill：Node.js Backend Refactor

本次任務：
整理 orders 模組中 POST /api/orders 的 service 邏輯，移除重複的訂單金額計算。

主要目標：
移除同一模組內的重複商業邏輯。

範圍：
- 只處理 POST /api/orders
- 只修改 orders 模組

限制：
- 不改變 API path
- 不改變 Request / Response
- 不新增套件依賴
- 不新增全域共用工具
```

## 小範圍重構寫法

小範圍重構可以讓 Agent 在完成執行前檢查後直接執行。

建議明確寫出「只處理」的範圍。

```txt
任務類型：Refactor Task
指定 refactor skill：Node.js Backend Refactor

本次任務：
拆分 reportService.generateMonthlyReport 這個 function。

主要目標：
拆分過大的 function，提高可讀性。

範圍：
- 只修改 reportService.ts
- 只處理 generateMonthlyReport

限制：
- 不改變函式輸入輸出
- 不改變 API 行為
- 不新增檔案，除非原檔案已無法維持清楚責任
```

## 大範圍重構寫法

大範圍重構不得直接要求 Agent 一次完成。應要求 Agent 先分析、判定影響範圍，並提出拆分順序。

```txt
任務類型：Refactor Task
指定 refactor skill：Node.js Backend Refactor

本次任務：
分析 payments 相關 API 是否需要重構，先不要修改程式碼。

請先回報：
- 是否屬於大範圍重構
- 可能影響哪些 API 與模組
- 建議拆成哪些小範圍重構任務
- 第一個建議執行的重構任務
```

## 主要目標寫法

每次 refactor 必須只有一個主要目標。

好的寫法：

```txt
主要目標：
讓 controller 只保留 API 邊界邏輯。
```

```txt
主要目標：
移除 service 內重複的金額計算邏輯。
```

```txt
主要目標：
拆分 generateReport function，降低單一函式責任。
```

不建議的寫法：

```txt
主要目標：
順便整理命名、拆 service、調整 response、重做資料夾結構。
```

若任務同時包含多個主要目標，Agent 必須停止並建議拆分任務。

## 可接受的附帶修改

附帶修改必須服務於主要目標，且不得變成另一個獨立重構任務。

可接受：

- 拆分 function 時，調整區域變數命名
- 移除重複邏輯時，抽出同模組內私有 helper function
- 整理 controller / service 責任時，搬移必要 mapper
- 降低條件分支時，新增 guard clause

不可接受：

- 拆分 function 時，順便調整 API response 欄位
- 整理 service 時，順便重命名整個模組檔案
- 移除重複邏輯時，順便建立全域 shared utils
- 整理單一 API 時，順便重構同模組所有 API

## 工程師應提供的資訊

為了讓 Agent 正確判斷範圍，prompt 應盡量包含：

- 要重構的 API、function、檔案或模組
- 本次唯一主要目標
- 不允許改變的行為
- 是否允許新增檔案
- 是否允許調整 import
- 必須執行的驗證指令

## Agent 執行時會做的事

Agent 會依序執行：

1. 讀取 `AI-Workflow/roles/developer/core.md`、`AI-Workflow/roles/developer/restrictions.md`、`AI-Workflow/roles/developer/workflow.md`
2. 讀取 refactor router 規則
3. 判定 refactor 模式
4. 判定小範圍或大範圍重構
5. 執行 `git status`
6. 若為小範圍重構，才進入修改
7. 完成後執行 review、typecheck、lint、test 或 build
8. 回報修改檔案、行為變更、API 變更、依賴變更與驗證結果

若發現任務屬於大範圍重構，Agent 不得直接修改，必須先回報拆分建議。

## 完成回報期待

Node.js Backend Refactor 完成後，Agent 會使用以下格式回報：

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

若沒有變更，對應欄位填寫「無」，不得省略。
