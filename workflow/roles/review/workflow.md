# Review 工作流程

Review 直接依使用者指定範圍、實際變更與 repository evidence 執行唯讀檢查。

## 1. Select Mode

- 使用者以 `模式：change`、`mode: change` 或 `mode=change` 明確指定時，使用 `change`。
- 使用者以 `模式：feature`、`mode: feature` 或 `mode=feature` 明確指定時，使用 `feature`。
- 未指定模式時，依任務主要檢查對象判斷：
  - diff、staged changes、commit、PR 或指定修改檔案：`change`。
  - 頁面、模組、完整 user flow、API 到 UI 整合或整體功能狀態：`feature`。
- 兩種模式都合理且選擇會改變檢查範圍時，先向使用者確認。
- 模式只決定本次 Review 範圍，不改變 Review 的唯讀角色邊界。

## 2. Confirm Scope

- 確認需求、受檢範圍與完成判定依據。
- `change` 以實際變更及確認其影響所需的直接相關程式碼為主要範圍。
- `feature` 以功能入口、主要資料流、直接依賴、使用者流程與驗證結果為主要範圍。

## 3. Collect Evidence

- 讀取需求、變更內容與確認影響所需的最小相關程式碼。
- 使用 `checks/common.md` 作為所有 Review 的共通檢查基準。
- 只使用 `restrictions.md` 允許的唯讀命令。
- 不因發現相鄰問題而無限制擴大 Review 範圍。

## 4. Apply Checks

- 檢查需求符合度、正確性、資料流、錯誤處理、contract 相容性與回歸風險。
- 有適用 Target Skill 時，套用其專業檢查規則。
- 不把純風格差異、個人偏好或缺乏證據的猜測列為缺陷。

## 5. Classify Findings

- 依 `restrictions.md` 區分 blocking findings、risks 與 suggestions。
- 每個 finding 必須包含位置、Evidence、Impact 與最小必要修正方向。
- 相同根因只保留能清楚說明問題的必要 finding，避免重複列點。

## 6. Validate

- 確認既有測試、可取得的驗證結果及與受檢變更的關聯。
- 不因測試存在就假設行為正確。
- 未執行、失敗或無法確認的驗證必須明確標記。

## 7. Decide

- 依 `pass-conditions.md` 判定 PASS 或 FAIL。
- 不使用 Conditional PASS。
- 存在 blocking finding 時不得判定 PASS。

## 8. Report

- 依 `output.md` 產出結果。
- 結果中明確標示本次使用的 `change` 或 `feature` 模式。
- Findings 優先於摘要，並在最後說明未驗證事項與剩餘風險。

## 暫時保留的 Skill 取用規則

- Target Check 只能來自進入 Review 前已選取的 Review Skill。
- Review 執行期間不得自行補載或推測不同 Target Skill。
- 若缺少必要 Target Skill，仍可完成 `checks/common.md` 的共通檢查，但必須標記未套用的專業檢查範圍。
