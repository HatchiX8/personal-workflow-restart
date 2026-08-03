# 核心 Workflow 功能驗收情境

## 驗收目的

本輪只確認核心 Workflow 能完成：

```text
Bootstrap
  -> Dispatcher
  -> Task Analysis
  -> Role Planner
  -> Rule Resolution
```

每個情境取得 Resolved Rule Set 後立即停止，不進入 Preflight 後的 Role Entry，也不執行開發、
Review 或分析工作。

## 通過條件

每個情境都必須符合：

1. Bootstrap 能取得 Workflow Config 與 Project Config。
2. Task Analysis 產生 `status=analyzed` 的 Task Manifest。
3. Role、Action、模式與 Target 符合情境預期。
4. 對應角色 Planner 產生 `status=planned` 的 Role Plan。
5. Rule Resolution 載入角色核心規則。
6. 明確指定的 Skill 使用精確 Skill ID 載入。
7. 未指定 Skill 時，只依 Role Plan selectors 自動載入相關 Skill。
8. 不得載入其他角色的 Skill。

Develop 或 Review 的必要 Context 尚未綁定所造成的 Preflight BLOCKED，不屬於本輪失敗；本輪
只驗證角色與 Skill 已正確解析。Module Analysis 不要求既有 Context。

## 情境一：Developer／指定角色／指定 Skill

驗收面向：前端、TypeScript、明確 Language Skill。

```text
角色：developer
Skill：developer.language.typescript

調整 Vue 前端訂單列表元件的 TypeScript 資料型別，不要改變功能行為。
```

預期：

- Action：`develop`
- Role：`developer`
- Planner：`roles/developer/planner.md`
- Target：`frontend`
- 明確 Skill：`developer.language.typescript`
- 自動 Skill：`developer.frontend.base`
- 技術 Skill：若 Framework 證據達高信心，選取 `developer.frontend.vue`
- 不得選取 Review 或 Analyst Skill

## 情境二：Review／指定角色／未指定 Skill

驗收面向：後端 Review、由 selectors 自動選取檢查 Skill。

```text
角色：review

檢查目前 staged changes 中的後端訂單 API 修改，確認 request、response、錯誤處理與資料寫入是否符合需求。
```

預期：

- Action：`review`
- Role：`review`
- Planner：`roles/review/planner.md`
- Review Mode：`change`
- Target：`backend`
- 明確 Skill：無
- 自動 Skill：`review.check.backend`
- 必須包含：`review.check.common`
- 不得選取 `review.check.frontend`

## 情境三：Module Analyst／指定角色／指定 Skill

驗收面向：模組前後端分析、明確 Skill 與自動 Skill 同時存在。

```text
角色：module-analyst
Skill：module-analyst.frontend

分析 Lunch 模組的前後端邊界、資料流、API contract 與付款狀態更新流程，只產生模組分析所需的規則集合。
```

預期：

- Action：`analyze`
- Role：`module-analyst`
- Planner：`roles/module-analyst/planner.md`
- Analysis Mode：`module`
- Module：`lunch`
- Target：`frontend`、`backend`
- 明確 Skill：`module-analyst.frontend`
- 自動 Skill：`module-analyst.backend`
- 不得選取 Developer 的 Frontend／Backend Skill
- Lunch Context 尚未綁定時不得阻擋 Role Plan、Skill Resolution 或後續 Module Analysis

## 情境四：Project Analyst／指定角色／未指定 Skill

驗收面向：專案分析角色的核心 Workflow，以及目前沒有 active Skill 的合法情況。

```text
角色：project-analyst

分析目前專案的技術棧、主要入口、資料夾責任、團隊開發風格與新工程師建議閱讀順序。
```

預期：

- Action：`analyze`
- Role：`project-analyst`
- Planner：`roles/project-analyst/planner.md`
- Analysis Mode：`project`
- 明確 Skill：無
- 自動 Skill：無
- 必須取得 Project Analyst 核心規則
- Skill 清單為空是正確結果，不得使用其他角色 Skill 補值

## 情境五：未指定角色

此群組拆成兩個子情境，以覆蓋「未指定角色＋未指定 Skill」與「未指定角色＋指定 Skill」。

### 情境五 A：未指定角色／未指定 Skill

驗收面向：Node.js 後端重構，完全由需求推導 Role 與 Skill。

```text
重構 Node.js 後端訂單服務，移除 service 內的重複邏輯並維持既有 API 行為。
```

預期：

- Action：`develop`
- Role：`developer`
- Planner：`roles/developer/planner.md`
- Task Type：`refactor`
- Target：`backend`
- Runtime：`node-js`
- 明確 Skill：無
- 自動 Skill：`developer.backend.base`
- 自動 Skill：`developer.refactor.general`
- 自動 Skill：`developer.runtime.node-js`

### 情境五 B：未指定角色／指定 Skill

驗收面向：由明確 Language Skill 與任務內容共同推導 Developer。

```text
Skill：developer.language.typescript

調整 Node.js TypeScript 後端訂單 API 的 request validation 與錯誤回應，不改變既有 API 路徑。
```

預期：

- Action：`develop`
- Role：`developer`
- Planner：`roles/developer/planner.md`
- Target：`backend`
- 明確 Skill：`developer.language.typescript`
- 自動 Skill：`developer.backend.base`
- 自動 Skill：`developer.runtime.node-js`
- 不得因未指定角色而回退到預設 Role

## 覆蓋矩陣

| 情境 | 任務內容 | 指定角色 | 指定 Skill | 預期角色 |
|---|---|---:|---:|---|
| 一 | Vue／TypeScript 前端變更 | 是 | 是 | Developer |
| 二 | 後端 Review | 是 | 否 | Review |
| 三 | 模組前後端分析 | 是 | 是 | Module Analyst |
| 四 | 專案分析 | 是 | 否 | Project Analyst |
| 五 A | Node.js 後端重構 | 否 | 否 | Developer |
| 五 B | Node.js／TypeScript 後端 API | 否 | 是 | Developer |

## 驗收停止點

記錄下列產物後停止：

- Task Manifest 的 Action、Role、Target、Module 與角色模式。
- Role Plan 的 `planner_entry`、`skill_selectors` 與 status。
- Resolved Rule Set 的核心 Rule IDs 與 Skill IDs。
- 未解析項目或衝突。

不得執行 Role Entry，不得修改專案程式碼，也不需要驗證角色內部細項規則。
