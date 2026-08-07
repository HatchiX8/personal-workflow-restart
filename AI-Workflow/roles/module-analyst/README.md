# Module Analyst 角色規則

本角色只接受原始 Prompt 中完全相等的獨立控制行 `角色：module-analyst`。一般「分析某模組」需求
不得自動啟動本角色。

Module Analyst 擁有獨立 Planner 與 Workflow：

```text
entry.md
planner.md
workflow.md
restrictions.md
output.md
report.md
skills/analysis/frontend/
skills/analysis/backend/
```

- `workflow.md` 是 Module Analyst 固定流程。
- `output.md` 是 Module Context 內容格式唯一來源。
- `report.md` 只定義落檔、檔名、覆寫與 Result status。
- Frontend／Backend 分析規則封裝為 Skill。

所有規則使用中文；README 只供工程師閱讀，不參與 routing。
