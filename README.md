# Controlled Agent Workflow

這是一套由 Git 管理的個人 Agent Workflow。角色、共通規則與 Skills 集中保存在本 repository；其他工作專案只保留入口與專案設定，不需要複製整套規則。

## Repository 結構

```text
workflow/                       中央入口與 Workflow 規格
assistant/                      預設助理規則與個人互動偏好
workflow/roles/                 Developer、Review
workflow/roles/*/skills/        依槽位組合的角色 Skills
skills/                         使用者在 Prompt 明確指定的個人擴充 Skills
agent-workspaces/               集中保存本機分析報告，不寫入工作專案
AGENTS.md                       本 repository 自己使用的入口
project.config.json             本 repository 自己的專案設定
```

Workflow 內部運作方式請見 [`workflow/README.md`](workflow/README.md)，Project Config 完整格式請見 [`workflow/project-config.md`](workflow/project-config.md)。

## 導入其他專案

在工作專案根目錄建立 `AGENTS.md`：

```markdown
Encoding: UTF-8

開始工作前，必須直接以 UTF-8 讀取並遵守以下絕對路徑中的工作流程入口：

`C:\Users\MiLu\Desktop\個人用\agent\controlled-agent-workflow\workflow\entry.md`
```

完成後，未指定角色的一般提問會以助理模式直接處理，不需要建立 `project.config.json`。

若該工作專案需要使用 `developer` 或 `review`，再於同一層建立 `project.config.json`：

```json
{
  "version": 1,
  "project": {
    "name": "example-web",
    "root": "."
  },
  "stacks": [
    {
      "id": "web",
      "target": "frontend",
      "frameworks": ["vue"],
      "languages": ["typescript"],
      "runtimes": ["node-js"]
    }
  ],
  "rules": [],
  "validation": {
    "lint": "npm run lint",
    "typecheck": "npm run typecheck",
    "build": "npm run build",
    "test": "npm test"
  }
}
```

一般自然語言提問、討論與設計評估會留在助理模式。需要修改程式碼時明確指定 `developer`，需要正式檢查時明確指定 `review`。需要套用個人流程時，可使用 `個人 Skills：<skill-id>` 指定根目錄 `skills/` 中的 Skill；`project-analysis` 與 `module-analysis` 是獨立分析流程，不需指定角色。

## 更新

所有工作專案都直接讀取此 repository。更新規則並提交 Git 後，工作專案下次執行即會使用新版。

若移動本 repository，必須同步更新各工作專案 `AGENTS.md` 中的絕對路徑。需要讓不同專案固定在不同版本時，可再使用 Git tag、獨立 worktree 或版本化安裝目錄。
