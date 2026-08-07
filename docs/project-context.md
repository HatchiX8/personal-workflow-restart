# Project／Module Context 設定

Project Context 與 Module Context 是選用資訊。新專案可以先保留：

```json
{
  "project_contexts": [],
  "module_registry": null
}
```

## Project Context

需要提供專案共用背景時，先在專案內建立 Context 文件，再登錄到 `project.config.json`：

```json
{
  "project_contexts": [
    {
      "context_id": "project-context.current",
      "path": "ai-context/project.md",
      "status": "current",
      "current": true,
      "targets": []
    }
  ]
}
```

Context 路徑一律相對於 Project Root。只有 `current=true`、專案身分相符且 Target 相容的 Context
可以自動載入。

## Module Context

Module Context 必須透過專案自己的 Module Registry 登錄，並完成 `project_id`、`module_id`、Target
與 current pointer 綁定。不相容、無法唯一識別或跨專案的 Context 不會載入。

這項設定只用於重用已存在的 Module Context，不是執行 Module Analyst 的前置條件。要求分析某個
明確命名的模組時，Module Analyst 會以名稱為搜尋種子，直接從 Project Root 的 repository evidence
建立檔案範圍；不需要先設定 `module_registry`、alias 或每個檔案路徑，也不會載入既有 Module
Context 代替本次探索。

## Required Context

Context 預設為選用；缺少、未綁定或過期時只提出警告。只有專案確實需要嚴格模式時，才設定：

```json
{
  "context_policy": {
    "require_project_context_for": [],
    "require_module_context_for": []
  }
}
```

可使用的 Action 為 `develop`、`review`、`analyze`。將 Action 加入對應陣列後，該類任務缺少必要
Context 時會停止執行。

`context_policy` 只接受文件與 Schema 明列的欄位；未知欄位或不合法 Action 會被 Runtime 阻擋，
避免設定拼錯後靜默失效。

舊版的 `context_policy.high_risk_conditions` 已棄用且不參與 Task Risk。為了讓既有專案平順升級，
2.x 仍接受此欄位，但 Runtime 會回傳 `DEPRECATED_PROJECT_CONFIG_FIELD` diagnostic。新專案與 template
不應再加入；Task Risk 一律由中央 `task-risk-policy.json` 與 Task Manifest provenance 決定。
