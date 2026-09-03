---
name: api-doc-context
description: 從指定 API 文件建立可供開發、Review 與測試使用的 Contract，或從頁面、模組與 User Flow 產出可審核並可轉寫為 OpenAPI 的 API 設計提案。當使用者明確指定「個人 Skills：api-doc-context」並需要釐清既有 API、檢查串接，或設計 API Request、Response 與流程契約時使用。
---

# API Doc Context

依任務意圖在「既有 Contract Context」與「API 設計審核」兩種模式間選擇。文件是重要證據，不自動視為唯一正確來源；設計提案則必須清楚區分已確認需求、建議與待決策事項。

## 模式選擇

### 既有 Contract Context

使用者提供 API 文件、文件連結或可定位文件來源，並要求實作、Review、測試、比對或釐清既有 API 時使用本模式。

1. 取得指定文件。可接受完整連結、工作區檔案、文件平台名稱與可定位頁面，或使用者提供的內容。
2. 使用與來源相符、必要的唯讀方式讀取。指定 Notion 時先讀取 [references/notion.md](references/notion.md)。
3. 依標題、服務、環境、版本、狀態與更新資訊確認適用文件。來源無法定位、版本不明或多份文件都可能適用時，列出缺口並要求確認；不得依 API 名稱自行跨來源猜測。
4. 只擷取本次任務所需的 Method、Path、Authentication、Headers、Parameters、Request、Success Response、Error Response、商業規則、棄用資訊與相容性限制。
5. 範例 Payload 只能作為線索，除非文件明確定義，不得把範例值視為固定 Contract。

需要與 repository evidence 比對時，只讀取 API 呼叫、型別、資料 mapping、錯誤處理與測試的最小直接範圍。分開呈現文件 Contract、repository 現況與本次變更；衝突會改變實作、測試、公開行為或相容性時，停止受影響修改並要求確認。

### API 設計審核

使用者提供頁面、模組、User Story、線稿或流程需求，並要求設計 API、建立 API 草案、確認 Request／Response 或為後續 OpenAPI 做準備時使用本模式。此模式的產物是設計提案，不是假裝已存在的 API 文件。

先讀取 [references/api-design-review.md](references/api-design-review.md)，再依下列原則產出：

1. 以單一頁面、模組或完整 User Flow 作為預設審核單位。多頁面或跨模組需求先提供端點總覽，並按流程分組；不要將無關流程堆成單一長文件。
2. 優先讓使用者審核操作是否被涵蓋，以及 Request／Response 是否符合需求。只保留會影響這些判斷與後續 OpenAPI 的 Contract 資訊。
3. 共用 Authentication、Header、錯誤格式與 Schema 只定義一次；各端點只說明例外與流程相關錯誤。Repository 比對、來源追溯與內部實作細節僅在使用者要求或確實影響設計時加入。
4. 對尚未決定的行為建立穩定的 `DEC-*` 項目，說明問題、影響與需要確認的選項。不得自行補完未定義的欄位、規則或錯誤行為。
5. 文件狀態只能是 `Draft`、`Approved` 或 `Blocked`。存在會改變 Contract 的未決 `DEC-*` 時，不得標示為 `Approved`。

## OpenAPI 可轉換性

設計審核文件在核准前供人或 Agent 檢查；核准後是後續 OpenAPI 生成的唯一設計輸入。每個已核准端點都必須明確保留：

- Endpoint ID、用途、HTTP Method 與 Path。
- Path、Query、Header 與 Body 的欄位位置。
- 型別、required、optional、nullable、enum、default、format 與驗證限制。
- 巢狀物件與陣列的完整父子結構。
- 成功 status 與 Response 結構。
- 流程相關錯誤 status、條件規則與共用 Schema 關係。

不得以合併欄位、失去父層的扁平陣列路徑，或未說明的範例值表達 Contract。`field?: T` 只表示 optional；`field: T | null` 表示必填且允許 null。擇一必填或其他條件規則必須明確寫出。

後續 OpenAPI 生成只能使用狀態為 `Approved`、且沒有阻塞 `DEC-*` 的設計文件。OpenAPI 產生後，OpenAPI 才是前端 Mock、前端型別與後端實作共用的正式 Contract。

## 角色與安全邊界

- Developer：將已確認 Contract 作為實作與測試限制；只能在使用者要求範圍內修改程式碼或測試。
- Review：比對 Contract、現有行為與 diff，回報具體 findings；維持唯讀，不修改程式碼或文件來源。
- 無角色：只建立 API Context、設計提案或比較文件與實作；不得修改工作專案。

本 Skill 預設只讀取使用者指定來源。不得建立、更新、移動或刪除外部文件，除非使用者明確要求。不得讀取、輸出或保存 token、密碼、Credential、Connection String 或其他敏感值；不得因文件提及正式環境而呼叫 API、建立測試資料或進行具副作用操作。

## 回報

既有 Contract Context 模式以文件來源、適用範圍、API Contract、必要的 repository 比對與未確認事項回報。沒有 repository 比對時省略該段；沒有未確認事項時明確寫「無」。

API 設計審核模式使用 [references/api-design-review.md](references/api-design-review.md) 的格式；不得在主要審核動線混入完整來源追溯或重複的共用 Contract。

審核稿仍有 `DEC-*` 或其他待確認事項時，回覆結尾必須提供可直接接續的 Prompt，讓使用者補齊答案後呼叫 `api-contract-finalize`：

```text
角色：developer
個人 Skills：api-contract-finalize
任務：依下列決策收斂 [審核稿路徑]，確認沒有遺漏或矛盾後更新 Markdown 並產生單一 OpenAPI YAML；若資訊不足請在寫檔前停止。
決策：
- DEC-...：...
```

不要在本 Skill 中先替使用者解決未定事項，也不要在仍有阻塞決策時產生 OpenAPI。
