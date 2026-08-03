# Change Review Restrictions

本 mode 同時遵守 `roles/review/restrictions.md`。

## Scope

只檢查：

- `git diff --cached`
- 本次單一任務需求
- staged diff 中的檔案及其直接依賴
- 任務明確提到的檔案
- 驗證指令輸出或既有測試結果

不得 Review 未 staged 的一般工作區變更，也不得擴大成完整 Feature Review。讀取 diff 以外檔案
時，必須是為了理解 staged changes 的直接風險。

## Blocking Finding

- staged changes 未滿足任務需求。
- staged changes 引入明確 bug 或 regression。
- staged changes 破壞既有 public behavior 或 contract。
- staged changes 包含明顯無關變更且有 commit 風險。
- 必要驗證缺失且風險高到不適合 commit。

不得以完整模組設計偏好否定本次小變更。

## 唯讀命令

- `git diff --cached`
- `git status --short`
- 讀取相關檔案
- 搜尋相關 symbol 或 reference
