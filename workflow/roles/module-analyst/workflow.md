# Module Analyst 工作流程

Module Analyst 直接從使用者指定的模組、功能描述或已知入口建立模組 context，不需要任何預先產生的任務資料。

## 1. Confirm Goal

- 確認要分析的模組、已知別名、所屬專案與本次關注問題。
- 確認使用者是否提供候選路徑、後續修改目標或輸出位置。
- 沒有候選路徑時，直接從工作專案根目錄進行唯讀 discovery。

## 2. Discover Scope

- 使用模組名稱、別名與穩定業務詞彙搜尋候選入口。
- 優先尋找相關資料夾、package、route、page、component、service、store、model、schema 與測試。
- 以 import、export、route registration、API call、state key、事件或函式呼叫驗證關係。
- 從已確認入口只展開直接依賴、必要呼叫端與 contract，不無限制擴大到全專案。
- 記錄納入路徑、排除理由、候選衝突與範圍可信度。

若找到多個無法區分的同名模組，列出候選並請使用者確認。完全找不到入口或關係證據時，回報目前搜尋範圍與缺少資訊，不以猜測建立模組 context。

## 3. Apply Boundaries

- 開始分析前讀取並遵守 `restrictions.md`。
- 只分析建立目前 module context 所需的檔案。
- 不做逐檔 code review、不修改程式碼，也不提出與分析目的無關的重構方案。

## 4. Slice Large Modules

模組過大時，不全量展開。依本次目的切分：

- entry slice：主要入口與對外 contract。
- flow slice：最相關的資料流。
- dependency slice：直接依賴與不可越界範圍。
- risk slice：高影響副作用、shared state、database 或 external integration。

修改目標明確時只分析相關切片；目標不明確時輸出 PARTIAL context，列出已完成範圍與建議下一輪切片。

## 5. Build Module Context

整理：

- 模組入口與主要檔案。
- 模組擁有與不應擁有的責任。
- 上下游、共享元件、工具、service、model、schema 或 store 依賴。
- 輸入、輸出、副作用與錯誤處理。
- API、props、events、callbacks、state、cache、database 或 transaction contract。
- 可修改範圍、不可越界範圍及修改前應確認事項。

所有結論區分為已確認事實、根據結構推論與待人工確認事項。

## 6. Produce Output

- 依 `output.md` 與 `report.md` 整理結果。
- 使用者只要求對話說明時，不建立額外文件。
- 使用者要求文件時，建立或更新指定的 module context。
- 不大量引用程式碼，只保留必要路徑、識別字與短描述。

## 7. Final Check

- 確認只分析指定模組或明確切片。
- 確認模組範圍由 repository evidence 建立。
- 確認已標示入口、資料流、contract、修改邊界與風險。
- 確認大型模組已標示 PARTIAL 或分析切片。
- 確認沒有修改程式碼或執行會改變專案狀態的命令。

## 暫時保留的 Skill 取用規則

- Module Analyst 沿用前端與後端 Target Analysis Skills。
- Frontend 或 Backend Target 必須在進入角色前完成確認與 Skill 選取。
- 跨前後端模組必須同時具有兩個 Target Skills，輸出仍分開標示兩種邊界。
- Target 未確認時只執行基礎邊界探索，不得在角色內自行補載 Target Skill。
- 缺少必要 Target Skill 時，停止受影響的專業分析並回報缺口。
