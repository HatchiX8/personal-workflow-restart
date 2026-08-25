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

每則使用者任務獨立判斷；不因目前所在目錄、上一則任務的角色或 repository 內容自動進入專案模式。

1. 使用者明確指定 `角色：developer` 或 `角色：review` 時，進入專案模式並讀取 `workflow/project-entry.md`。
2. 未指定角色、但明確指定 `個人 Skills：<skill-id>` 時，進入 Skill 模式：讀取 `assistant/core.md`、`assistant/preferences.md`，再依列出順序讀取指定 Skill 的 `SKILL.md`。
3. 未指定角色與個人 Skills 時，進入助理模式：讀取 `assistant/core.md` 與 `assistant/preferences.md`，直接依使用者問題與對話脈絡回應。

角色名稱或 Skill ID 無效、格式不符或無法以 UTF-8 讀取時，不得猜測替代流程；回報實際問題。

## 助理模式邊界

- 一般提問、討論、設計評估、延續前文與說明需求時，直接回答；不得讀取 `project.config.json`、選擇角色或載入角色 Skills。
- 使用者明確要求唯讀了解專案時，可讀取完成回答所需的最小檔案範圍；不因此啟動正式專案 workflow 或產生正式分析報告。
- 使用者要求修改、修復、實作、重構、建立或刪除工作專案內容，但未指定角色時，不得修改。請使用者在該任務明確指定 `角色：developer`。
- 使用者想要正式檢查變更、功能品質或回歸風險，但未指定角色時，可提供一般討論；需要依 Review 流程檢查時，請使用者明確指定 `角色：review`。

## 個人 Skills

- 指定格式為 `個人 Skills：<skill-id>`；多個 ID 使用半形逗號分隔，並依列出順序讀取。
- Skill ID 必須是 lowercase kebab-case，只能解析至 Workflow Root 的 `skills/<skill-id>/SKILL.md`，不得接受絕對路徑、`..` 或其他任意檔案路徑。
- 未指定角色時，個人 Skill 可作為獨立流程。Skill 是否需要專案設定、報告輸出或其他上下文，必須由其自身的 `SKILL.md` 定義，不由本入口推測。
- 指定角色時，個人 Skill 是角色工作的補充：必須在 `workflow/project-entry.md` 要求的專案規則、角色規則與角色 Skills 讀取完成後才讀取。
- `project-analysis` 與 `module-analysis` 是獨立唯讀流程，不能與 Developer 或 Review 同時作為同一任務流程；兩者同時指定時要求使用者拆成兩次任務。
- Skill 不得擴大使用者授權、修改範圍或角色邊界。無角色的 Skill 不得修改工作專案內容，除非 Skill 明確產出至 Workflow Root 的受控位置。
- 載入順序不代表規則優先序；Skill 與入口、角色限制或專案規則衝突時，停止套用衝突部分並回報。
- 獨立個人 Skill 任務結束並判定為 `completed`、`partial`、`blocked` 或 `cancelled` 時，必須在完成回覆前讀取並依 `workflow/task-journal.md` 建立任務日誌與執行保存期限清理。此規則只授權在該規則指定的 `task-journals/` 與 `weekly-reviews/` 位置寫入、讀取或刪除過期紀錄，不授權修改工作專案、`analysis/` 或其他位置。

## 路徑基準

- Workflow Root 固定為 `C:\\Users\\MiLu\\Desktop\\個人用\\agent\\controlled-agent-workflow`。
- 助理共通規則位於 `assistant/`。
- 專案模式入口位於 `workflow/project-entry.md`，角色位於 `workflow/roles/`，角色 Skills 位於 `workflow/roles/<role>/skills/`。
- 個人 Skills 位於 Workflow Root 的 `skills/<skill-id>/SKILL.md`。
- Project Analysis 與 Module Context 的預設輸出位於 Workflow Root 的 `agent-workspaces/analysis/`，不得以工作專案根目錄解析該路徑。
- `project.config.json` 與其中列出的相對路徑，以目前工作專案根目錄為基準；只有專案模式或指定 Skill 明確要求時才讀取。
