# AI-Workflow

本目錄是集中式 AI Workflow 的新架構骨架。

入口規則：

- `AI-Workflow/bootstrap.md`
- `AI-Workflow/workflow/common.md`

目前只有一個角色：

- Developer

目前規則搬移狀態：

- `AGENTS.md` → `AI-Workflow/bootstrap.md`
- `AGENTS.md` 的 Developer 規則 → `AI-Workflow/roles/developer.md`
- `agents/` → `AI-Workflow/roles/developer/`

全角色通用規則：

- UTF-8 檔案讀寫規則：`AI-Workflow/bootstrap.md`
- 必要規則檔案缺失處理：`AI-Workflow/bootstrap.md`
- 角色判斷流程：`AI-Workflow/bootstrap.md`
- 任務模式：`AI-Workflow/workflow/common.md`

## Prompt 指定角色

目前 bootstrap 只支援 Developer。

建議在 prompt 開頭指定角色：

```txt
角色：Developer
```

可同時指定任務類型、任務模式與 skill：

```txt
角色：Developer
任務類型：前端任務
任務模式：學習模式
指定 skill：project-structure

本次任務：
修改 AssetCard component 樣式。
```
