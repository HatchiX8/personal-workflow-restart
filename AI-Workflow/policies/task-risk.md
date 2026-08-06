# 任務風險政策

## 適用範圍

本政策定義可由 Workflow Execution 與 Result Reporting 共用的任務風險事實。Task Risk 只描述
任務本身的影響範圍與失敗後果；它不選擇 Role、Skill、Rule、Context 或 Execution Profile，也不授權
執行任何動作。

Task Risk 與 Result Reporting 必須保持分離：

- `task_risk.level` 是執行前的任務風險下限，可供 Execution Profile Resolver 選擇流程深度。
- `result_reporting.minimum_level` 是完成回覆的詳細度下限。
- Result Reporting 可以因使用者要求詳細報告或執行後結果而提高，但不得反向降低 Task Risk。
- Task Risk 提高時，Result Reporting 可以把它作為最低回覆層級的風險來源；兩者不得互相覆寫產物。

## 判定來源

Risk Assessment 只能使用已完成 Task Manifest 中的正規化欄位、`routing_triggers` 及其既有
`provenance`。不得重新解讀 `raw_request`、讀取 Role／Skill 規則、掃描 repository，或從檔名與
自由文字補猜風險。

每個判定理由都必須可追溯到 Task Manifest 欄位或 routing trigger。若 Manifest 沒有足夠證據，
必須依本政策保守處理，不得以缺少風險 trigger 當作低風險證據。

## 判定順序

固定使用下列順序：

1. 先檢查 Level 3 hard trigger。
2. 沒有 hard trigger 時，檢查所有已確認風險事實並計算其最高層級。
3. 只有完整符合 Level 1 條件時才能選擇 Level 1。
4. 其餘已解析任務一律至少為 Level 2。

多個事實對應不同層級時採最高風險勝出。任一 hard trigger 成立即固定為 Level 3，不得因單檔、
單 Target、明確 Role／Skill 或容易回復而降低。

## Level 1：低風險

Level 1 必須具有高信心、明確且容易驗證的邊界，沒有任何 Level 3 hard trigger，並符合下列其中
一種型態。

### 限定範圍問答或唯讀說明

- 只做一般概念說明、單一檔案／函式解讀、既有錯誤訊息說明或限定範圍的唯讀查詢。
- 不要求全專案、跨模組、架構、安全、資料庫或高風險流程分析。
- 不產生外部寫入、不可逆操作或 repository 修改。

### 微小修改

- Scope 已高信心確認為單一檔案或等價的極小範圍。
- 只有單一 Target，且 `target_mode=single`。
- Task Type 為 `change`、`bugfix` 或 `maintenance`。
- 不新增跨檔依賴、不改變公開契約、不涉及資料、權限、安全、部署或 Workflow 治理。
- 修改容易回復，且可由單一針對性驗證確認。

典型案例包含文件錯字、文案／註解／格式調整、局部 CSS、未使用 import、明確 null guard、既有模式
下的單一測試補充。檔案數少不是充分條件；高風險邊界優先。

## Level 2：一般風險

未命中 Level 3，且不完整符合 Level 1 時，使用 Level 2。典型案例包含：

- 一般 Feature、Change、Bugfix、Refactor、Review 或限定範圍分析。
- 單一模組內的多檔案修改、一般資料流調整或既有模式擴充。
- 需要重現、追蹤呼叫鏈、補測試後修正的一般錯誤。
- 模組內部重構、一般 build／lint／test 設定及非重大 dependency 更新。
- 風險資訊不足以安全判定 Level 1，但沒有證據顯示 Level 3 領域。

Level 2 是一般任務的保守預設，不得被「指定 Role／Skill」直接降為 Level 1。

## Level 3：高風險

下列任一已確認事實都是 hard trigger：

- Scope 為 `cross-module` 或 `full-project`。
- Target mode 為 `fullstack` 或 `mixed`。
- Task Type 為 `migration`。
- 架構、Runtime、Framework、共用基礎元件或多 consumer 契約變更。
- Database schema、資料 migration／backfill、大量資料變更、transaction 或資料完整性風險。
- Authentication、authorization、security、secret／credential 或敏感資料邊界。
- Payment、monetary flow、訂單金額、餘額、庫存扣減或其他權益風險。
- Public API、SDK、event、webhook 或其他對外相容性契約。
- Production deployment、infrastructure、queue、cache、distributed concurrency 或 locking。
- Destructive operation、file delete、大量移動／改寫、Git history rewrite 或 rollback。
- 對外部系統寫入或其他不易回復的副作用。
- Bootstrap、Dispatcher、Task Analysis、Role／Skill routing、Registry schema、Preflight、Executor
  Adapter、安全限制或其他 Workflow 治理核心修改。

Schema 使用的 canonical hard trigger ID 由 `schemas/task-risk.schema.json` 固定；上游應將同義事實
正規化為該 ID，不得使用自由文字建立可執行分流。

## 資訊不足與狀態

- 不足以證明 Level 1 時，最低只能判為 Level 2。
- 一般資訊不足且沒有高風險跡象時，輸出保守 `level=2`。
- 疑似涉及 Level 3 領域，但無法確認或排除時，輸出保守 `level=3`。
- 缺少的事實可能改變風險層級時，必須設定 `status=needs-resolution` 並列入 `unresolved`；Profile
  Resolver 不得把此狀態當成已核准的低風險分類。
- 只有必要風險事實完整且理由可追溯時，才能設定 `status=assessed`。

## 只升不降

`upward_escalation` 必須固定為 `true`。後續階段若發現新的範圍、Target、資料、安全、契約、破壞性
操作或其他較高風險事實，原風險產物立即不足，必須回傳 `reroute-required` 並重新評估。

允許的升級方向為 `1 → 2`、`1 → 3`、`2 → 3`。同層級 contract 失效時可以建立新的 Task Risk
Assessment 並重新走准入流程；執行中不得降低層級。只有新的獨立使用者任務才能從頭評估較低
風險，不得用新產物替目前進行中的任務降級。
