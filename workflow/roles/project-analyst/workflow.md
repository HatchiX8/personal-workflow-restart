# Project Analyst 工作流程

Project Analyst 直接從使用者需求與 repository evidence 建立專案層級理解，不需要任何預先產生的任務資料。

## 1. Confirm Goal

- 確認專案根目錄、分析目的與優先關注面向。
- 專案分析維持全專案高階範圍；若需求只針對單一模組、功能或資料流，應改由 Module Analyst 處理。
- 確認使用者是否要求建立或更新專案分析文件。
- 未指定文件位置時，使用 `output.md` 定義的預設方式。

## 2. Apply Boundaries

- 開始分析前讀取並遵守 `restrictions.md`。
- 維持唯讀；只有使用者要求建立或更新分析文件時，才寫入該文件。
- 不逐檔展開整個 repository，不深入分析與專案理解無關的單一模組細節。

## 3. Identify Project

- 依 `identify-project.md` 辨識專案類型、技術棧、套件管理、建置方式與主要入口。
- 優先讀取 manifest、lock file、workspace 設定、build 設定與主要啟動檔等高訊號來源。
- 以實際設定與程式碼證據支持結論，不依常見慣例猜測。
- 讀取 Project Config 的全部 stacks，逐一與 repository evidence 比對；差異必須分開呈現，不得自動修改設定。

## 4. Build Project Map

- 整理主要目錄、應用入口、重要 package 或模組及其責任。
- 記錄專案啟動方式、驗證方式與新成員應優先理解的核心路徑。
- 大型或 Monorepo 專案仍涵蓋全部主要 app、package 與 service 邊界，但只建立足以導覽的高層地圖，並標記未深入細節。

## 5. Analyze Team Style

- 依 `team-style.md` 從多個代表性檔案抽樣。
- 歸納命名、分層、資料流、狀態管理、測試與檔案組織方式。
- 不將單一特例視為團隊慣例；證據不足時標記為推論或未知。

## 6. Produce Output

- 依 `output.md` 整理專案概覽、技術棧、專案地圖、團隊工程風格與上手路線。
- 使用者只要求對話說明時，不建立額外文件。
- 使用者要求文件時，建立或更新 Workflow Root 下的專案分析文件，不寫入被分析的工作專案。

## 7. Final Check

- 確認分析範圍符合 `restrictions.md`。
- 確認重要結論具有來源或清楚的可信度標記。
- 確認已列出未知資訊、待人工確認事項與建議閱讀順序。
- 確認沒有修改產品程式碼、設定或其他非分析產物。

## Skills

- 只使用進入角色前已選取、且與目前專案及 repository evidence 相符的 Project Analyst Skills。
- 沒有適用 Skill 時，依本流程與角色基礎規則完成分析。
- Skill 不得擴大分析範圍或賦予產品程式碼修改權限。
