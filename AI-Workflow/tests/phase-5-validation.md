# Phase 5 驗證矩陣

| 情境 | 必要結果 |
| --- | --- |
| `current-alias-success` | 精確 alias 解析出唯一 Module；相符且明確的 current pointer 選取一份 required Context。 |
| `unbound-blocked` | Null pointer 與未綁定的 Project 身分必須阻擋；不得使用 timestamp fallback。 |
| `cross-project-blocked` | 屬於其他 Project 的 current 候選必須阻擋，且永遠不得選取。 |
| `stale-warning` | 明確標記 current、status 為 stale 且 optional 的 Project Context 可以選取，但必須產生 warning。 |
| `stale-high-risk-blocked` | 存在高風險條件時，相同的 stale Context 必須轉為 required 並阻擋。 |

所有情境都必須確認：已選 record 包含 `required` 與非空白 `reason`，而且 Context 檔案只能在確定性選取完成後讀取。
