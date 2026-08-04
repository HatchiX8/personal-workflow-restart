# Catalog 維護說明

`catalog/` 保存集中式 Workflow 可辨識的穩定業務名稱，不保存任何專案產物、Context 路徑、
current pointer 或專案綁定。

## Module Catalog

`modules.json` 是 Module 身分的最小來源，只包含：

- `module_id`：穩定且唯一的 canonical ID。
- `display_name`：工程師閱讀用名稱。
- `aliases`：Task Analysis 可辨識的名稱或中文別名。

例如：

```json
{
  "module_id": "lunch",
  "display_name": "Lunch",
  "aliases": ["lunch", "午餐"]
}
```

Catalog 不得包含：

- `project_id` 或 Project Root。
- `agent-workspaces/` 下的 Project Analysis、Module Context 或 Review 路徑。
- Context status、current pointer、Target binding 或 load policy。
- 只適用單一專案的臨時模組名稱。

## 與 Registry 的差異

```text
catalog/modules.json
  -> 提供穩定 Module ID、名稱與 alias

registry/modules.json
  -> 提供 Agent 執行時使用的 Module 狀態、專案綁定與 Context 選取契約

<PROJECT_ROOT>/agent-workspaces/
  -> 保存各專案實際產生的 Markdown 產物
```

Agent routing 直接讀取的是 `registry/modules.json`，不是 Catalog。Catalog 是 Module Registry 的
來源與 snapshot provenance，避免 Registry 再依賴集中式 Workflow 內的專案 Context 文件。

## 新增或調整 Module

目前尚未提供 Module Registry 自動生成工具。新增或調整 Module 時：

1. 更新 `catalog/modules.json` 的 Module ID、名稱與 aliases。
2. 同步更新 `registry/modules.json` 的對應 Module runtime entry。
3. 不要在上述兩個集中式檔案加入專案產物路徑；Context 綁定應由各專案設定維護。
4. 執行：

```powershell
node AI-Workflow/tools/refresh-registry-snapshots.mjs
node AI-Workflow/tests/validate-workflow.mjs
```

Registry snapshot 未同步或驗證失敗時，不得將修改視為完成。
