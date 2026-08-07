# Developer 角色入口

本文件是 Developer 角色的唯一執行入口，由 Executor Adapter 呼叫。入口只接收已通過
Preflight 的固定輸入，不負責解析原始 Prompt、推導任務或選擇規則。

## 固定輸入

- `Task Manifest`：已解析的 Action、Role、Target、Module、Scope 與 Skill。
- `Task Risk Assessment`：已凍結的風險層級、理由與 hard triggers。
- `Execution Profile Contract`：已核准的 Profile、必要階段與升級契約。
- `Role Plan`：由 `roles/developer/planner.md` 產生的固定流程、Skill selectors、能力與輸出需求。
- `Resolved Rule Set`：已選規則、Context、載入順序、優先級與 fingerprint。
- `Preflight Result.execution_contract`：允許執行的 Role、Action、入口、Risk Level、Execution Profile 與 Rule Set fingerprint。

## 入口驗證

開始執行前，必須確認：

- `role_id=developer`
- `allowed_action=develop|analyze`
- Role Plan 的 `planner_entry=roles/developer/planner.md`，且 Role、Action 與 Task Manifest 一致
- `targets` 至少包含一個已解析 Target
- `Resolved Rule Set` 與 `execution_contract` 的入口及 fingerprint 一致
- Task Risk、Execution Profile 與 `execution_contract` 的層級及 Profile ID 一致
- Task Manifest 中的 Scope、Skill 與 Module 已固定

任一條件缺少或不一致時，回傳 `reroute-required`，交回 Dispatcher 處理。不得在本入口重新
推導、猜測、降低風險、替換 Profile 或補載規則。

## 執行責任

通過驗證後，只能依 `Resolved Rule Set.load_order` 使用已載入的規則與 Context，並在 Task
Manifest 核准的 Scope 與 Execution Profile 內依 Role Plan 執行工作。

`allowed_action=develop` 時，Developer 負責：

- 依需求實作、修正或重構程式碼
- 遵守已選取的通用、Target、Skill、Project 與 Module 規則
- 維持既有架構、資料流與 public behavior 的穩定性
- 依已載入的 review 與 output 規則完成驗證及結果回報

`allowed_action=analyze` 時，Developer 只負責唯讀理解既有功能、程式碼、資料流、Contract 與可能影響：

- 只能列舉、搜尋與讀取必要檔案，以及執行不改變專案狀態的檢查。
- 不得修改程式碼、設定、依賴、Git 狀態或其他專案產物。
- 只在對話中回覆分析結果，不得建立 Module Context、Project Analysis 或其他 md 報告。
- 使用者後續要求修改時，必須建立新的 `action=develop` Task Manifest 並重新執行 Runtime；不得沿用
  本次 `action=analyze` 的 Execution Contract。

入口不得變更 Role、Action、Task Type、Target、Module、Skill、Context、規則載入
順序或優先級，也不得掃描目錄或猜測規則檔名。

## 未知情況

若已載入規則未明確定義實作方式，應優先維持既有架構與資料流，避免主動新增抽象層或進行超出
Scope 的大型重構。若無法在既定 Rule Set 與 Scope 內安全完成，回傳 `reroute-required`。

## 執行結果

- `completed`：已在核准 Scope 內完成工作。
- `blocked`：角色規則內的停止條件成立，且不需要改變 routing。
- `reroute-required`：固定輸入不足、不一致、發現更高風險，或需要較高 Profile、不同規則、Scope、Target、Module 或 Context。

輸出與落檔位置依已載入的角色 output 規則及使用者明確要求決定。本入口不得建立新的
輸出政策。
