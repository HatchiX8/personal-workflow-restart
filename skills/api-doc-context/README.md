# API Doc Context

`api-doc-context` 有兩種用途：把既有 API 文件整理為可供開發、Review 與測試使用的 Contract；或從頁面、模組與 User Flow 產出可人工審核的 API 設計提案。

本文件提供使用者閱讀，不屬於 Agent 執行規則。

## 既有 API 文件

當 API 已有文件時，Skill 會確認來源、版本與適用範圍，整理本次需要的 Request、Response、錯誤與相容性限制。需要時也會以最小範圍比對 repository 現況，將文件、實作與衝突分開回報。

```text
角色：developer
個人 Skills：api-doc-context
API 文件：https://docs.example.com/orders/create
任務：依訂單建立 API 文件完成前端串接。
```

## API 設計審核

當 API 尚未存在、需要從需求設計時，Skill 會先產出精簡的審核提案。它的目標是確認頁面操作是否都有 API 支援，以及 Request／Response 是否符合前後端需求；不是一次產出冗長的正式規格。

```text
個人 Skills：api-doc-context
需求：為商品出庫頁設計 API。流程包含載入可出庫庫存、預覽出庫結果、確認出庫。
任務：產出 API 設計審核提案；以這個頁面流程為範圍。
```

提案會以模組或 User Flow 分組，包含端點用途、Method、Path、Request、Response、流程相關錯誤與 `DEC-*` 待決策項目。共用 Header、錯誤與 Schema 不會在每支 API 重複展開。

## 從審核到實作

```text
頁面／模組需求
  → API 設計審核提案（Draft）
  → 人工或 Agent 審核（Approved）
  → OpenAPI 正式 Contract
  → 前端型別與 Mock、後端 API 實作
```

核准前的 Markdown 必須保留 OpenAPI 所需的 Method、Path、參數位置、型別、required、nullable、巢狀結構、成功 status、流程錯誤與條件規則。OpenAPI 產生後，前後端應以 OpenAPI 作為正式 Contract。

## 限制

- 文件來源不明、版本不明或多份來源互相衝突時，Skill 會回報缺口而不猜測。
- 未確認的 API 行為會以 `DEC-*` 標示，不會自行補完。
- 預設不更新外部文件、不呼叫正式 API，也不建立具副作用的測試資料。
