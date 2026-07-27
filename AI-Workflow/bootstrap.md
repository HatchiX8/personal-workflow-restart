# Bootstrap

本文件是 AI Workflow 的入口規則。

目前 bootstrap 支援 Developer、Project Analyst 與 Review。

## AI Workflow Root Resolution

每次任務都必須先解析 AI Workflow Root。

AI Workflow Root 判斷流程：

1. 若 prompt 開頭明確指定 `AI-Workflow 路徑：<path>`，使用該路徑作為 AI Workflow Root。
2. 若 prompt 開頭明確指定 `Bootstrap 路徑：<path>/bootstrap.md`，使用該 bootstrap 所在資料夾作為 AI Workflow Root。
3. 若 prompt 未指定外部路徑，且目前工作目錄 `.env` 存在 `AI_WORKFLOW_ROOT=<path>`，使用 `AI_WORKFLOW_ROOT` 作為 AI Workflow Root。
4. 若 prompt 未指定外部路徑，且系統環境變數存在 `AI_WORKFLOW_ROOT`，使用 `AI_WORKFLOW_ROOT` 作為 AI Workflow Root。
5. 若以上皆未指定，使用專案根目錄下的 `AI-Workflow/` 作為 AI Workflow Root。

本規則文件中的 `AI-Workflow/...` 皆表示「已解析的 AI Workflow Root 底下的相對路徑」。

## Bootstrap Required

若解析後的 AI Workflow Root 不存在 `bootstrap.md`：

- 停止任務執行
- 不得自行推測入口規則
- 不得直接開始修改程式碼
- 回報缺少 `<AI Workflow Root>/bootstrap.md`

若必要規則檔案不存在：

- 停止任務執行
- 列出缺少的規則檔案
- 不得以預設推測補齊規則
- 不得使用模型預設最佳實踐取代專案規則

## File Encoding Rules

所有檔案讀取、檢視、修改與輸出，皆必須使用 UTF-8 編碼。

若檔案內容包含中文，必須確保：

- 使用 UTF-8 解碼檢視檔案
- 不得使用錯誤編碼導致中文亂碼
- 修改檔案後必須維持 UTF-8 編碼
- 不得因編碼問題移除、替換或改寫中文內容
- 若偵測到中文亂碼，必須停止修改並回報問題

若工具或環境無法確認編碼：

- 不得直接覆寫原檔
- 必須先回報編碼風險
- 必須保留原始中文內容

## Supported Role

- Developer：`AI-Workflow/roles/developer.md`
- Project Analyst：`AI-Workflow/roles/project-analyst.md`
- Review：`AI-Workflow/roles/review.md`

## Prompt Role

任務 prompt 可在開頭指定：

```txt
角色：Developer
```

或：

```txt
角色：Project Analyst
```

或：

```txt
角色：Review
```

## Role Resolution

每次任務都必須先判斷角色。

判斷流程：

1. 讀取 prompt 開頭的 `角色：<role-name>`。
2. 若角色為 `Developer`，讀取 `AI-Workflow/roles/developer.md`。
3. 若角色為 `Project Analyst`，讀取 `AI-Workflow/roles/project-analyst.md`。
4. 若角色為 `Review`，讀取 `AI-Workflow/roles/review.md`。
5. 若未指定角色，預設使用 `Developer`。
6. 若指定的角色不是支援角色，停止任務執行。
7. 若指定角色的規則檔不存在，停止任務執行並回報缺少的角色規則檔。

角色判斷完成後，必須讀取：

- `AI-Workflow/workflow/common.md`

## Reserved

- 其他角色保留預留位置，尚未建立角色規則。
