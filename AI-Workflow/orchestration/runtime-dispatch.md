# Runtime Dispatch 精簡契約

正常路徑使用同一支無網路、無檔案寫入的 Node CLI 執行 Schema 驗證、Task Risk、Execution
Profile、Registry、Rule、Context、hash／fingerprint 與 Preflight。LLM 只負責 Task Manifest、Role
Plan 的語意部分，以及讀取 Runtime 回傳的 `load_paths` 後執行工作。

## 執行與權限

從 `workflow.config.json.runtime.entry` 取得唯一入口，使用宿主提供的安全 stdin API 執行：

```text
node <WORKFLOW_ROOT>/<runtime.entry> --stdin
```

- 不得將原始需求或 JSON 拼入 shell command；request 只能經 stdin 傳入。
- 第一次需要執行時，先簡短告知使用者：此命令只讀 Workflow／Project 設定與規則、不連網、不寫檔，
  並由宿主平台顯示實際授權 UI。
- Workflow 不授予權限。不得要求或建立 `node *`、`npm *`、`Bash(*)` 等廣泛永久權限；使用者可只
  授權本次或依宿主功能記住精確入口。
- Runtime 若因不存在、Node 版本不足、宿主無 shell 能力或使用者拒絕而不可執行，才進入 Markdown
  fallback。合法執行後回傳 `status=blocked` 不屬於不可用，不得繞過 blocker 改走 fallback。

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
`task_risk`、`execution_profile`、`next.stage=role-planner`、`next.load_paths` 與 `diagnostics`。只讀取
`next.load_paths` 指定的 Role Planner，將 Task Manifest、Runtime 回傳的 Task Risk／Execution
Profile 與已驗證 Project Config 交付 Planner，產生 Role Plan；不得自行推導 Planner 路徑。

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

## Markdown fallback

只有 Runtime 技術上不可執行時，依下列順序載入既有完整契約：

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

fallback 必須保留相同 Schema、Registry、風險政策、Task ID、fingerprint 與 fail-closed 行為，並在最終
回覆標示 `routing_mode=markdown-fallback` 與原因。Fallback 不是 Runtime blocker 的繞過機制。
