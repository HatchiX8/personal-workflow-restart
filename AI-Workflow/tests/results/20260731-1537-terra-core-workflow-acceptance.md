# Terra 核心 Workflow 驗收報告

## 驗收設定

- 模型：`gpt-5.6-terra`
- 推理強度：`medium`
- 情境數：6
- 執行方式：每個情境使用全新 Agent
- 停止點：Rule Resolution
- 實際任務：未執行
- 規則與專案檔案：未修改

所有成功案例皆由專案根目錄 `AGENTS.md` 進入：

```text
AI-Workflow/bootstrap.md
AI-Workflow/orchestration/dispatcher.md
AI-Workflow/orchestration/task-analysis.md
AI-Workflow/orchestration/role-planner.md
AI-Workflow/orchestration/rule-resolution.md
AI-Workflow/orchestration/context-resolution.md
```

## 結果摘要

| 情境 | 結果 | 備註 |
|---|---|---|
| Developer：指定角色、指定 Skill | PASS | 正確載入前端、Vue、架構與專案結構 Skill |
| Review：指定角色、未指定 Skill | PASS | 正確自動載入 Backend Review Skill |
| Module Analyst：指定角色、指定 Skill | FAIL | Module Context 在 Planner 階段阻擋，未進入 Rule Resolution |
| Project Analyst：指定角色、未指定 Skill | PASS | 正確載入角色 Workflow，Skill 為空 |
| 未指定角色、未指定 Skill | PASS | 正確推導 Developer 與 Node.js 重構 Skill |
| 未指定角色、指定 Skill | PASS（重跑確認） | 首次漏載 Backend Base，重跑後完整載入 |

總結：5 項通過，1 項失敗；其中 1 項需重跑才得到完整結果。

## 情境一：Developer

```text
驗收結果：PASS
指定角色：developer
指定 Skill：developer.project-structure
本次任務：Vue 前端訂單列表元件資料夾分層調整
推導 Action：develop
推導角色：developer

讀取核心 Workflow：
- AI-Workflow/bootstrap.md
- AI-Workflow/orchestration/dispatcher.md
- AI-Workflow/orchestration/task-analysis.md
- AI-Workflow/orchestration/role-planner.md
- AI-Workflow/orchestration/rule-resolution.md
- AI-Workflow/orchestration/context-resolution.md

讀取角色 Workflow：
- AI-Workflow/roles/developer/planner.md
- AI-Workflow/roles/developer/entry.md
- AI-Workflow/roles/developer/restrictions.md
- AI-Workflow/roles/developer/core.md
- AI-Workflow/roles/developer/workflow.md
- AI-Workflow/roles/developer/validation.md
- AI-Workflow/roles/developer/output.md

讀取 Skill：
- AI-Workflow/roles/developer/skills/frontend/base/rules.md
- AI-Workflow/roles/developer/skills/frontend/vue/rules.md
- AI-Workflow/roles/developer/skills/architecture/structure-change/rules.md
- AI-Workflow/roles/developer/skills/project-policy/project-structure/rules.md
- AI-Workflow/roles/developer/skills/refactor/general/rules.md

未解析項目：無
```

## 情境二：Review

```text
驗收結果：PASS
指定角色：review
指定 Skill：無
本次任務：後端訂單 API staged changes Review
推導 Action：review
推導角色：review

讀取核心 Workflow：
- AI-Workflow/bootstrap.md
- AI-Workflow/orchestration/dispatcher.md
- AI-Workflow/orchestration/task-analysis.md
- AI-Workflow/orchestration/role-planner.md
- AI-Workflow/orchestration/rule-resolution.md
- AI-Workflow/orchestration/context-resolution.md

讀取角色 Workflow：
- AI-Workflow/roles/review/planner.md
- AI-Workflow/roles/review/entry.md
- AI-Workflow/roles/review/workflow.md
- AI-Workflow/roles/review/restrictions.md
- AI-Workflow/roles/review/pass-conditions.md
- AI-Workflow/roles/review/output.md
- AI-Workflow/roles/review/checks/common.md
- AI-Workflow/roles/review/modes/change/entry.md
- AI-Workflow/roles/review/modes/change/workflow.md
- AI-Workflow/roles/review/modes/change/restrictions.md
- AI-Workflow/roles/review/modes/change/report.md
- AI-Workflow/roles/review/modes/change/pass-conditions.md

讀取 Skill：
- AI-Workflow/roles/review/skills/checks/backend/rules.md

未解析項目：無
```

## 情境三：Module Analyst

```text
驗收結果：FAIL
指定角色：module-analyst
指定 Skill：module-analyst.frontend
本次任務：Lunch 模組前後端邊界、資料流與 API contract 分析
推導 Action：analyze
推導角色：module-analyst

讀取核心 Workflow：
- AI-Workflow/bootstrap.md
- AI-Workflow/orchestration/dispatcher.md
- AI-Workflow/orchestration/task-analysis.md
- AI-Workflow/orchestration/role-planner.md

讀取角色 Workflow：
- AI-Workflow/roles/module-analyst/planner.md

讀取 Skill：
- 無

未解析項目：
- lunch frontend Module Context 未綁定且非 current
- lunch backend Module Context 未綁定且非 current

備註：
- 兩次獨立 Terra 驗收結果一致。
- Role 與指定 Skill 可辨識，但 Planner 先依 Context 條件輸出 needs-resolution。
- 因 Dispatcher 在 Rule Resolution 前停止，未實際載入 Skill rules.md。
```

## 情境四：Project Analyst

```text
驗收結果：PASS
指定角色：project-analyst
指定 Skill：無
本次任務：專案技術棧、入口、資料夾責任與團隊風格分析
推導 Action：analyze
推導角色：project-analyst

讀取核心 Workflow：
- AI-Workflow/bootstrap.md
- AI-Workflow/orchestration/dispatcher.md
- AI-Workflow/orchestration/task-analysis.md
- AI-Workflow/orchestration/role-planner.md
- AI-Workflow/orchestration/rule-resolution.md
- AI-Workflow/orchestration/context-resolution.md

讀取角色 Workflow：
- AI-Workflow/roles/project-analyst/planner.md
- AI-Workflow/roles/project-analyst/entry.md
- AI-Workflow/roles/project-analyst/restrictions.md
- AI-Workflow/roles/project-analyst/workflow.md
- AI-Workflow/roles/project-analyst/identify-project.md
- AI-Workflow/roles/project-analyst/team-style.md
- AI-Workflow/roles/project-analyst/output.md

讀取 Skill：
- 無

未解析項目：無
```

## 情境五：未指定角色與 Skill

```text
驗收結果：PASS
指定角色：無
指定 Skill：無
本次任務：Node.js 後端訂單服務重構
推導 Action：develop
推導角色：developer

讀取核心 Workflow：
- AI-Workflow/bootstrap.md
- AI-Workflow/orchestration/dispatcher.md
- AI-Workflow/orchestration/task-analysis.md
- AI-Workflow/orchestration/role-planner.md
- AI-Workflow/orchestration/rule-resolution.md
- AI-Workflow/orchestration/context-resolution.md

讀取角色 Workflow：
- AI-Workflow/roles/developer/planner.md
- AI-Workflow/roles/developer/entry.md
- AI-Workflow/roles/developer/restrictions.md
- AI-Workflow/roles/developer/core.md
- AI-Workflow/roles/developer/workflow.md
- AI-Workflow/roles/developer/validation.md
- AI-Workflow/roles/developer/output.md

讀取 Skill：
- AI-Workflow/roles/developer/skills/backend/base/rules.md
- AI-Workflow/roles/developer/skills/refactor/general/rules.md
- AI-Workflow/roles/developer/skills/refactor/node-backend/rules.md

未解析項目：無
```

## 情境六：未指定角色、指定 Skill

```text
驗收結果：PASS（重跑確認）
指定角色：無
指定 Skill：developer.net-api-development
本次任務：.NET 後端訂單 API validation 與錯誤回應調整
推導 Action：develop
推導角色：developer

讀取核心 Workflow：
- AI-Workflow/bootstrap.md
- AI-Workflow/orchestration/dispatcher.md
- AI-Workflow/orchestration/task-analysis.md
- AI-Workflow/orchestration/role-planner.md
- AI-Workflow/orchestration/rule-resolution.md
- AI-Workflow/orchestration/context-resolution.md

讀取角色 Workflow：
- AI-Workflow/roles/developer/planner.md
- AI-Workflow/roles/developer/entry.md
- AI-Workflow/roles/developer/restrictions.md
- AI-Workflow/roles/developer/core.md
- AI-Workflow/roles/developer/workflow.md
- AI-Workflow/roles/developer/validation.md
- AI-Workflow/roles/developer/output.md

讀取 Skill：
- AI-Workflow/roles/developer/skills/backend/net-api/rules.md
- AI-Workflow/roles/developer/skills/backend/base/rules.md

未解析項目：無

備註：
- 首次執行只載入明確指定的 net-api Skill，漏載 Backend Base。
- 第二次使用相同模型與 Prompt 時，已依 target=backend 正確載入 Backend Base。
- 規則可完成路由，但此案例顯示模型執行存在一次性解析不穩定。
```

## 驗收結論

集中式 `AGENTS.md -> bootstrap.md` 入口、角色推導與大部分 Skill 選取均可運作。未指定角色的兩個
Developer 情境也能完成角色推導。

目前唯一穩定阻擋點是 Module Analyst：角色 Planner 將 Module Context 完整性設為進入 Rule
Resolution 前的必要條件，與本輪「先取得角色與 Skill，再於後續 Context／Preflight 驗證」的驗收
目標不一致。
