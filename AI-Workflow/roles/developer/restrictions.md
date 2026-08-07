# Developer 限制規則

## Action 授權限制

- `action=analyze` 為唯讀授權，禁止寫入、刪除、移動或格式化檔案，禁止安裝依賴、執行 migration、
  改變 Git 狀態或呼叫外部寫入操作。
- `action=analyze` 不得產生 Module Context、Project Analysis 或其他 md 報告。
- 只有新的 `action=develop` Execution Contract 才能開始修改；對話中預期未來可能修改不等於已授權。

## 資料流限制
- 禁止破壞既有資料流

## 驗證限制
- 禁止跳過 review 流程
- 禁止在 build 失敗狀態下宣告完成
- 禁止忽略 lint 錯誤
- 禁止忽略 typecheck 錯誤

## 架構限制
- 禁止建立重複商業邏輯
- 禁止跨層直接依賴
- 禁止未經任務明確要求變更既有 public API

## Scope 限制
- 禁止修改未指定模組
- 若完成任務必須修改關聯檔案，Agent 可修改最小必要範圍，但必須在輸出中說明原因。
- 禁止刪除既有功能

## 重構限制
- 禁止主動移動資料夾結構
- 禁止未授權大型重構
- 禁止主動重新命名既有檔案
