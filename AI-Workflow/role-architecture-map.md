# 角色規則配置圖

## 執行鏈

```text
Task Analysis
  -> 選定 Role
  -> Role Planner
  -> Skill Resolution
  -> Preflight
  -> Role Entry
  -> Role Workflow
```

Role Planner 只產生標準化事實與 Skill selectors。Skill Resolution 才能選取 Skill；Role
Workflow 只執行通過 Preflight 的固定結果。

## 標準角色目錄

```text
roles/<role-id>/
  entry.md
  planner.md
  workflow.md
  restrictions.md
  output.md
  phases/
  modes/
  skills/
```

`phases/`、`modes/` 與 `skills/` 依角色需要使用，但 `entry.md`、`planner.md` 與
`workflow.md` 的責任不可混合。

## Developer

Developer 支援 `action=develop` 與 `action=analyze`。一般功能、程式碼、資料流或 contract 分析使用
唯讀的 `analyze` 分支並直接在對話回覆，不建立分析 md；後續若要修改，必須以新的 `develop`
Task Manifest 重新路由。

| 原始規則 | 重整後位置／責任 |
|---|---|
| `core.md` | Role Kernel 原則 |
| `workflow.md` | Developer 固定 Workflow |
| `restrictions.md` | Developer 硬性限制 |
| `review.md` | `validation.md`：Developer 驗證與自我檢查 |
| `logging.md` | 已移除：任務紀錄不屬於核心 Developer Workflow |
| `frontend.md` | `skills/frontend/base/` 與 Vue／React Framework Skill |
| `backend.md` | `skills/backend/base/` |
| `python-tool.md` | `skills/tooling/python/` |
| `architecture.md` | 已移除：只有 dependency 檢查，沒有獨立 Skill 行為 |
| `skills/project-structure.md` | 已移除：專案結構改由 Project Context 提供 |
| `skills/net-api-development.md` | 已移除：團隊目前不使用 .NET |
| `skills/refactor/general-refactor.md` | `skills/refactor/general/` |
| `skills/refactor/node-backend-refactor.md` | 通用規則移至 `backend/base/`；Node.js 規則移至 `runtime/node-js/` |
| `skills/refactor/bigProject.md` | 已移除：其路由責任、缺失相依與專案耦合不符合 Skill Package 契約 |

JavaScript 與 TypeScript 已從 Frontend 目錄移至 `skills/language/`，可由前端、後端與工具任務
共同選取。

## Review

| 原始規則 | 重整後位置／責任 |
|---|---|
| `entry.md` | Role Entry |
| `modes/change/**` | Change mode 差異 |
| `modes/feature/**` | Feature mode 差異 |
| `checks/common.md` | Review Kernel 共通檢查 |
| `checks/frontend.md` | `skills/checks/frontend/` |
| `checks/backend.md` | `skills/checks/backend/` |

Change 與 Feature 共同的 workflow、restrictions、report 與 PASS／FAIL 基準只保存一份；mode
檔案只保存 Scope、Evidence Source 與需求覆蓋差異。

## Project Analyst

Project Analyst 可參考已解析的 Project Context 與 Module Context；Module Context 對此角色永遠是
選用資料，缺少、過期、歧義或無法解析時只能產生 warning，不得阻擋專案分析。

| 原始規則 | 重整後位置／責任 |
|---|---|
| `identify-project.md` | Project Analyst 固定 phase |
| `team-style.md` | Project Analyst 固定 phase |
| `workflow.md` | Project Analyst 固定 Workflow |
| `restrictions.md` | 角色限制與共用政策引用 |
| `output.md` | Project Analysis Output |

Project Analyst 目前沒有必要強制建立 active Skill；保留 `skills/` 作為未來技術棧或分析
Profile 擴充點。

## Module Analyst

Module Analyst 只有在原始 Prompt 含完全相等的獨立一行 `角色：module-analyst` 時才能啟動。
它必須直接從 Repository Evidence 探索模組範圍，不讀取或要求既有 Module Context。

| 原始規則 | 重整後位置／責任 |
|---|---|
| `workflow.md` | Module Analyst 固定 Workflow |
| `restrictions.md` | 角色限制與共用政策引用 |
| `output.md` | Module Context 內容格式 |
| `report.md` | 落檔與狀態規則 |
| `frontend.md` | `skills/analysis/frontend/` |
| `backend.md` | `skills/analysis/backend/` |

## 共用政策

只允許抽取語意完全一致、且跨角色必須同步維護的內容：

- Report 檔名、編碼與指定輸出位置。
- 分析角色的唯讀命令與工作區保護。
- secret／credential／private config 保護。
- 事實、推論、未知與可信度標記。

四個角色的 Workflow、角色停止條件與專業判斷不得合併成共用 Workflow。
