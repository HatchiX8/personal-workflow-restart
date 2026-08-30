# Personal Agent 入口

## 編碼規則

- 所有 Workflow、規則、Skills、設定、原始碼與文字檔案，第一次讀取時就必須使用 UTF-8。
- 執行可能輸出文字的命令前，先將輸入與輸出編碼設定為 UTF-8。
- 不得先解讀亂碼內容再推測原意或採取行動。
- 發現內容無法以 UTF-8 正確解碼時，停止使用該內容並回報實際檔案與問題。
- 新增或修改文字檔案時使用 UTF-8，除非目標專案規則明確要求其他編碼。

## 規則路徑測試

使用者明確表達要測試入口、規則路徑、Workflow 分流或規則是否被讀取時，優先進入此測試路徑；用語可近似，不要求固定 Prompt 格式。

- 只讀取本入口與本節規則，不讀取 `assistant/`、`project.config.json`、角色規則或任何 Skill。
- 不執行命令、不讀取工作專案檔案、不修改任何檔案。
- 不再判斷角色、個人 Skills 或任務內容。
- 固定只回覆下列訊息，不補充其他內容：

```text
規則路徑測試完成：已載入個人agent規則；未載入專案設定、角色規則或 Skills，且未修改任何檔案。
```

## 模式選擇

每則訊息都重新判斷明確指定的角色與 Skills；只有「原流程的直接延續」及「目前對話已啟用個人化模式」可以沿用同一對話的狀態。不得因目前所在目錄或 repository 內容自動進入專案模式。

依下列優先序選擇模式，命中後不再執行較低順位的模式：

1. 使用者明確指定 `角色：developer` 或 `角色：review` 時，進入專案模式並讀取 `workflow/project-entry.md`。
2. 未指定角色、但明確指定 `個人 Skills：<skill-id>` 時，進入 Skill 模式，依列出順序讀取指定 Skill 的 `SKILL.md`；不讀取助理模式規則。
3. 使用者明確延續前一個角色或 Skill 的產出，進行討論、追問、修正或補充時，延續原流程；不切換至個人化模式或助理模式。
4. 目前對話已啟用個人化模式時，讀取並執行個人化 Skill；不讀取助理模式規則。
5. 未命中以上模式，但訊息符合已啟用個人化 Skill 的觸發條件時，進入個人化模式並讀取該 Skill；不讀取助理模式規則。
6. 未命中角色、Skill、原流程延續或個人化模式時，進入最小助理模式，讀取 `assistant/core.md` 與 `assistant/preferences.md`。

角色名稱或 Skill ID 無效、格式不符或無法以 UTF-8 讀取時，不得猜測替代流程；回報實際問題。

## 個人化模式

- 目前啟用的個人化 Skill 為 `wang-ning`，規則位於 `skills/wang-ning/SKILL.md`。判斷是否符合個人化觸發條件時，只讀取此 Skill；不得遍歷或猜測其他 Skills。
- 使用者的訊息符合個人化 Skill 的觸發條件時，進入個人化模式。
- 個人化模式一旦在目前對話中啟用，後續訊息持續使用該模式，不要求重複出現觸發詞。
- 開啟新的對話時，不繼承上一個對話的個人化模式。
- 使用者明確指定角色或 Skill 時，優先執行指定流程。
- 前一個角色或 Skill 的產出仍在被討論、追問或修正時，視為原流程的延續，不觸發個人化模式。
- 使用者可用「結束個人化模式」或同義表達返回最小助理模式。
- 已登記的個人化 Skill 若不存在、無法以 UTF-8 讀取、未定義觸發條件或明確標示未啟用，不得進入或延續個人化模式，改用其他已命中的模式或最小助理模式，並回報實際問題。

## 助理模式邊界

- 最小助理模式只處理未命中角色、Skill、原流程延續或個人化模式的訊息；不得讀取 `project.config.json`、選擇角色或載入 Skills。
- 使用者明確要求唯讀了解專案時，可讀取完成回答所需的最小檔案範圍；不因此啟動正式專案 workflow 或產生正式分析報告。
- 使用者要求修改、修復、實作、重構、建立或刪除工作專案內容，但未指定角色時，不得修改。請使用者在該任務明確指定 `角色：developer`。
- 使用者想要正式檢查變更、功能品質或回歸風險，但未指定角色時，可提供一般討論；需要依 Review 流程檢查時，請使用者明確指定 `角色：review`。

## 個人 Skills

- 指定格式為 `個人 Skills：<skill-id>`；多個 ID 使用半形逗號分隔，並依列出順序讀取。
- Skill ID 必須是 lowercase kebab-case，只能解析至 Workflow Root 的 `skills/<skill-id>/SKILL.md`，不得接受絕對路徑、`..` 或其他任意檔案路徑。
- 除入口明確指定可依觸發條件啟用的個人化 Skill 外，其他個人 Skills 只在使用者明確指定時載入。
- 未指定角色時，個人 Skill 可作為獨立流程。Skill 是否需要專案設定、報告輸出或其他上下文，必須由其自身的 `SKILL.md` 定義，不由本入口推測。
- 指定角色時，個人 Skill 是角色工作的補充：必須在 `workflow/project-entry.md` 要求的專案規則、角色規則與角色 Skills 讀取完成後才讀取。
- `project-analysis` 與 `module-analysis` 是獨立唯讀流程，不能與 Developer 或 Review 同時作為同一任務流程；兩者同時指定時要求使用者拆成兩次任務。
- Skill 不得擴大使用者授權、修改範圍或角色邊界。無角色的 Skill 不得修改工作專案內容，除非 Skill 明確產出至 Workflow Root 的受控位置。
- 載入順序不代表規則優先序；Skill 與入口、角色限制或專案規則衝突時，停止套用衝突部分並回報。
- 除持續對話型的個人化模式外，獨立個人 Skill 任務結束並判定為 `completed`、`partial`、`blocked` 或 `cancelled` 時，必須在完成回覆前讀取並依 `workflow/task-journal.md` 建立任務日誌與執行保存期限清理。此規則只授權在該規則指定的 `task-journals/` 與 `weekly-reviews/` 位置寫入、讀取或刪除過期紀錄，不授權修改工作專案、`analysis/` 或其他位置。

## 路徑基準

- 助理共通規則位於 `assistant/`。
- 專案模式入口位於 `workflow/project-entry.md`，角色位於 `workflow/roles/`，角色 Skills 位於 `workflow/roles/<role>/skills/`。
- 個人 Skills 位於 Workflow Root 的 `skills/<skill-id>/SKILL.md`。
- Project Analysis 與 Module Context 的預設輸出位於 Workflow Root 的 `agent-workspaces/analysis/`，不得以工作專案根目錄解析該路徑。
- `project.config.json` 與其中列出的相對路徑，以目前工作專案根目錄為基準；只有專案模式或指定 Skill 明確要求時才讀取。
