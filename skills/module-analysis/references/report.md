# Module Context Report

預設位置：

```text
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/frontend/<YYYYMMDD-HHmm>-<module-slug>.md
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/backend/<YYYYMMDD-HHmm>-<module-slug>.md
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/fullstack/<YYYYMMDD-HHmm>-<module-slug>.md
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/unknown/<YYYYMMDD-HHmm>-<module-slug>.md
```

target 為 frontend、backend／database、跨前後端或無法判斷時，分別使用 frontend、backend、fullstack、unknown 目錄。project slug 的規則與 `project-analysis` 相同；module slug 由模組名稱、主要路徑、頁面、API 或 service 名稱產生，無法安全產生時使用 `module-context`。

未明確要求更新既有 context 時，建立新的 timestamp 報告；需要更新指定檔案可直接更新。完成時提供實際路徑。

文件必須包含：

```text
## Result

Status: READY | PARTIAL | BLOCKED

Reason:
- <一到三點說明>
```

- READY：入口、主要 contract 與修改邊界足夠清楚。
- PARTIAL：可用但仍有重要 contract 或上下游待確認。
- BLOCKED：無法安全確認入口、必要 contract 或可修改邊界。
