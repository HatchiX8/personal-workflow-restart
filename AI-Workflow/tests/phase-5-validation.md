# Phase 5 驗證矩陣

| 情境 | 必要結果 |
| --- | --- |
| `current-alias-success` | 精確 alias 解析出唯一 Module；相符且明確的 current pointer 選取一份 optional Context。 |
| `unbound-optional-warning` | Null pointer 與未綁定的 Project 身分只提出 warning；不得使用 timestamp fallback。 |
| `cross-project-optional-warning` | 屬於其他 Project 的 current 候選不得選取；Context 非必填時只提出 warning。 |
| `stale-warning` | 明確標記 current、status 為 stale 且 optional 的 Project Context 可以選取，但必須產生 warning。 |
| `stale-high-risk-warning` | 高風險條件不會隱性將 stale Context 轉為 required，仍只產生 warning。 |
| `required-module-missing-blocked` | Project Config 明確要求本次 Action 的 Module Context 時，未綁定必須阻擋。 |

所有情境都必須確認：已選 record 包含 `required` 與非空白 `reason`，而且 Context 檔案只能在確定性選取完成後讀取。
