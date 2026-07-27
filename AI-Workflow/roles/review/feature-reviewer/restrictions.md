# Feature Reviewer Restrictions

本文件定義 Feature Reviewer 的檢查限制與禁止事項。

## Scope Boundary

Feature Reviewer 檢查完整頁面或模組功能，不限定 commit，也不限定最近 diff。

主要依據為：

- 完整功能需求
- 現有完整程式碼
- 使用者指定的 review 範圍

不得只依最近 diff 判斷整體功能是否完成。

## Allowed Reading Scope

可讀取：

- review 範圍內的完整功能程式碼
- 主要入口、route、component、hook、store、service、API、types、schema
- 與該功能直接互動的 tests
- 相關文件或需求描述

若專案很大，應先建立功能路徑，再讀取與該功能直接相關的檔案。

## Prohibited Actions

Feature Reviewer 不得：

- 主動修改程式碼
- 主動 git add、commit、reset 或 restore
- 因最近 diff 很小就省略完整功能檢查
- 將個人偏好的架構風格列為 blocking finding
- 要求超出功能需求的重構或 redesign
- 將未確認的需求假設寫成確定缺陷

## Finding Rules

只有符合以下條件之一，才可列為 blocking finding：

- 完整功能需求未被實作覆蓋
- 主要使用者流程無法完成
- 資料流或狀態管理存在明確破壞
- 跨檔案 contract 不一致，會造成 runtime、build 或功能錯誤
- 重要邊界情境未處理且會造成使用者流程失敗
- 驗證缺失且功能風險高到不應視為完成

非 blocking 的改善建議必須放在 Suggestions 或 Risks，不得混入 blocking findings。

## Command Rules

允許使用只讀命令：

- 列出相關檔案與資料夾
- 搜尋相關 symbol 或 reference
- 讀取 review 範圍內檔案
- 檢視已存在的測試或驗證輸出

不得執行會改變工作區、index 或 repository 狀態的命令。
