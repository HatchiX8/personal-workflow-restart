# Full Execution Profile

## 適用範圍

本 Profile 適用 `risk_level=3`、任何 Level 3 hard trigger、Workflow 治理規則修改，以及無法在較低
Profile 安全處理的任務。它是現行完整 Workflow 的等價保留與安全 fallback，不得因 token、時間或
明確指定 Role／Skill而省略既有階段。

## 等價完整流程

Task Analysis、Risk Assessment 與 Execution Profile Resolution 完成後，Full 必須按照既有契約執行：

1. `role-planner`；
2. `rule-resolution`，包含其內部 `context-resolution`；
3. `preflight`；
4. `executor-adapter`；
5. `role-entry`。

完整生命週期記錄為：

```text
task-analysis
-> risk-assessment
-> execution-profile-resolution
-> role-planner
-> rule-resolution (including context-resolution)
-> preflight
-> executor-adapter
-> role-entry
```

每個階段的輸出仍是下一階段的不可變輸入。現有 Task Manifest、Role Plan、Resolved Rule Set、
Preflight Result、Execution Contract、hash／fingerprint、Result Reporting 與 Role Entry 契約的語意
全部保留。Full 不得複製或建立另一套 Role／Skill／Context 選取演算法；它引用並執行現有獨立契約。

## 禁止降級

Full 執行中不得降低 Risk level 或切換至 Standard／Lightweight。新發現的規則、Target、Module、
Context 或 Scope 若使凍結 contract 失效，Role Entry 仍依既有契約回傳 `reroute-required`。Dispatcher
可以在相同 Level 3 重新執行 Risk Assessment、Profile Resolution 與 Full 的全部必要階段，產生新
contract；不得沿用舊 Rule Set、fingerprint 或部分階段。Full 不得降級或自行擴張 Scope。
