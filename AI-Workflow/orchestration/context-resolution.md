# Context Resolution 情境解析契約

> 載入政策：本檔是 Markdown fallback 與 Runtime 行為說明。正常路徑中 Context Resolution 是 Node
> Runtime 的 Rule Resolution 子程序，Agent 不獨立載入或執行本檔。

## 責任

Context Resolution 是 Rule Resolution 中具確定性的子程序，負責從已驗證設定與 Registry metadata 解析 Project Context 與 Module Context record。它回傳已選 Context record、warning、blocker，以及 required／optional reason；不修改 Context 檔案、不選擇規則，也不開始執行。

## 輸入

- Bootstrap 已驗證且凍結的 Project Config 與其 canonical Project Root。
- Task Manifest 中的 Project 身分、Module 候選、Targets、Action、Task Type、routing triggers 與 Scope。
- `registry/modules.json`。
- Project Config 的 `context_resolution` 與 `context_policy`。

只有 Manifest project ID 等於解析後的 Project Config ID，且 canonical root 符合已驗證的 Project Config root 時，Project 身分才有效。資料夾名稱、上層資料夾名稱與 timestamp 順序永遠不得作為身分證據。

## Project Context 選取

Project Context 只能從 `project_contexts` 中具備下列全部屬性的結構化物件選取：

- `context_id`、相對於 Root 的 `path`、`status`、`current` 與 `targets`。
- `current=true`。
- 路徑保持在已驗證 Project Root 或設定的 Context root 內。
- 宣告 Targets 時，必須與 Manifest Target 相容。

Project Context 必須使用符合 Project Config Schema 的結構化項目；字串路徑不得接受或自動載入。同一次選取若存在兩個以上符合條件的 current Project Context，視為衝突。Current pointer 指向不存在或無法讀取的檔案時，必須阻擋。

每個已選 Context 都必須以 `path_base` 宣告 `project_root` 或 `workflow_root`。讀取 bytes 前，canonicalization 必須以該基準解析 `path`，並拒絕絕對路徑、超出基準目錄的 traversal，以及跨 Root 替換。

## Module Context 選取

依下列順序解析 Module：

1. 精確比對 Manifest module ID。
2. 只有已登錄 alias 精確且唯一對應一個 module ID 時，才能用 alias 比對。
3. 確認該 Module 已綁定已驗證的 Project ID。
4. 對每個需求 Target，只讀取 Module 為該 Target 明確設定的 `context_selection.current_context` pointer。
5. 確認 pointer 指向的候選具有相同 Project ID、module ID、target、`current=true`，且 status 受允許。

`current_context` 可以是 null，或由 Target 名稱對應 Context ID 的物件。若為 null、缺少 Target key、存在重複 mapping、alias 衝突或有多個符合候選，不得用較新的 timestamp 自動解決。這些情況必須產生 diagnostic；Context 為 required 時必須阻擋。

來自其他 Project 的候選永遠不得載入，即使標記為 current。`project_id=null`、
`binding_status=unbound` 或 `current=false` 的候選也不得自動載入。這些候選只有在 Context 被明確
設定為 required 時才阻擋任務；optional Context 應產生 warning 並視為未載入。

## Required、Optional 與 Status Policy

Rule Resolution 建立 Resolved Rule Set 前，每個回傳的 Context record 都必須標記 `required` 與非空白 `reason`。

- Project Context 與 Module Context 預設都是 optional。存在符合 Project、Module、Target、current
  與 status 條件的 Context 時自動載入；不存在、未綁定或不相容時，任務仍可執行並產生 warning。
- 只有 Project Config 的 `require_project_context_for`、`require_module_context_for`，或特定 Context
  的 `required_for` 明確包含目前 Action 時，該 Context 才是 required。
- Module Analysis 不要求既有 Module Context。若存在符合身分、Target 且明確標記 current 的
  Context，可以作為 optional 參考；缺少、未綁定或不是 current 時不得阻擋 Rule Resolution。
- Develop 與 Review 不會因任務屬於 Module Scope 或具有 high-risk fact，就自動把 Context 升級為
  required。是否必須存在 Context，只依前述明確 required 設定判斷。
- Current Context 不產生 status warning。
- Context 為 optional 時，`stale`、`partial` 與 `unknown` 依 `context_policy.status_policy` 處理：可以產生 warning，但仍只有明確標記 current 時才能選取。
- 缺少或 status 為 stale、partial、unknown 的 required Context 依 `required_context_failure` 處理；設定要求阻擋時回傳 `BLOCKED`。
- optional Context 即使為 stale、partial 或 unknown，也只能依 status policy 產生 warning，不得因
  architecture、database、migration、fullstack 或 cross-module 風險自動成為 blocker。
- required Context 缺少、無法讀取、跨 Project、不相容或 status 不受允許時，仍必須阻擋。

結果必須保留所有被拒絕候選，以及每個 warning 或 blocker 的精確原因。Rule Resolution 將已選 Context 複製到 `Resolved Rule Set.contexts`；Preflight 只驗證其路徑、status、Project 身分、hash、reason 與 required flag，不選擇替代項目。
