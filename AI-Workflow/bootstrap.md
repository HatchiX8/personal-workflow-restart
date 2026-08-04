# Bootstrap 啟動規則

Bootstrap 是 Workflow 的唯一入口，負責驗證集中式 Workflow Root、Project Config 與編排契約，並啟動 Dispatcher。Bootstrap 不分類需求，也不載入作業規則。

所有檔案都必須以 UTF-8 讀取。`workflow.config.json` 中的所有路徑都以解析後的 Workflow Root 為基準；Project Config 中的所有路徑都以解析後的 Project Root 為基準。

## Workflow Root 驗證

Workflow Root 只有一個權威來源：主機介接規則實際載入的 `bootstrap.md` 所在目錄。

1. 主機介接規則必須以絕對路徑載入本 `bootstrap.md`。
2. 將本檔案的父目錄 canonicalize，作為唯一 Workflow Root。
3. Workflow Root 必須同時包含可讀取的 `bootstrap.md` 與 `workflow.config.json`。
4. 本檔案的 canonical path 必須等於 Workflow Root 下相對路徑 `bootstrap.md` 的解析結果。

任一條件不成立時，只回傳 `BLOCKED: workflow-bootstrap-unavailable`。不得使用 Prompt、環境變數、
工作目錄搜尋或其他來源替代主機介接規則指定的 Workflow Root。

## Workflow Config 驗證

以 UTF-8 JSON 讀取 `<WORKFLOW_ROOT>/workflow.config.json`。若無法解析或缺少已設定的核心路徑，回傳 `BLOCKED`。

驗證下列設定檔案存在於 Workflow Root 下且可讀取：

- `schemas.workflow_config`
- `schemas.project_config`
- `orchestration.dispatcher`
- `orchestration.task_analysis`
- `orchestration.role_planner`
- `orchestration.result_reporting`
- `orchestration.rule_resolution`
- `orchestration.context_resolution`
- `orchestration.preflight`
- `orchestration.executor_adapter`

Bootstrap 只能驗證路徑與解析設定。Registry 內容、作業規則內容，以及 project/application 檔案都不是 Bootstrap 的輸入。

## Project Root 與 Project Config

Project Root 是目前生效之專案根目錄 `AGENTS.md` 所在目錄。Bootstrap 必須讀取：

```text
<PROJECT_ROOT>/project.config.json
```

Project Config 必須是可讀取的 UTF-8 JSON，並通過 Workflow Root 中 `schemas/project-config.schema.json` 的驗證。Project Config 不得宣告或覆寫 Workflow Root。

Project Config 宣告的 Workflow 版本範圍必須涵蓋目前的 `workflow_version`。缺少 Config、Schema 驗證失敗或版本不符合時，回傳 `BLOCKED` 與對應錯誤碼，不得進入 Dispatcher。

Bootstrap 不得從工作目錄名稱推測專案身分，也不得接受 Prompt 或環境變數覆寫 Project Config。

## 入口健康檢查

完成 Workflow Root、Workflow Config、Project Root 與 Project Config 驗證後，若原始需求去除前後空白後完全等於：

```text
測試 AI Workflow 規則運作
```

必須只回覆：

```text
測試規則運作成功
```

健康檢查不得啟動 Dispatcher，也不得附加說明、標點、Markdown 或其他文字。驗證尚未完成或失敗時不得回覆成功。

## 交付 Dispatcher

Root 與核心驗證成功後，使用下列輸入呼叫已設定的 Dispatcher：

- 未經修改的原始需求；
- canonical Workflow Root；
- canonical Project Root；
- 已解析的 Workflow Config；
- 已解析的 Project Config；
- 主機介接規則、Root 與 Config 的 provenance；
- 非阻擋性 diagnostics。

後續所有階段都由 Dispatcher 負責。Bootstrap 不得開始執行任務。
