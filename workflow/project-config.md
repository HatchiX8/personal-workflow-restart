# Project Config 規格

Agent 在解析任何工作專案的 `project.config.json` 前，必須先讀取本文件。

## 完整格式

```json
{
  "version": 1,
  "project": {
    "name": "example-web",
    "root": "."
  },
  "stacks": [
    {
      "id": "web",
      "target": "frontend",
      "frameworks": ["vue"],
      "languages": ["typescript"],
      "runtimes": ["node-js"]
    }
  ],
  "rules": ["docs/agent-rules.md"],
  "validation": {
    "lint": "npm run lint",
    "typecheck": "npm run typecheck",
    "build": "npm run build",
    "test": "npm test"
  }
}
```

## 欄位

### `version`

- 必填整數，目前固定為 `1`。
- Agent 不得自行轉換未知版本。

### `project`

- `name`：必填字串，供 Agent 識別與回報目前工作專案。
- `root`：必填字串，以 `project.config.json` 所在目錄為基準；一般專案使用 `.`。

### `stacks`

- 必填陣列，列出專案內可執行工作的技術組合。
- 單一技術棧專案仍使用一個元素的陣列。
- Full Stack 或 Monorepo 可建立多個 stack。

每個 stack 包含：

- `id`：必填且在專案內唯一，使用 lowercase kebab-case。
- `target`：必填字串，例如 `frontend`、`backend`、`tooling`。
- `frameworks`：必填字串陣列，例如 `vue`、`react`、`express`、`fastapi`；沒有時使用空陣列。
- `languages`：必填字串陣列，例如 `typescript`、`javascript`、`python`。
- `runtimes`：必填字串陣列，例如 `node-js`、`python`；沒有獨立 Runtime Skill 時可使用空陣列。

技術 ID 必須與 Skill 資料夾名稱一致，不在設定中填寫完整 Skill 路徑。

`frameworks`、`languages` 與 `runtimes` 的空陣列是有效設定，表示該槽沒有預先宣告，不是格式錯誤。

### `rules`

- 必填字串陣列，可為空。
- 每個項目是工作專案規則檔案的相對路徑，以 `project.root` 為基準。
- Agent 必須在執行角色工作前讀取所有列出的規則。

### `validation`

- 必填物件，可為空。
- 支援 `lint`、`typecheck`、`build`、`test` 等專案已確認可用的指令。
- 指令只表示可用方式，不代表每次任務都必須全部執行。
- Agent 只執行與本次變更和角色授權相符的驗證。

## Agent 執行方式

1. 以 UTF-8 讀取本文件與工作專案的 `project.config.json`。
2. 驗證必要欄位與資料型別，不補造缺少的技術資訊。
3. 確認本次任務的作用中 stack：
   - 使用者明確指定 stack 時使用該 stack。
   - 只有一個 stack 時直接使用。
   - 多個 stack 時，依任務指定範圍與 repository evidence 選擇。
   - 無法可靠區分且選擇會改變結果時，向使用者確認。
   - Project Analyst 進行完整專案分析時不縮成單一 stack；讀取全部已宣告 stacks，並逐一與 repository evidence 比對。
   - Module Analyst 的模組明確跨越多個 stack 時，可選取涵蓋該模組的最小 stack 集合；不得因此擴大成全專案分析。
4. 讀取 `rules` 中的所有專案規則。
5. 讀取主要角色 `entry.md`。
6. 在 `workflow/roles/<role>/skills/` 下依序尋找並讀取：
   - `target/<target>/SKILL.md`
   - 每個 `framework/<framework>/SKILL.md`
   - 每個 `language/<language>/SKILL.md`
   - 每個 `runtime/<runtime>/SKILL.md`
7. 只有任務明確符合時，才讀取相關 `task/<task>/SKILL.md`。
8. 依 `validation` 使用與修改範圍相關的指令。

使用多個 stacks 時，合併其與目前角色相符的 Skills，重複 Skill 只讀取一次。Project Analyst 尚無對應 Skill 時，仍須使用全部 stacks 作為專案辨識與設定比對資料，不得因此縮小專案分析範圍。

某角色沒有對應槽位 Skill 時，不得改讀其他角色的 Skill。繼續使用角色基礎規則，並在該技術專業規則確實影響結果時說明缺口。

## 缺少或不完整設定

依下列順序處理，不得自行修改 `project.config.json`：

### Config 不存在

- 使用角色基礎規則與 repository evidence 繼續工作。
- 不得猜測技術棧或驗證指令。
- 在結果中標記未載入 Project Config。

### 選配技術槽為空

`frameworks`、`languages`、`runtimes` 或 `validation` 為空時，採降級執行：

- 先使用已宣告的 Target Skill 與角色基礎規則。
- 在進入角色前，以 manifest、lock file、build config、原始碼與其他 repository evidence 辨識未宣告技術。
- 只有證據明確且能唯一對應 Skill ID 時，才補充選取對應 Framework、Language 或 Runtime Skill。
- 證據不足時不補載該槽 Skill，並在專業規則確實影響結果時回報缺口。
- `validation` 為空時，可以使用 repository 中明確存在的 script 或設定；無法確認時標記未驗證，不猜測指令。

補充選取必須在進入角色前完成。角色執行期間仍不得自行更換或補載 Skills。

### 必要欄位或格式錯誤

下列情況視為無法安全解析：

- 缺少 `version`，或版本不是 `1`。
- 缺少 `project.name` 或 `project.root`，或其值不是非空字串。
- `project.root` 無法解析為存在的工作專案範圍。
- 缺少 `stacks`，`stacks` 不是陣列，或陣列為空。
- stack 缺少 `id` 或 `target`，ID 重複，或欄位型別錯誤。
- `frameworks`、`languages` 或 `runtimes` 不是字串陣列。
- `rules` 不是字串陣列，或 `validation` 不是物件。

發生上述情況時：

- 不進入會修改專案狀態的角色工作。
- 列出實際錯誤欄位與原因。
- 若使用者只要求唯讀理解，且錯誤不影響分析範圍，可以使用角色基礎規則繼續分析並標記設定缺口。
- 其他情況請使用者修正設定或明確提供缺少資訊。

### Rules 路徑無法讀取

- `rules` 中列出的檔案都視為必要專案規則。
- 任一路徑不存在、超出 `project.root`、無法以 UTF-8 讀取或無權存取時，不得開始角色工作。
- 回報失敗路徑與原因，不得忽略該規則或自行移除設定。

### 多個 Stack

- 使用者明確指定 stack 時使用指定項目。
- 未指定時，依任務範圍與 repository evidence 選擇唯一相符的 stack。
- Project Analyst 的完整專案分析是例外：使用全部 stacks 建立專案地圖，不要求使用者先選一個 stack，也不將專案拆成多份分析。
- Module Analyst 的指定模組若有明確跨 stack 證據，可選取涵蓋該模組的最小 stack 集合並載入對應 Target Skills。
- 多個 stack 都合理但會造成不同讀取、修改或驗證範圍時，先詢問使用者。
- 不得為了避免詢問而任意選擇第一個 stack。

## 設定與 Repository Evidence 不一致

- 不得因 Project Config 存在就忽略實際 repository evidence。
- 若設定與 lock file、manifest、原始碼或建置設定明顯衝突，停止使用衝突欄位並回報差異。
- 衝突會改變作用中 stack、Skill 選取、修改範圍或驗證方式時，先向使用者確認，不得開始修改。
- 衝突不影響唯讀分析範圍時，可以繼續分析，但必須把兩方證據與未確認結論分開呈現。
- 未經使用者要求，不得自動修改 `project.config.json`。

## 決策摘要

| 狀況 | Agent 行為 |
|---|---|
| Config 不存在 | 使用角色基礎規則降級執行並回報 |
| 技術槽或 validation 為空 | 依明確 repository evidence 補足；無法確認時降級並回報 |
| 找不到對應 Skill | 不改讀其他角色 Skill；使用角色基礎規則並回報缺口 |
| 必要欄位缺少或型別錯誤 | 不執行修改；回報設定錯誤 |
| Rules 路徑無法讀取 | 停止角色工作並回報路徑 |
| 多個 stack 無法唯一選擇 | 詢問使用者 |
| Config 與 repository evidence 衝突 | 停用衝突欄位；影響執行時先詢問 |
