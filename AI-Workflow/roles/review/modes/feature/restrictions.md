# Feature Review Restrictions

本 mode 同時遵守 `roles/review/restrictions.md`。

## Scope

檢查完整頁面或模組功能，不限定 commit 或最近 diff。主要依據為：

- 完整功能需求
- 現有完整程式碼
- 使用者指定的 Review Scope
- 與功能直接互動的 tests

專案很大時，先建立功能路徑，再讀取直接相關檔案。不得只依最近 diff 判斷完整功能。

## Blocking Finding

- 完整功能需求未被實作覆蓋。
- 主要使用者流程無法完成。
- 資料流或狀態管理存在明確破壞。
- 跨檔案 contract 不一致，會造成 runtime、build 或功能錯誤。
- 重要邊界情境未處理，會造成使用者流程失敗。
- 驗證缺失且功能風險高到不應視為完成。

不得將未確認的需求假設描述成確定缺陷。

## 唯讀命令

- 列出相關檔案與資料夾
- 搜尋相關 symbol 或 reference
- 讀取 Review Scope 內檔案
- 檢視既有測試或驗證輸出
