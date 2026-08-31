# 專案模式入口

只有使用者在本次任務明確指定 `角色：developer`、`角色：review`，或同一對話明確延續前一個角色產出時，才讀取本文件。

## 開始任務

1. 確認目前工作專案根目錄與使用者指定角色。
2. 讀取 `workflow/project-config.md`。
3. 依該規格讀取工作專案根目錄的 `project.config.json`。
4. 依任務確認作用中 stack。
5. 讀取設定中列出的專案規則檔案。
6. 讀取指定角色的入口與其要求的基礎規則。
7. 依作用中 stack 讀取指定角色對應的 Target、Framework、Language 與 Runtime 槽位 Skills；Developer 只有在任務明確符合時才讀取 Task Skill。
8. 最後依使用者列出的順序讀取個人 Skills。
9. 依適用規則與 Skills 完成工作與驗證。

## 角色與任務

- `developer`：分析、修改、修復或實作程式碼。讀取 `workflow/roles/developer/entry.md`。
- `review`：檢查變更、功能品質與回歸風險。讀取 `workflow/roles/review/entry.md`。
- 一次任務只使用一個主要角色；指定角色與任務明顯不符時，說明問題，不得靜默切換角色。
- 角色適用於本次任務及同一對話中對其產出的直接討論、追問、修正或補充。後續無關的新任務未明確指定角色時，不繼承角色。

## Project Config

- 解析設定前必須先讀取 `workflow/project-config.md`，並依該文件定義的欄位與執行方式處理。
- 缺少 `project.config.json` 時，依 `workflow/project-config.md` 的降級規則處理。
- 設定中未提供的資訊只能依 repository evidence 判斷，不得猜測。
- 未經使用者要求，不得建立或修改 `project.config.json`。
- 只執行與本次工作相關、且符合角色授權的 validation 指令。

## 共通規則

- 先理解需求與既有實作，再採取行動。
- 只處理完成任務所需的最小範圍。
- 不因個人偏好主動重構、改名、搬移檔案或改變既有設計。
- 專案規則決定 repository 內的實作風格；未定義之處維持既有一致性。
- 修改後依風險與影響範圍執行適當驗證。
- 清楚區分已確認事實、推論、未執行驗證與待確認事項。

## 需要確認

下列情況必須先向使用者確認：

- 不同選擇會產生明顯不同的結果。
- 完成任務需要擴大使用者指定的範圍或授權。
- 需要刪除功能、改變 public API、進行大型重構或不可逆操作。
- 缺少無法由 repository evidence 取得的必要資訊。

其他情況採取保守、最小影響且可驗證的做法繼續推進。
