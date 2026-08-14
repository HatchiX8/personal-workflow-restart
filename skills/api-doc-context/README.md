# API Doc Context

這個 Skill 用來把使用者指定的 API 文件轉成可實際用於開發、Review 與測試的 API Contract。文件可來自連結、工作區檔案、Notion 或其他目前可存取的文件平台。

本文件提供使用者閱讀，不屬於 Agent 執行規則。Agent 載入此 Skill 時只需要讀取 `SKILL.md`。

## 用在哪

### 依 API 文件開發

前端串接、後端實作或修改 API 行為前，先讀取使用者指定的正確文件，確認 Request、Response、錯誤與商業規則。

### 檢查 API 串接

Review 時，比對目前 diff、型別、資料 Mapping 與錯誤處理是否符合文件 Contract。

### 設計 API 驗收

搭配 `testing-workflow`，將成功、欄位錯誤、未授權與其他 API Contract 轉成驗收案例。

### 單獨釐清文件

不指定角色時，整理某支 API 的文件內容、版本差異或文件與既有實作的落差，不修改專案。

## 怎麼用

依指定文件完成 API 串接：

```text
角色：developer
個人 Skills：api-doc-context
API 文件：https://docs.example.com/orders/create
任務：依訂單建立 API 文件完成前端串接。
```

檢查 API 串接是否符合文件：

```text
角色：review
模式：change
個人 Skills：api-doc-context
API 文件：C:\\workspace\\docs\\orders-api.yaml
任務：檢查目前訂單 API 串接是否符合文件。
```

將文件轉成開發與測試依據：

```text
角色：developer
個人 Skills：api-doc-context, testing-workflow
API 文件來源：Notion／訂單建立 API
任務：完成訂單建立 API 串接，並驗證成功、欄位錯誤與未授權流程。
```

只整理 API 文件：

```text
個人 Skills：api-doc-context
API 文件：https://docs.example.com/auth/login
任務：整理會員登入 API 的 Request、Response、錯誤碼與已知限制。
```

## 執行效果

載入後，Agent 會先依你指定的來源取得文件，再整理本次任務相關的 API Contract。需要時，它會比對 repository 現況或 diff，將「文件定義」、「實際實作」、「衝突」與「未確認事項」分開回報。

文件平台或檔案讀取工具負責提供內容；Skill 則規定如何確認來源、如何抽取 Contract、何時停止並要求確認，以及最後該回報哪些證據。

## 可以改善什麼

- 避免只憑 API 名稱或範例 Payload 猜測欄位。
- 避免讀到舊版、錯環境或不相符的 API 文件後直接實作。
- 讓前端 Mapping、後端實作、Review 與測試共用同一份 Contract Context。
- 讓文件與程式碼不一致時有明確證據，而不是由 Agent 靜默選擇其中一方。
- 減少將未文件化行為誤認為 API 規格的風險。

## 目前限制

- 文件來源必須由使用者明確提供或能可靠定位。
- 讀取外部文件平台時，需要目前環境已連接且具備對應的唯讀能力。
- Skill 不綁定特定文件平台或工具名稱；來源變更時不需要重寫核心流程。
- 預設只讀取指定文件，不會自行更新文件。
- 不會對正式 API 發送請求或建立有副作用的測試資料。
