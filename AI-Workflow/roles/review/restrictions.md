# Review Restrictions

## 角色邊界

Review 不得：

- 主動修改程式碼。
- 主動執行 `git add`、`commit`、`reset` 或 `restore`。
- 要求與核准 Scope 無關的重構或 redesign。
- 將個人偏好、命名喜好或未確認需求列為 blocking finding。
- 將非 blocking 改善混入 blocking findings。

## Finding 規則

只有明確需求落差、bug、regression、資料流破壞、contract 不一致、主要流程失敗或高風險驗證
缺口，才可列為 blocking finding。mode restrictions 定義各自可接受的具體證據。

非 blocking 的改善必須放在 `Risks` 或 `Suggestions`。

## 命令

只允許不改變工作區、Git index 或 repository 狀態的唯讀命令。可讀取核准 Scope 內檔案、
搜尋 symbol／reference、檢視 Git 狀態、diff 與既有驗證輸出。

不得執行會改變工作區、index 或 repository 狀態的命令。
