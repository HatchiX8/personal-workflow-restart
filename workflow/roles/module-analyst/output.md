# Module Context Output

本文件定義 Module Analyst 產出的 module context md 檔格式與內容要求。

建立正式文件時不得省略本文件要求的必要區塊。完成後的對話回覆至少說明 Module Context 狀態與實際路徑。

## 目標

- 產出後續 agent 可直接閱讀並遵守的模組 context
- 同時讓工程師能快速理解模組現況與後續修改邊界
- 清楚界定模組邊界、責任、資料流與 contract
- 幫助 Developer agent 修改時不越界
- 幫助 Review agent 檢查時知道主要風險與 contract
- 清楚區分事實、推論與待確認事項

## Output File

正式文件集中保存在 Workflow Root，不寫入被分析的工作專案。使用者指定檔名或子路徑時，仍須放在 Workflow Root 的 `agent-workspaces/analysis/` 之下；若指定位置位於工作專案內，先說明限制並要求改用中央位置。

若使用者未指定輸出位置，建議使用：

```txt
<Workflow Root>/agent-workspaces/analysis/<project-slug>/modules/<target>/<YYYYMMDD-HHmm>-<module-slug>.md
```

實際路徑與檔名規則以 `report.md` 為準。

若既有 module context 已存在，覆寫與更新規則以 `report.md` 為準。

除非使用者明確要求更新指定檔案，否則預設產出新的 timestamp report，不覆蓋既有 context。

## Writing Principles

module context md 檔應遵守：

- 以後續 agent 可執行修改為目的
- 同時提供工程師可掃讀的摘要與來源
- 優先描述邊界、contract 與修改限制
- 使用短段落、表格與清單提高可掃讀性
- 避免逐檔摘要
- 避免大量程式碼片段
- 避免未經確認的架構評價
- 不輸出 secret、credential、token、connection string 或 private config 的實際值
- 不把改善建議混入既有狀態描述

文件需同時符合：

- Agent-readable：邊界、限制、contract 與狀態標記必須明確，可被後續 agent 當成操作規則
- Engineer-readable：每個區塊需使用工程師熟悉的名稱、路徑與短說明，避免只有抽象規則或機器式條列

## 建議文件結構

```txt
# Module Context: <module-name>

## 分析識別
## 分析範圍與可信度說明
## Engineer Summary
## Agent 使用方式
## 模組概覽
## 模組邊界
## 主要入口與關鍵檔案
## 資料流與 Contract
## 狀態、錯誤與副作用
## 可修改範圍
## 不可越界範圍
## 後續 Agent 指引
## 風險、未知與待確認事項
```

## Section Requirements

### 分析識別

需列出：

- Project Name
- Project Root（正規化後的絕對路徑）
- Project Config Path；未載入時明確標記
- Project Slug
- Module Name 或主要路徑
- Target：frontend、backend、fullstack 或 unknown
- Analyzed At（含時區）

### 分析範圍與可信度說明

需說明：

- 本次分析的模組名稱或路徑
- 任務類型：前端任務、後端任務，或兩者皆有
- 已閱讀的主要來源
- 未深入分析的範圍
- 可信度標記方式

### Engineer Summary

本區塊是給工程師快速掃讀的摘要。

需用短段落說明：

- 這個模組大致負責什麼
- 修改這個模組通常會碰到哪些入口
- 最需要小心的邊界或 contract 是什麼
- 本次 context 是否完整：READY、PARTIAL 或 BLOCKED

不得只輸出給 agent 的命令式規則而缺少人類可理解的背景。

### Agent 使用方式

本區塊是給後續 agent 的短指令。

需包含：

- 後續修改前必須閱讀本文件
- 修改時應遵守的模組邊界
- 不得任意修改的外部依賴或 contract
- 若遇到待確認事項，應先回報而非自行擴大修改

建議格式：

```txt
後續 agent 修改此模組前，必須先閱讀本 context。
修改範圍應限制在「可修改範圍」內。
若需要碰觸「不可越界範圍」，必須先回報原因與風險。
```

### 模組概覽

需摘要：

- 模組用途
- 模組所屬層級
- 主要使用者或呼叫端
- 主要輸入與輸出

### 模組邊界

建議用表格列出：

- 類型
- 範圍或路徑
- 說明
- 可信度
- 來源

邊界至少需包含：

- 模組內部範圍
- 上游呼叫端
- 下游依賴
- 外部不可任意修改的 contract

### 主要入口與關鍵檔案

列出後續 agent 應優先閱讀的檔案。

每個項目需說明：

- 路徑
- 用途
- 是否屬於可修改範圍
- 可信度

不得逐檔摘要所有檔案。

### 資料流與 Contract

需描述：

- 輸入資料來源
- 主要轉換流程
- 輸出資料或副作用
- request / response、props / events、schema / model 等 contract
- 呼叫順序或生命週期中不可破壞的節點

若 contract 無法完整確認，必須列入待確認事項。

### 狀態、錯誤與副作用

需整理：

- loading、empty、success、error 狀態
- validation 或 permission 檢查
- cache、store、database、外部服務或 event side effects
- 可能造成資料不同步或重複副作用的風險

### 可修改範圍

列出後續 Developer agent 通常可在任務內修改的範圍。

需避免把可修改範圍寫得過寬。若只能根據結構推論，必須標記可信度。

### 不可越界範圍

列出後續 Developer agent 不應任意修改的範圍，例如：

- 共享元件或共用 service
- global store 或 shared schema
- API response shape
- database migration 或資料表結構
- 外部服務 client
- 其他模組入口

若任務確實需要越界，後續 agent 應先回報原因、影響範圍與需要額外確認的 contract。

### 後續 Agent 指引

需分別提供：

- 給 Developer agent 的修改邊界
- 給 Review agent 的檢查重點
- 建議閱讀順序

本區塊只能提供邊界與檢查焦點，不得提供具體改法。

### 風險、未知與待確認事項

需列出：

- contract 不明
- 上下游呼叫端未完整確認
- 權限、validation 或 error handling 不明
- shared state 或 cache 邊界不明
- database transaction 或資料一致性不明
- 需要人工確認的產品規則或外部服務行為

## 可信度標記

所有重要結論標記為明確事實、結構推論或待人工確認。

## Source References

重要事實提供檔案或資料夾路徑。來源衝突時列出衝突證據，推論不得寫成確定事實。

## Content To Avoid

module context md 檔不得包含：

- secret value
- connection string
- credential
- 大量程式碼片段
- 逐檔摘要
- code review finding
- 重構建議
- 架構改造方案
- 未確認的產品規則
- 對團隊風格的主觀評價

## Final Review

輸出前必須確認：

- 文件是否能讓後續 agent 明確知道修改邊界
- 是否包含可辨識來源專案與模組的分析識別資訊
- 是否包含模組入口、責任、資料流、contract、可修改範圍與不可越界範圍
- 是否已依前端或後端任務類型補充重點
- 是否避免逐檔摘要與具體改法
- 是否已標記可信度
- 是否已列出待人工確認事項
- 是否未輸出 secret 或 private config
