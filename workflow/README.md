# Workflow

## 模式與載入關係

`workflow/entry.md` 是所有任務的共通入口。它先保留 UTF-8 與安全邊界，再依明確指定、原流程延續、個人化對話狀態與最小助理 fallback 分流；不依所在專案自動選擇角色。

```text
個人 Skills：<id> 或明確角色
→ 對應 Skill／專案模式

角色或 Skill 的直接延續
→ 延續原流程

個人化模式已啟用或命中觸發條件
→ 個人化 Skill

其餘訊息
→ 最小助理模式
→ assistant/core.md + assistant/preferences.md
```

最小助理模式不讀取 `project.config.json`，也不推導角色或 Skill。未命中其他模式的一般訊息可直接回答；未指定角色的修改型需求必須要求使用者改以 Developer 角色提出。

## 規則路徑測試

要確認入口是否正確優先載入時，可用接近下列意思的 Prompt：

```text
請測試目前的規則路徑是否有命中。
```

入口會停止在測試路徑，不讀取專案設定、角色或 Skills，並固定回覆測試完成訊息；此路徑不會讀取或修改工作專案。

## 專案角色

- `developer`：分析、修改、修復或實作程式碼。
- `review`：檢查變更、功能品質與回歸風險。

角色必須在每個無關的新任務中明確指定；同一對話中對角色產出的直接討論、追問、修正或補充可延續原流程：

```text
角色：developer
任務：修正訂單數量為 0 時仍會減成負數的問題。
```

```text
角色：review
模式：change
任務：檢查目前 staged changes。
```

Review 的 `change` 用於 diff、commit、PR 或指定修改檔案；`feature` 用於頁面、模組、user flow 或完整功能。兩種模式都合理且會改變檢查範圍時，Review 必須先確認。

## 個人 Skills

個人 Skills 位於 `skills/<skill-id>/SKILL.md`。一般 Skill 只在 Prompt 明確指定時載入；入口明確登記且已啟用的個人化 Skill 可依自身觸發條件與目前對話狀態載入。Project Config 與 repository evidence 都不得自行觸發個人 Skill。

獨立使用 Skill：

```text
個人 Skills：project-analysis
任務：分析這個陌生專案並建立專案分析文件。
```

```text
個人 Skills：module-analysis
任務：分析訂單模組的入口、資料流與修改邊界。
```

角色工作中的擴充 Skill：

```text
角色：developer
個人 Skills：frontend-ui, testing-workflow
任務：完成會員資料編輯頁面並補齊相關測試。
```

角色模式的個人 Skill 在專案規則、角色規則與角色槽位 Skills 之後才載入；它只能補充流程、檢查清單或輸出方式，不能改寫角色邊界或擴大授權。無角色的 Skill 不得修改工作專案，但可依自身規則在 Workflow Root 的受控位置產出文件。

`weekly-team-review` 是明確指定的獨立 Skill，不讀取 Project Config 或角色規則。它的週報寫入 `agent-workspaces/weekly-reviews/`；詳細流程見 `skills/weekly-team-review/SKILL.md`。

## 任務日誌

`workflow/task-journal.md` 是共用 Workflow 規則。每個已結束的 Developer、Review 或獨立個人 Skill 任務都在完成回覆前建立一份客觀日誌，寫入 `agent-workspaces/task-journals/`；最小助理模式、持續對話型的個人化模式與規則路徑測試不建立日誌。日誌的 `completed_at` 是後續週回顧的時間依據，不使用檔案修改時間。每次日誌流程結束後，會清除 `task-journals/` 與 `weekly-reviews/` 中保存期限達 30 天的紀錄，不影響 `analysis/` 或 `acceptance/`。

## Skills 槽位

專案模式下，角色的 Skills 位於 `workflow/roles/<role>/skills/`，依下列槽位組合：

```text
target/<id>/SKILL.md
framework/<id>/SKILL.md
language/<id>/SKILL.md
runtime/<id>/SKILL.md
task/<id>/SKILL.md
```

Developer 依 Target、Framework、Language、Runtime，並在任務明確符合時載入 Task Skill。Review 目前以 Target Skills 為主。技術棧與專案規則由 `project.config.json` 描述，詳細格式與缺漏處理見 `workflow/project-config.md`。

## 規則邊界

- 助理規則處理預設互動、對話脈絡與無角色任務。
- 專案入口處理角色模式、Project Config 與專案規則。
- 角色規則定義責任與工作限制。
- 槽位 Skills 補充特定技術維度；個人 Skills 補充使用者指定的能力或流程。
- Skills 的載入順序不代表規則優先序；專案規則與角色限制優先於補充 Skill。

## UTF-8

入口、助理規則、角色、Skills、Project Config 與工作專案文字檔案預設以 UTF-8 讀寫。Agent 必須在第一次讀取時指定 UTF-8，不得先解讀亂碼再推測內容。
