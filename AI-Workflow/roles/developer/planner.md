# Developer 角色規劃器

## 責任

本 Planner 接收已完成的 Task Manifest，依 `orchestration/role-planner.md` 產生 Developer Role
Plan。它只推導 Developer 任務事實，不讀取 Skill 規則、不選 Skill ID，也不修改程式碼。

## 必要驗證

- `role_id=developer`
- `action=develop|analyze`
- Task Risk 已完成，Execution Profile 已選取，且兩者 Task ID 一致
- 至少一個 Target
- Scope、Project 與明確 Skill ID 已由 Task Analysis 固定

條件不成立時，設定 `status=needs-resolution`，不得使用預設 Frontend 或 Backend 替代。

## 任務事實

依任務與 repository evidence 產生下列高信心 facts：

- `task-type`：feature、change、bugfix、refactor、migration、maintenance、analysis。
- `target`：frontend、backend、database、tooling、docs。
- `runtime`：node-js、dotnet、python 或其他已確認 runtime。
- `framework`：vue、react、express 或其他已確認 framework。
- `language`：typescript、javascript、csharp、python 或其他已確認語言。
- `risk`：architecture、file-move、file-delete、file-split、layering-change、migration、
  cross-module、fullstack。
- `scope-mode`：file、module、cross-module、full-project。

只有具備明確 evidence 且達 Workflow 高信心門檻的 fact，才能加入 `skill_selectors`。

## 驗證設定

Planner 可以依已確認事實提出 validation profile：

- `lint`
- `typecheck`
- `build`
- `test`
- `manual`

`action=analyze` 時只能使用唯讀的 `manual`／evidence 檢查，不得執行會產生或修改檔案的 build、test、
format 或其他命令。`action=develop` 的實際指令仍由 Project Context、已選 Skill 與 Developer
validation 規則決定。

## 結果回報設定

依 `orchestration.result_reporting` 共用政策，以凍結的 Task Risk 作為共同基線，再使用已確認的
Task Type、Target、Risk、Scope mode 與輸出詳細度需求產生 `result_reporting`。Planner 不得重算或
降低 Task Risk，也不得因開發任務看似簡短就省略風險判定。

## Context 選取需求

- Module 範圍或跨模組的 Developer 分析／開發可以提出 `module` Context selector；有相符 current Context 時載入。
- Architecture、Migration、Database、Full Stack 或 Cross-module 任務可以提出 `project` Context
  selector；Context 不存在時不得僅因風險類型阻擋。
- Project／Module Context 預設為 optional。只有 Project Config 或 Context metadata 明確要求目前
  Action 時，Planner 才能將該 Context 視為 required。
- Routine Developer 任務不得僅因角色是 Developer 就要求任何 Context。

## 禁止事項

- 不得輸出 Skill ID。
- 不得以檔名猜測 Runtime、Framework 或 Language。
- 不得將低信心技術訊號用於自動載入。
- 不得重寫 Task Manifest 的 Role、Action、Scope 或明確 Skill。
- 不得改變 Task Risk 或 Execution Profile。
- 不得開始 Developer Workflow。
