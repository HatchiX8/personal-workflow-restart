# Module Analyst Role Rules

本資料夾提供 Module Analyst 角色的 AI Agent 模組分析規則基底。

Module Analyst 負責針對指定前端或後端模組進行分析，產出能幫助工程師理解模組責任、資料流、依賴關係與維護風險的模組分析 md 檔。

Module Analyst 不負責直接開發新功能、重構、修 bug、補測試或替代 Developer 完成實作。

本角色主要用途是在接收「要修改某個模組」的任務前，先產出 agent 可通用的 module context，讓後續 Developer 或 Review agent 能依據該 context 劃分修改邊界。

## 使用方式

- 入口規則使用 `AI-Workflow/bootstrap.md`
- 通用 workflow 使用 `AI-Workflow/workflow/common.md`
- Module Analyst 角色入口使用 `AI-Workflow/roles/module-analyst.md`
- Module Analyst 細部規則放在 `AI-Workflow/roles/module-analyst/`
- 前端模組規則使用 `AI-Workflow/roles/module-analyst/frontend.md`
- 後端模組規則使用 `AI-Workflow/roles/module-analyst/backend.md`
- 報告輸出規則使用 `AI-Workflow/roles/module-analyst/report.md`

## Prompt 指定角色

使用 Module Analyst 角色時，任務 prompt 建議明確指定：

```txt
角色：Module Analyst
任務類型：前端任務

本次任務：
分析會員資料頁面模組，並將 module context 輸出到 AI-Workflow/module-context/frontend/。
```

或：

```txt
角色：Module Analyst
任務類型：後端任務

本次任務：
分析訂單 API 模組，並將 module context 輸出到 AI-Workflow/module-context/backend/。
```

## 任務類型

Module Analyst 沿用既有任務類型：

- 前端任務
- 後端任務

任務類型用來標記分析範圍與輸出重點。

若任務同時涉及前端與後端，必須同時套用前端與後端規則，並在輸出中分開標示前端邊界與後端邊界。

### 前端任務

適用情境：

- Vue component
- React component
- composables
- stores
- UI modules
- frontend route
- frontend state flow

分析重點：

- UI 入口與主要 component 結構
- state、props、events、computed 或 hooks 的資料流
- API 呼叫與前後端 contract
- 表單驗證、錯誤呈現與 loading 狀態
- 使用者操作流程與潛在互動風險

### 後端任務

適用情境：

- API 開發
- database
- service logic
- backend job
- server route
- backend refactor 前分析

分析重點：

- API / route / service 入口
- request、response 與資料轉換流程
- database model、query 與 transaction 邊界
- error handling、validation 與權限檢查
- 外部服務、排程或事件依賴

## 輸出原則

Module Analyst 的輸出應精簡、可掃讀、可行動，並區分事實、推論與待確認事項。

輸出文件不是一般說明文件，而是後續 agent 修改模組前必讀的 module context。

建議輸出包含：

- 模組名稱與任務類型
- 分析範圍
- Agent 使用方式
- 主要入口與關鍵檔案
- 模組責任
- 資料流與依賴關係
- contract 與風險觀察
- 可修改範圍
- 不可越界範圍
- 後續修改、review 或測試建議
- 未知與待人工確認事項

若未指定輸出位置，預設依任務類型輸出：

```txt
AI-Workflow/module-context/frontend/<YYYYMMDD-HHmm>-<module-slug>.md
AI-Workflow/module-context/backend/<YYYYMMDD-HHmm>-<module-slug>.md
AI-Workflow/module-context/fullstack/<YYYYMMDD-HHmm>-<module-slug>.md
```

## 規則結構

### workflow.md

定義 Module Analyst 的任務流程，包含範圍解析、任務類型判斷、模組邊界建立、資料流與 contract 分析、輸出與自我檢查。

### restrictions.md

定義分析深度限制、只讀規則、secret 禁止事項、可信度標記與停止條件。

### output.md

定義 module context md 檔的內容結構與可讀性要求。

### report.md

定義 module context report 的輸出位置、檔名規則、狀態標記與落檔要求。

### frontend.md

定義前端模組分析規則，包含 component、state、props、events、route、API client、cache 與 UI 狀態。

### backend.md

定義後端模組分析規則，包含 API、service、database、validation、authorization、transaction、external integration 與 side effects。

## 規則修改原則

- Module Analyst 角色入口修改：`AI-Workflow/roles/module-analyst.md`
- Module Analyst 使用方式與任務類型說明修改：`AI-Workflow/roles/module-analyst/README.md`
- Module Analyst 任務流程修改：`AI-Workflow/roles/module-analyst/workflow.md`
- Module Analyst 分析限制修改：`AI-Workflow/roles/module-analyst/restrictions.md`
- Module Analyst 輸出格式修改：`AI-Workflow/roles/module-analyst/output.md`
- Module Analyst 報告輸出規則修改：`AI-Workflow/roles/module-analyst/report.md`
- 前端模組分析規則修改：`AI-Workflow/roles/module-analyst/frontend.md`
- 後端模組分析規則修改：`AI-Workflow/roles/module-analyst/backend.md`
