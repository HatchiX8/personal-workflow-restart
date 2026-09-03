# API 設計審核提案

本 reference 定義從頁面、模組或 User Flow 設計 API 時的審核產物。目標是讓人或 Agent 快速確認 API 覆蓋度與 Request／Response，同時保留後續轉寫 OpenAPI 所需資訊。

## 範圍

- 預設以單一頁面、模組或完整 User Flow 為一份提案。
- 建議每份提案聚焦約 2～5 支高度相關端點；若完整流程需要更多端點，可以超出此範圍，但須按子流程分段。
- 多個頁面或模組先建立端點總覽，再產出個別審核單位。共用端點只在擁有它的單位完整定義，其他單位以 Endpoint ID 引用。

## 文件模板

```markdown
# [模組或 User Flow] API 設計審核

狀態：Draft

## 範圍與端點總覽

| 使用者操作 | Endpoint ID | Method | Path | 用途 |
| --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... |

## 共用 Contract

只列出本審核單位需要、且不在端點內重複的 Authentication、Header、錯誤格式、共用 Schema 或版本規則。沒有時省略。

## [Endpoint ID]｜[用途]

用途：[觸發此 API 的頁面操作與預期結果]

`[METHOD] [PATH]`

### Request

Path parameters：

```ts
type PathParameters = { ... };
```

Query parameters：

```ts
type QueryParameters = { ... };
```

Request body：

```ts
type RequestBody = { ... };
```

只保留實際使用的 parameter 區塊。補充每個不會由型別直接表達的限制，例如範圍、格式、預設值、欄位互斥或擇一必填規則。

### Success response

Status：`[status] [reason]`

```ts
type Response = { ... };
```

### 流程相關錯誤

- `[status]`：[前端需要區分處理的商業情境與預期行為]

### 待確認

- `DEC-[MODULE]-001`：[未定義行為、影響與需要確認的選項]
```

## Contract 表達規則

### 型別與存在性

- `field: T`：必填且不可為 null。
- `field?: T`：optional；未傳時不存在。
- `field: T | null`：必填，但值可為 null。
- `field?: T | null`：optional，傳入時也可為 null；僅在兩者語意都需要時使用。
- enum 直接以 literal union 表達，例如 `"ACTIVE" | "INACTIVE"`。
- 陣列必須在完整父層結構中表達，例如 `containers: Array<{ items: Item[] }>`；不得只寫 `items[]`。
- 每個欄位獨立宣告；不得以 `before／after` 或 `currentHp／maxHp` 合併不同欄位。

### 限制與條件

在型別區塊後以簡短條列補充 OpenAPI 需要、但 TypeScript 型別不會表達的資訊：

- `format`，例如 UUID、ISO 8601。
- `minimum`、`maximum`、字串長度或 pattern。
- default。
- 欄位互斥、擇一必填、依另一欄位決定 required 的條件。
- 業務規則造成的 `409`、`422` 或其他流程錯誤。

範例 JSON 僅在巢狀資料、條件式 request 或前端呈現語意難以從型別看出時提供；範例不取代型別與限制。

### 共用資訊

只要 Authentication、Header、錯誤 envelope、versioning 或共用 Schema 適用於多支端點，就在「共用 Contract」定義一次。端點只描述例外，避免重複造成不同步。

### 待決策與核准

- 無法從需求可靠判定時，建立 `DEC-*`；不得假裝已決定。
- `DEC-*` 必須說明缺少什麼資訊與它會影響哪一段 Contract。
- 有阻塞 `DEC-*` 時，文件維持 `Draft` 或標示 `Blocked`。
- 僅當所有會改變 Contract 的決策都已確認時，才可將文件標記為 `Approved`。

## OpenAPI 交接檢查

標記 `Approved` 前，逐項確認：

- 每支端點都有唯一 ID、Method、Path、用途與成功 status。
- 所有參數都標示位置，所有 Body 與 Response 都有完整巢狀結構。
- required、optional、nullable、enum、format、限制與條件規則沒有靠範例隱含。
- 可重用資料結構已明確命名或在共用 Contract 中定義。
- 流程相關錯誤、狀態版本、冪等或併發規則已保留。
- 沒有阻塞 `DEC-*`。

OpenAPI 生成器只應接受符合此檢查、且狀態為 `Approved` 的文件。OpenAPI 生成後，它才是前端 Mock、前端型別與後端實作共用的正式 Contract。

## 人工審核交接

有待確認或待決策事項時，完成回覆應列出所有仍需回答的穩定 ID，並提供可直接接續 `api-contract-finalize` 的 Prompt。Prompt 必須帶入審核稿路徑，並保留逐項填答位置；不得要求使用者重新描述整份需求。

若使用者已在同一則訊息逐項回答，可直接請 `api-contract-finalize` 先完整稽核答案，再於同一輪更新 Markdown 與產生 OpenAPI。答案有遺漏、無法唯一轉成 Contract 或互相衝突時，該 Skill 會在任何寫檔前停止並要求補充。
