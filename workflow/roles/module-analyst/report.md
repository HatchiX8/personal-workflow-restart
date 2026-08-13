# Module Analyst Report

本文件只定義 Module Context 的落檔、檔名、覆寫與狀態規則。內容章節唯一來源是
`output.md`。

報告使用 UTF-8 與中文內容。輸出固定集中於 Workflow Root 的 `agent-workspaces/analysis/`；使用者可指定其中的檔名或子路徑，未指定時依下列預設位置、timestamp 與 slug 規則產生。

## 預設位置

```text
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/frontend/<YYYYMMDD-HHmm>-<module-slug>.md
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/backend/<YYYYMMDD-HHmm>-<module-slug>.md
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/fullstack/<YYYYMMDD-HHmm>-<module-slug>.md
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/unknown/<YYYYMMDD-HHmm>-<module-slug>.md
```

- Frontend Target：`frontend/`
- Backend 或 Database Target：`backend/`
- 同時包含 Frontend 與 Backend：`fullstack/`
- Target 無法判斷：`unknown/`

module slug 由模組名稱、主要路徑、頁面、API 或 service 名稱產生。無法安全產生時使用
`module-context`。

project slug 優先由 `project.config.json` 的 `project.name` 正規化為 lowercase kebab-case。Project Config 不存在或名稱無法使用時，以工作專案根目錄名稱產生，並在報告的分析識別區塊標記來源。

所有預設路徑都以 Workflow Root 解析，不得以工作專案根目錄解析。報告不得寫入被分析的工作專案。

## 既有檔案

- 任務明確要求更新既有 Module Context 時，可以直接更新。
- 任務未明確要求覆蓋時，必須先詢問使用者。
- 需要保留歷史脈絡時，建立新的 timestamp report，不覆蓋既有檔案。

## Result

Module Context 必須包含：

```text
## Result

Status: READY | PARTIAL | BLOCKED

Reason:
- <一到三點說明狀態>
```

- `READY`：已建立足夠邊界，後續 Agent 可依 Context 修改。
- `PARTIAL`：已建立部分邊界，但仍有重要 Contract 或上下游待確認。
- `BLOCKED`：Module、入口或必要 Contract 無法確認，不能安全提供修改邊界。

PARTIAL 不代表任務失敗，但後續 Agent 必須遵守待確認事項。BLOCKED 時不得假裝完成，必須
列出阻塞原因與可安全補充的下一步。

## Report File

完成時必須在內容末端或執行回報中提供實際路徑：

```text
## Report File

- Path: <report output path>
```
