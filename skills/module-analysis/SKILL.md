---
name: module-analysis
description: 從指定模組、功能、頁面、API 或已知入口建立可供後續開發與 Review 使用的模組 context。當使用者明確指定「個人 Skills：module-analysis」來分析模組邊界、資料流、依賴、contract 或修改限制時使用。
---

# Module Analysis

以 repository evidence 建立單一模組或明確切片的 context。這是唯讀分析流程；只有使用者明確要求建立或更新 context 時，才可寫入 Workflow Root 的中央分析目錄。

## 執行流程

1. 確認模組名稱、已知別名、候選路徑、所屬專案與關注問題。
2. 未提供候選路徑時，從工作專案根目錄以唯讀搜尋建立候選集合。
3. 若工作專案存在 `project.config.json`，先讀取 Workflow Root 的 `workflow/project-config.md`，再依其規格解析與本模組相關的最小 stack 集合；設定不存在或 target 未確認時，以 repository evidence 進行基礎邊界探索並標記缺口。
4. 以 import、export、route、call、event、state 或資料 contract 驗證關係；名稱相似只能作為線索。
5. 只從已確認入口展開直接依賴、必要呼叫端與 contract，不擴大成全專案分析。
6. 模組過大時，依 entry、flow、dependency 或 risk 選取最小必要切片；無法安全切片時標記 BLOCKED。
7. 整理入口、責任、上下游、資料流、contract、副作用、可修改與不可越界範圍。
8. 依作用中 stack 的 target 補充前端或後端分析重點：`references/target-frontend.md`、`references/target-backend.md`。跨前後端時套用兩者；target 未確認時僅做基礎邊界探索。
9. 只要求對話說明時直接回覆；要求文件時依 `references/output.md` 與 `references/report.md` 建立中央 context。

## 邊界

- 只分析指定模組或切片；不得擴大為全專案分析、全功能 code review、重構方案或實作計畫。
- 只讀取足以確認邊界與 contract 的最小檔案範圍。
- 不讀取或輸出敏感值，不修改程式碼、設定、資料庫、依賴或 Git 狀態。
- 不執行 install、build、test、migration、格式化或啟動服務。
- 找到多個無法區分的候選、無法確認必要 contract 或需要跨 shared／public contract 才能建立邊界時，回報並要求確認。

## 參考資料

- 報告內容與格式：`references/output.md`
- 檔名、狀態與更新規則：`references/report.md`
- 前端模組重點：`references/target-frontend.md`
- 後端模組重點：`references/target-backend.md`
