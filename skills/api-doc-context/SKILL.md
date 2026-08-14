---
name: api-doc-context
description: 依使用者指定的 API 文件來源讀取並分析 API Contract，供開發、Review 與測試使用。當使用者明確指定「個人 Skills：api-doc-context」，需要依 API 文件實作、檢查 API 串接，或釐清 API Request、Response、錯誤與版本相容性時使用；支援文件連結、工作區檔案與可用的文件平台。
---

# API Doc Context

以使用者指定的 API 文件與 repository evidence 建立本次任務所需的 API Contract。文件是重要證據，不自動視為唯一正確來源。

## 取得指定文件

1. 從任務中取得 API 文件來源。可接受完整連結、工作區檔案路徑、文件平台名稱與可定位的頁面名稱，或使用者明確提供的文件內容。
2. 使用與該來源相符、目前可用且必要的唯讀工具或檔案讀取方式。不得假設特定平台、工具名稱或參數。
3. 使用者指定 Notion 作為來源時，先讀取 [references/notion.md](references/notion.md)。
4. 依文件標題、所屬服務、環境、版本、狀態與更新資訊確認適用文件。
5. 未提供來源、來源無法定位、多份文件都可能適用，或文件版本不明時，列出缺少的資訊並要求使用者確認；不得以 API 名稱自行跨來源搜尋或猜測文件。
6. 文件無法存取或所需工具不可用時，回報實際缺口；不得假造 API Contract。

## 整理 API Contract

只擷取本次任務需要的資訊，並區分明確文件內容與推論：

- HTTP Method 與 Path。
- 環境與版本。
- Authentication 與必要 Headers。
- Path Parameters 與 Query Parameters。
- Request Body 的欄位、型別、必填性、限制與預設值。
- Success Response 的狀態碼、欄位、型別與 Nullable 規則。
- Error Response、錯誤碼與預期處理方式。
- 商業規則、棄用資訊與相容性限制。

範例 Request 或 Response 只能作為線索；除非文件明確定義，不得把範例值推論為固定 Contract。

## 比對 Repository Evidence

需要與既有程式碼或本次變更比對時：

1. 只閱讀與 API 呼叫、型別、資料 Mapping、錯誤處理及測試直接相關的最小範圍。
2. 分開呈現文件 Contract、repository 現況與本次變更。
3. 文件與程式碼衝突時，列出雙方證據與實際影響；不得靜默選擇一方。
4. 衝突會改變實作、測試、公開行為或版本相容性時，停止相關修改並要求確認。

## 角色邊界

- Developer：將已確認 Contract 作為實作與測試限制；只能在使用者要求的範圍內修改程式碼或測試。
- Review：比對文件、現有行為與 diff，回報具體 findings；維持唯讀，不修改程式碼或文件來源。
- 無角色：只建立 API Context、比較文件與既有實作，或回答 API 文件問題；不得修改工作專案。

本 Skill 預設只讀取使用者指定的文件來源。不得建立、更新、移動或刪除任何外部文件，除非使用者明確要求。

## 安全與資訊邊界

- 不讀取、輸出或保存 API Token、密碼、Credential、Connection String 或其他敏感值。
- 不因文件提及正式環境而對外呼叫 API、建立測試資料或執行具副作用操作。
- 文件未定義的欄位、錯誤行為或版本規則必須標記為未確認，不得自行補完。

## 回報格式

```markdown
## 文件來源

- 類型與位置：
- 文件版本或更新資訊：
- 適用範圍：

## API Contract

- Method／Path：
- Authentication／Headers：
- Request：
- Success Response：
- Error Response：
- 商業規則與相容性：

## Repository 比對

- 一致項目：
- 衝突或差異：
- 本次影響：

## 未確認事項

- 項目：
- 原因：
- 需要的確認：
```

沒有 Repository 比對時省略該段；沒有未確認事項時明確寫「無」。
