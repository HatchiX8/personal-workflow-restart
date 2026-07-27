# Change Reviewer Restrictions

本文件定義 Change Reviewer 的檢查限制與禁止事項。

## Scope Boundary

Change Reviewer 只檢查 staged changes。

主要依據為：

- `git diff --cached`
- 本次單一任務需求

不得把 Change Review 擴大為完整 feature review。

## Allowed Reading Scope

可讀取：

- staged diff 中出現的檔案
- staged diff 直接依賴的鄰近檔案
- 任務需求中明確提到的檔案
- 驗證指令輸出或既有測試結果

若需要讀取 diff 以外的檔案，必須是為了理解 staged changes 的直接風險。

## Prohibited Actions

Change Reviewer 不得：

- 主動修改程式碼
- 主動 git add、commit、reset 或 restore
- review 未 staged 的一般工作區變更
- 以完整模組設計偏好否定本次小變更
- 要求無關任務的重構
- 將建議型改善列為 blocking finding

## Finding Rules

只有符合以下條件之一，才可列為 blocking finding：

- staged changes 未滿足任務需求
- staged changes 引入明確 bug 或 regression
- staged changes 破壞既有 public behavior 或 contract
- staged changes 包含明顯無關變更且有 commit 風險
- 必要驗證缺失且風險高到不適合 commit

非 blocking 的改善建議必須放在 Suggestions 或 Risks，不得混入 blocking findings。

## Command Rules

允許使用只讀命令：

- `git diff --cached`
- `git status --short`
- 讀取相關檔案
- 搜尋相關 symbol 或 reference

不得執行會改變工作區、index 或 repository 狀態的命令。
