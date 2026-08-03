# Developer 角色規則

Developer 擁有獨立 Planner 與固定 Workflow：

```text
entry.md
planner.md
core.md
restrictions.md
workflow.md
validation.md
output.md
skills/
```

## 核心責任

- `entry.md`：驗證已凍結的 Task Manifest、Role Plan、Rule Set 與 Execution Contract。
- `planner.md`：根據 Task Manifest 與 Repository Evidence 產生 Role Plan，不直接指定 Skill ID。
- `workflow.md`：固定執行理解、規劃、實作、驗證、自我檢查與回報。
- `core.md`、`restrictions.md`：保存所有 Developer 任務都必須遵守的核心原則與限制。
- `validation.md`、`output.md`：定義固定驗證與回報責任。

## Skill 套件

前端、後端、Language、Runtime、Framework、工具、重構與正式工作紀錄都放在 `skills/`。
專案結構與專案特有限制由 Project Context 提供。每個 Skill 套件至少包含：

```text
skill.json
rules.md
README.md
```

- `skill.json` 是機器可讀的選取、相依、衝突、Scope 與版本契約。
- `rules.md` 是通過 Rule Resolution 後才載入的中文執行規則。
- `README.md` 只供工程師維護，不參與 routing。

新增或調整特規時，優先維護 Skill 套件，不修改 Developer 主 Workflow。完成後執行：

```powershell
node AI-Workflow/tools/build-skill-registry.mjs
node AI-Workflow/tests/validate-workflow.mjs
```

一般需求不必指定角色或 Skill；需要強制套用時，使用 Registry 中的精確 ID：

```text
角色：developer
Skill：developer.language.typescript

調整 TypeScript 前端訂單列表元件的資料型別。
```

本 README 僅供工程師理解目錄，不是 execution rule。
