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
