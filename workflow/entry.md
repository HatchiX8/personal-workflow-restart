# Personal Agent Workflow 入口

## 編碼規則

- 所有 Workflow、專案規則、設定、原始碼與文字檔案，第一次讀取時就必須使用 UTF-8。
- 執行可能輸出文字的命令前，先將輸入與輸出編碼設定為 UTF-8。
- 不得先解讀亂碼內容再推測原意或採取行動。
- 發現內容無法以 UTF-8 正確解碼時，停止使用該內容並回報實際檔案與問題。
- 新增或修改文字檔案時使用 UTF-8，除非專案規則明確要求其他編碼。

## 開始任務

1. 確認目前工作專案根目錄。
2. 讀取 Workflow 根目錄的 `workflow/project-config.md`。
3. 依該規格讀取工作專案根目錄的 `project.config.json`。
4. 根據使用者指定的角色或任務主要交付成果選擇一個主要角色。
5. 依角色與任務確認作用中 stack；Project Analyst 讀取全部 stacks，跨前後端的 Module Analyst 可使用最小必要的多個 stacks。
6. 讀取設定中列出的專案規則檔案。
7. 讀取該角色的 `entry.md`。
8. 依作用中 stack 載入相關槽位 Skills。
9. 依角色規則完成工作與驗證。

## 路徑基準

- Workflow Root 固定為 `C:\Users\MiLu\Desktop\個人用\agent\controlled-agent-workflow`。
- Workflow 內的角色位於 `workflow/roles/`，角色 Skills 位於 `workflow/roles/<role>/skills/`。
- Project Analysis 與 Module Context 的預設輸出位於 Workflow Root 的 `agent-workspaces/analysis/`，不得以工作專案根目錄解析該路徑。
- `project.config.json` 與其中列出的相對路徑，以目前工作專案根目錄為基準。

## 角色選擇

- 使用者明確指定角色時，以指定角色為準。
- 修改、修復、實作或分析程式碼：`workflow/roles/developer/entry.md`
- 檢查變更、功能品質或回歸風險：`workflow/roles/review/entry.md`
- 建立專案結構、技術棧與工程風格理解：`workflow/roles/project-analyst/entry.md`
- 建立指定模組的邊界、資料流與依賴理解：`workflow/roles/module-analyst/entry.md`
- 一次任務只使用一個主要角色。
- 指定角色與任務明顯不符時，向使用者說明，不得靜默切換角色。

## Project Config

- 解析設定前必須先讀取 `workflow/project-config.md`，並依該文件定義的欄位與執行方式處理。
- 缺少 `project.config.json` 時，使用角色共通規則繼續工作，並將缺少專案設定列為未確認事項。
- 設定中未提供的資訊只能依 repository evidence 判斷，不得猜測。
- 未經使用者要求，不得建立或修改 `project.config.json`。
- 只執行與本次工作相關的 validation 指令。

## Skills

- 在 `workflow/roles/<role>/skills/` 下，依序讀取作用中 stack 對應的 `target`、`framework`、`language`、`runtime` 槽位 Skills。
- 只有任務明確符合時才讀取 `task` 槽位 Skill。
- Project Config 與 repository evidence 衝突時，依 `workflow/project-config.md` 處理。
- Skills 只補充特定技術或工作類型的規則。
- 沒有適用 Skill 時，依角色基礎規則繼續工作。
- Skill 不得擴大使用者授權、工作範圍或角色邊界。

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
