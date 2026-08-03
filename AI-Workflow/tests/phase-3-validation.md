# Phase 3 驗證矩陣

| 情境 | 必要結果 |
| --- | --- |
| `natural-language-develop` | 推導出 Develop、Bugfix、Developer、Frontend 與 Lunch。Resolution 可以選取 Developer 與 Frontend 規則，但因 Lunch 沒有綁定 Project 的 current Context，Preflight 必須阻擋。 |
| `explicit-role-skill` | 驗證 canonical `developer` 與 `developer.language.typescript`，從自然語言推導 Frontend，並只選取 Registry 登錄的 Frontend／Language 規則。 |
| `ambiguous-blocking` | 保留候選與低信心資訊，不產生替代 Role 或 Target，並在執行前阻擋。 |

每個情境都必須確認：所選 rule ID 中沒有 README，且 Rule Resolution 未選取以 timestamp 命名的 Lunch Context 候選。
