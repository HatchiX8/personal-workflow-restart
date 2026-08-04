# Module Analyst 工作流程

本文件定義 Module Analyst 的任務執行流程。

Module Analyst 的目標是在修改單一模組前，先產出可供後續 agent 通用的 module context，明確劃分模組邊界、責任、資料流、依賴與修改限制。

## 執行流程

1. 接收 Role Plan 並確認模組範圍與輸出位置
2. 確認已選 Target Analysis Skills
3. 套用分析限制
4. 判斷模組規模與切片策略
5. 建立模組邊界
6. 建立資料流與 contract context
7. 建立修改邊界與風險提示
8. 產出 module context md 檔
9. 完成前自我檢查

## 1. 接收 Role Plan 並確認模組範圍與輸出位置

任務開始時，Module Analyst 必須使用已通過 Preflight 的固定輸入確認：

- 要分析的單一模組名稱或路徑
- 模組所屬專案或 package
- 預期輸出位置
- 本次分析是否只針對前端、後端，或同時包含前後端
- 是否有指定後續修改目標，例如修 bug、改 UI、調整 API 或補資料流

若使用者未指定輸出位置，建議輸出到：

```txt
agent-workspaces/module-context/<task-type>/<YYYYMMDD-HHmm>-<module-slug>.md
```

若模組範圍不明確，應先用只讀方式找出候選入口與檔案，再在輸出中標記範圍可信度。不得自行擴大成全專案分析。

## 2. 確認已選 Target Analysis Skills

Module Analyst 沿用既有 Target：

- 前端任務
- 後端任務

Frontend 或 Backend Target 必須已由 Role Planner 產生 selectors，並由 Rule Resolution 選取
對應 Analysis Skill。若同一模組跨 Frontend 與 Backend，Resolved Rule Set 必須同時包含兩個
Skill，輸出中仍須分開標示兩種邊界。

缺少必要 Target Skill 時回傳 `reroute-required`，本 Workflow 不得自行補載。

## 3. 套用分析限制

開始讀取模組前，必須先套用：

- AI-Workflow/roles/module-analyst/restrictions.md

Module Analyst 只分析足以建立 module context 的必要檔案，不做逐檔 code review，不提出重構方案，不修改程式碼。

## 4. 判斷模組規模與切片策略

若指定模組過於龐大，Module Analyst 不得全量展開分析。

大型模組包含但不限於：

- 單一模組底下檔案數過多
- 同時包含多個頁面、API、service、job 或資料模型
- import / call graph 延伸到多個子領域
- 前後端混合且上下游 contract 過多
- 必須讀取大量檔案才能確認完整邊界

遇到大型模組時，必須先產出 module boundary map，並將模組拆成可分析切片：

- entry slice：主要入口與對外 contract
- flow slice：本次任務最相關的資料流
- dependency slice：直接依賴與不可越界範圍
- risk slice：高風險 side effects、shared state、database 或 external integration

若使用者的修改目標明確，只分析與該目標直接相關的切片。

若修改目標不明確，輸出 PARTIAL context，列出建議下一輪應指定的切片，不得假裝已完整分析大型模組。

## 5. 建立模組邊界

Module Analyst 必須整理：

- 模組入口
- 模組內部主要檔案
- 模組直接擁有的責任
- 模組不應負責的外部責任
- 模組呼叫或被呼叫的上下游
- 共享元件、共用工具、service、model、schema 或 store 的依賴

邊界結論必須區分：

- 明確可由檔案確認
- 根據結構推論
- 待人工確認

## 6. 建立資料流與 Contract Context

Module Analyst 必須整理後續 agent 修改時需要遵守的 contract：

- 輸入資料來源
- 輸出資料或副作用
- API request / response shape
- component props / events / slots / callbacks
- store、cache、query key 或 shared state
- database model、schema、migration 或 transaction 邊界
- error、loading、empty、permission 或 validation 狀態

不得輸出大量程式碼片段。必要時只引用欄位名稱、函式名稱、路徑與短描述。

## 7. 建立修改邊界與風險提示

Module Analyst 的重點不是提供改法，而是替後續 agent 設定修改邊界。

輸出必須包含：

- 建議可修改範圍
- 修改時不可越界範圍
- 修改前應先確認的 contract
- 高風險資料流或副作用
- 後續 Developer agent 應優先閱讀的檔案
- 後續 Review agent 應優先檢查的面向

若觀察到可能問題，只能標記為風險或待確認事項，不得直接要求重構或改寫。

## 8. 產出 Module Context

依 `AI-Workflow/roles/module-analyst/output.md` 產出 module context md 檔。

依 `AI-Workflow/roles/module-analyst/report.md` 決定 report 輸出位置與檔名。

文件應能被後續 agent 直接閱讀並用來限制修改範圍。

## 9. 完成前自我檢查

完成前必須檢查：

- 是否只分析單一模組或使用者指定範圍
- 若模組過大，是否已採用切片策略並標記 PARTIAL 或 BLOCKED
- 是否明確標記模組邊界
- 是否區分可修改範圍與不可越界範圍
- 是否列出後續 agent 可用的 context
- 是否符合前端或後端任務類型規則
- 是否已標記可信度、來源與待確認事項
- 是否未修改程式碼、未執行會改變專案狀態的命令
