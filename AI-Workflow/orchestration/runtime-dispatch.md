# Runtime Dispatch 精簡契約

正常路徑使用同一支無網路、只讀 request file 的 Node CLI 執行 Schema 驗證、Task Risk、Execution
Profile、Registry、Rule、Context、hash／fingerprint 與 Preflight。LLM 只負責 Task Manifest、Role
Plan 的語意部分，以及讀取 Runtime 回傳的 `load_paths` 後執行工作。

## 執行與權限

Agent 將單次 request 以 UTF-8 JSON 寫入 Project Root 下
`workflow.config.json.runtime.request_directory/<task_id>.json`，再從 `runtime.entry` 取得唯一入口執行：

```text
node <WORKFLOW_ROOT>/<runtime.entry> --request-file .ai-workflow/runtime/requests/<task_id>.json
```

- request file 必須以不覆寫既有檔案的方式建立，且只能位於設定的 request directory。命令只能傳入
  Project Root-relative path；不得將原始需求或 JSON 拼入 shell command，也不得接受絕對或越界路徑。
- 每次 Runtime 結束後，不論成功、阻擋或錯誤，Agent 都必須在 `finally` 流程刪除本次 request file；
  不得刪除其他任務檔案或共用目錄。request file 不得提交版本控制或作為長期產物保留。
- 第一次需要執行時，先簡短告知使用者：此命令只讀暫存 request、Workflow／Project 設定與規則，
  不連網且 Runtime 本身不寫檔，
  並由宿主平台顯示實際授權 UI。
- Workflow 不授予權限。不得要求或建立 `node *`、`npm *`、`Bash(*)` 等廣泛永久權限；使用者可只
  授權本次或依宿主功能記住精確入口。
- Runtime 若因不存在、Node 版本不足、宿主無 shell／request file 寫入能力或使用者拒絕精確入口而不可
  執行，必須先停止並詢問目前使用者，不能直接進入 Markdown fallback。合法執行後回傳
  `status=blocked` 不屬於不可用，不得繞過 blocker 改走 fallback。

## 第一階段：Routing

Request：

```json
{
  "protocol_version": "1.0",
  "operation": "resolve-routing",
  "project_root": "canonical Project Root",
  "task_manifest": {}
}
```

CLI 必須以 canonical Project Root 作為 cwd。`project_root` 可省略；若提供，canonicalize 後必須與
cwd 完全相同，否則視為無效輸入，不得藉此解析另一個專案。成功結果必須為 `status=resolved`，包含不可變
`task_risk`、`execution_profile`、`next.stage=role-planner`、`next.load_paths` 與 `diagnostics`。
`next.load_paths` 必須依序只包含 `orchestration.role_plan_authoring` 與選定的 Role Planner。Agent 必須
先讀精簡輸出契約，再讀角色 Planner，將 Task Manifest、Runtime 回傳的 Task Risk／Execution Profile
與已驗證 Project Config 交付 Planner，產生 Role Plan；不得自行推導路徑或使用字串 facts shorthand。

## 第二階段：Execution

Request：

```json
{
  "protocol_version": "1.0",
  "operation": "resolve-execution",
  "project_root": "canonical Project Root",
  "task_manifest": {},
  "role_plan": {}
}
```

成功結果必須為 `status=ready`，包含 Runtime 重新計算的 `task_risk`、`execution_profile`、
`resolved_rule_set`、`preflight`、`executor_verification`、`load_paths`、`execution_contract`、
`fingerprint` 與 `diagnostics`。
`status=ready` 代表同一次 Runtime 呼叫已在 Preflight 後執行 Executor Adapter 准入檢查，重新讀取
選取 bytes 並驗證 path、content hash、fingerprint 與 execution contract；結果保存在
`executor_verification:{accepted,reason}`。只有 `preflight.can_execute=true` 且
`executor_verification.accepted=true` 時才能依序讀取 `load_paths` 並進入 Role Entry；正常
路徑不另載 `executor-adapter.md`，也不得載入未命中的 Registry、Schema 或規則。

Executor verification rejected 時必須為 exit `2`、`status=blocked`、`execution_contract=null`、
`load_paths=[]`，且 diagnostics 包含 `EXECUTION_REJECTED`；不得使用第一次 Preflight 的 contract 繼續。

## 結果與 exit code

| exit code | 意義 | Agent 行為 |
|---:|---|---|
| `0` | 成功解析 | 依 `next.load_paths` 或 `load_paths` 繼續 |
| `2` | Workflow 合法阻擋 | 回報 stdout JSON 的 diagnostics，不得 fallback |
| `64` | JSON、協議或輸入無效 | 修正 LLM 產生的 request 一次；仍失敗即阻擋 |
| `70` | Runtime 內部錯誤 | 保留 diagnostics；Runtime 確認不可用時才 fallback |

所有狀態的 stdout 都必須是單一合法 JSON。stderr 只供短診斷，不得從 stack trace 推導路由。未知
`protocol_version`、Task ID 不一致、缺少必要產物、`status` 與 exit code 不一致時一律阻擋。

### 阻擋回覆

Runtime 回傳 `status=blocked|invalid|error`，或 exit `2|64|70` 最終無法修正時，Agent 不得只回覆
概括名稱。對話回覆必須保留 stdout JSON 的 `error_code`，並依原順序逐項輸出每個 diagnostic 的
`code`、`path` 與 `reason`。回覆前只載入 `orchestration.error_interpretation`，將 Runtime 提供的
精簡 `error_context` 交給 LLM 判定錯誤類型與可行下一步：

```text
BLOCKED: <error_code-or-terminal-state>
判定：<error classification>
原因：<Runtime 事實與明確標示的 LLM 推論>
需要：<可行下一步；沒有時省略>
diagnostics:
- [<code>] <path-or-/>: <reason>
```

例如 Role Plan 缺少結果回報契約時：

```text
BLOCKED: invalid-role-plan
error_code: INVALID_ROLE_PLAN
diagnostics:
- [REQUIRED_FIELD_MISSING] /role_plan/result_reporting: Required field is missing.
- [INVALID_ROLE_PLAN] /role_plan/result_reporting: result_reporting must be an object.
```

LLM 的分類與說明不得改寫 Runtime 狀態、Risk、Profile 或 routing facts。不得省略、合併或改寫
diagnostic，不得暴露 request file 全文、原始 Prompt 以外的敏感值或 stack
trace。`path=null` 時顯示 `/`。若 diagnostics 缺失或不是合法陣列，回覆
`BLOCKED: runtime-diagnostics-invalid`，不得自行猜測原因或進入 fallback。

## Markdown fallback

Runtime 技術上不可執行時，先回報穩定原因，並使用下列意義完整的詢問：

```text
Runtime 無法執行（<reason>）。改用 Markdown fallback 會增加 Token 消耗。是否允許本次需求改用 Markdown fallback？
```

發出詢問後設定 `AWAITING_FALLBACK_CONSENT`，不得預先讀取完整 Schema、Registry 或 fallback 契約。
只有目前對話中的使用者在詢問後明確同意，才依下列順序載入：

```text
task-analysis.md
-> risk-assessment.md
-> execution-profile-resolution.md
-> selected profile
-> role planner
-> rule-resolution.md (internally context-resolution.md)
-> preflight.md
-> executor-adapter.md
```

Agent、子代理、工具、Workflow 設定、宿主預設、過往需求的同意或自動化規則都不得代表使用者回答
這項詢問，也不得將沉默視為同意。使用者拒絕或沒有明確同意時，以 `RUNTIME_UNAVAILABLE` 停止。

fallback 必須保留相同 Schema、Registry、風險政策、Task ID、fingerprint 與 fail-closed 行為，並在最終
回覆標示 `routing_mode=markdown-fallback`、原因與本次同意 provenance。Fallback 不是 Runtime
blocker 的繞過機制。
