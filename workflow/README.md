# Workflow

## 執行關係

```text
workflow/entry.md
→ workflow/project-config.md
→ 工作專案 project.config.json
→ 主要角色 entry.md
→ 作用中 stack 對應的槽位 Skills
→ Task Skill
→ 執行與驗證
```

入口只連接專案設定、角色規則與 Skills，不建立 Task Manifest、registry、Execution Profile、fingerprint 或其他前置推導產物。

## 角色

- `developer`：分析、修改、修復或實作程式碼。
- `review`：檢查變更、功能品質與回歸風險。
- `project-analyst`：建立專案結構、技術棧與工程風格理解。
- `module-analyst`：建立指定模組的邊界、資料流與依賴理解。

使用者明確指定角色時直接使用。未指定時，以任務的主要交付成果選擇一個角色。

## Review 模式

Review 角色支援兩種任務層級模式：

- `change`：檢查 diff、staged changes、commit、PR 或指定修改檔案。
- `feature`：檢查頁面、模組、完整 user flow 或整體功能狀態。

需要精準指定時，在任務中加入：

```text
角色：review
模式：change
任務：檢查目前 staged changes
```

或：

```text
角色：review
模式：feature
任務：檢查登入功能的完整流程
```

Review mode 是單次任務的檢查範圍，不寫入 `project.config.json`。未指定時由 Review workflow 根據檢查對象判斷；兩種模式都合理且會影響範圍時，必須向使用者確認。

## Skills 槽位

角色的 Skills 位於 `workflow/roles/<role>/skills/`，依下列槽位組合：

```text
target/<id>/SKILL.md
framework/<id>/SKILL.md
language/<id>/SKILL.md
runtime/<id>/SKILL.md
task/<id>/SKILL.md
```

各角色只建立實際需要的槽位。Developer 目前具有完整技術槽位；Review 與 Module Analyst 目前以 Target Skills 為主；Project Analyst 尚未配置專用 Skills。

載入順序：

1. 角色入口。
2. Target Skill。
3. Framework Skills。
4. Language Skills。
5. Runtime Skills。
6. 與本次任務明確相符的 Task Skill。

Project Config 描述專案的穩定技術事實，Task Skill 則由本次任務決定。例如 Vue + TypeScript 前端專案會使用 `target/frontend`、`framework/vue`、`language/typescript` 與 `runtime/node-js`；只有明確要求重構時才另外使用 `task/refactor`。

## 規則邊界

- 角色規則定義責任與工作限制。
- Target Skill 定義前端、後端或 Tooling 的共通規則。
- Framework、Language 與 Runtime Skills 只補充各自技術維度。
- Task Skill 只補充本次工作類型，不得改寫角色或技術槽位規則。
- 專案既有慣例與明確專案規則優先於通用風格偏好。
- Skill 不得擴大使用者授權、修改範圍或角色邊界。

## UTF-8

入口、角色、Skills、Project Config 與工作專案文字檔案預設以 UTF-8 讀寫。Agent 必須在第一次讀取時指定 UTF-8，不得先解讀亂碼再推測內容。
