# Skill Package 規格

## 目的

Skill Package 是角色專業能力、技術棧、任務技法、Project Policy、Review Check 與分析 Profile
的唯一擴充方式。新增 Skill 不得要求修改 Role Entry、Role Planner 或 Role Workflow。

## 目錄

```text
roles/<role-id>/skills/<skill-path>/
  skill.json
  rules.md
  tests/
  README.md
```

- `skill.json`：唯一 routing metadata。
- `rules.md`：執行規則，必須使用中文。
- `tests/`：選取、排除、相依與衝突案例。
- `README.md`：工程師說明，不參與 routing。

## Skill 分類

- `capability`：Frontend、Backend、Tooling 等能力。
- `technology`：Vue、React、Node.js、JavaScript、TypeScript、Python 等技術棧。
- `task-technique`：Refactor、Architecture、Migration 等任務技法。
- `project-policy`：特定 Project 的結構、命名、依賴與流程限制。
- `review-check`：Frontend、Backend、Security、Performance 等 Review checks。
- `analysis-profile`：特定技術或領域的分析方式。
- `validation`：額外驗證流程。
- `output`：特定輸出或紀錄需求。

## Selector

Skill Manifest 只能使用 Role Planner 已產生的標準化 selectors，例如：

```text
target=backend
runtime=node-js
framework=vue
task-type=refactor
project=erp-api
review-check=frontend
```

`all` 必須全部成立，`any` 至少一項成立，`none` 任一成立時不得選取。Selector 不得解析原始
Prompt，也不得依檔名相似度判斷。

## 規則內容邊界

`rules.md` 可以定義：

- 適用能力的專業規則。
- 使用限制、停止條件與操作流程。
- 驗證方式與完成輸出。
- Project／Module 特有政策。

`rules.md` 不得定義：

- Role、Action 或 Role mode 推導。
- 其他 Skill 的檔案路徑或載入流程。
- Registry precedence、hash 或 fingerprint。
- 未通過 Preflight 時的替代執行方式。
- 另一套完整 Role Workflow。

## Registry

`registry/skills.json` 是生成產物。工程師新增或修改 Skill 時只維護 Skill Package，再由 Registry
Generator 掃描 `skill.json`、驗證 Schema、檢查 ID／dependency／conflict，並生成 Registry。

任何直接手動修改生成 Registry 的行為都必須被驗證工具拒絕。

## 中文規則

所有 `rules.md`、README 與測試說明必須使用中文。程式碼識別字、Selector、Skill ID、路徑、
命令、API 欄位與錯誤訊息可以保留英文。
