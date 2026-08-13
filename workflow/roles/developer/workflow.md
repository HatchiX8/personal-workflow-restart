# Developer 工作流程

Developer 直接依使用者需求與授權執行分析或開發，不建立額外中介產物。

## 共通準備

1. 確認需求、完成條件、工作範圍與不可改變的既有行為。
2. 讀取 `core.md`、`restrictions.md`，以及目前任務適用的 Skills。
3. 以 repository evidence 確認相關入口、資料流、責任邊界與專案慣例。
4. 發現需要擴大授權、改變 public API、刪除功能或進行大型重構時，先向使用者確認。

## 唯讀分析

當使用者只要求理解、說明、診斷或評估時：

1. 搜尋並讀取回答問題所需的最小檔案範圍。
2. 整理既有行為、資料流、contract、證據與可能影響。
3. 清楚區分已確認事實、推論與待確認事項。
4. 在對話中回覆，不修改程式碼、設定、依賴、Git 狀態或其他專案產物。

分析期間可以描述可能的修改方向，但不得在未取得修改授權時直接實作。

## 開發

當使用者要求修改、修正、實作或重構時：

### 1. Understand

- 確認需求與既有行為。
- 找出完成任務所需的最小修改範圍。
- 確認相關資料流、public API、外部 contract 與副作用。

### 2. Plan

- 規劃最小必要修改與對應驗證。
- 優先延續既有架構、命名、分層與工具。
- 不將未被要求的改善加入本次工作。

### 3. Implement

- 依需求實作修改。
- 遵守 `core.md`、`restrictions.md`、專案規則與目前適用的 Skills。
- 若必須修改原範圍外的關聯檔案，只處理最小必要部分並在結果中說明。

### 4. Validate

- 依 `validation.md`、Project Config 與適用 Skills 執行相關驗證。
- 驗證失敗時先判斷是否由本次修改造成，不得隱瞞或直接宣告完成。
- 無法執行時記錄原因、未驗證項目與建議指令。

### 5. Self Review

- 檢查 Scope、Data Flow、Architecture、Code Quality 與 Validation。
- 確認沒有無關修改、行為破壞、未授權重構或未說明風險。

### 6. Report

- 依 `output.md` 回報修改內容、完成需求、驗證結果、未完成事項與風險。

## 暫時保留的 Skill 取用規則

- 本流程仍假設進入 Developer 前已完成適用 Skills 的選取。
- Developer 在執行期間不得自行改用不同 Target、Framework、Language、Runtime 或 Task Skill。
- 發現既有選取不足或與 repository evidence 不符時，先停止受影響部分並回報，不得自行補載。
