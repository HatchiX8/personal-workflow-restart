# Testing Workflow

這是一套軟體功能的驗收流程，用來讓 Agent 根據需求與變更風險，選擇必要測試、執行驗證並整理證據。

本文件提供使用者閱讀，不屬於 Agent 執行規則。Agent 載入此 Skill 時只需要讀取 `SKILL.md`。

## 用在哪

### 開發完成後驗收

搭配 Developer 使用。Agent 完成實作後，依修改內容決定要執行哪些 Unit Test、Integration Test、Type Check、Lint、Build 或瀏覽器驗證。

### Review 測試完整性

搭配 Review 使用。Agent 檢查目前變更是否有足夠測試、測試是否真的覆蓋需求，以及是否存在未驗證風險，但不修改程式碼。

### 單獨規劃測試

不指定角色時，可以用來整理某個功能需要驗證的案例。這種方式不會修改工作專案。

### 瀏覽器功能驗收

未來接入瀏覽器 MCP 後，可用於實際操作頁面、確認狀態變化、檢查錯誤並保留截圖或其他證據。

## 怎麼用

開發並驗收 Bug 修正：

```text
角色：developer
個人 Skills：testing-workflow
任務：修正訂單數量可能變成負數的問題，並驗證修正結果。
```

檢查目前變更的測試是否充分：

```text
角色：review
模式：change
個人 Skills：testing-workflow
任務：檢查目前變更是否充分測試。
```

只規劃測試案例：

```text
個人 Skills：testing-workflow
任務：規劃登入功能需要驗證的測試案例。
```

接入瀏覽器工具後驗收頁面流程：

```text
角色：review
模式：feature
個人 Skills：testing-workflow
任務：使用瀏覽器驗證會員登入、錯誤密碼提示與登出流程。
```

## 執行效果

載入 Skill 後，Agent 會：

1. 確認需求與主要風險。
2. 選擇最小必要的測試層級。
3. 從 Project Config 或 repository evidence 取得可用指令。
4. 依由快到慢的順序執行相關驗證。
5. 有瀏覽器工具時，執行必要的 UI 操作與功能驗收。
6. 區分本次失敗、既有失敗、環境問題與未確認事項。
7. 統一回報測試範圍、結果、證據與未驗證內容。

Skill 不代表所有測試都會執行，也不保證功能一定正確。它要求 Agent 選擇與本次風險相符的驗證，並誠實標記未執行或無法確認的部分。

## 可以改善什麼

- 減少每次由 Agent 臨時決定測試範圍與完成標準造成的差異。
- 避免只執行 Build、Lint 或 Type Check 就宣告功能驗收完成。
- 讓 Bug 修正具有可重現且能防止回歸的測試案例。
- 讓 Developer 與 Review 使用一致的失敗分類與結果格式。
- 讓未驗證事項明確呈現，不被「測試通過」的簡短結論掩蓋。
- 接入瀏覽器 MCP 後，讓 UI 驗收具有固定操作順序與可檢查證據。

## 目前限制

- 尚未綁定特定瀏覽器 MCP，因此目前只定義通用瀏覽器驗收流程。
- 實際測試指令仍由各專案的 Project Config 或 repository evidence 決定。
- 測試需要正式環境操作、付款、刪除資料或其他不可逆行為時，不會自行執行。
