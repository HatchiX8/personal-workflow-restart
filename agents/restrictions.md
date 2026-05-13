# Restrictions Rules

## Data Flow Restrictions
- 禁止破壞既有資料流

## Validation Restrictions
- 禁止跳過 review 流程
- 禁止在 build 失敗狀態下宣告完成
- 禁止忽略 lint 錯誤
- 禁止忽略 typecheck 錯誤

## Architecture Restrictions
- 禁止建立重複商業邏輯
- 禁止跨層直接依賴
- 禁止未經任務明確要求變更既有 public API

## Scope Restrictions
- 禁止修改未指定模組
- 若完成任務必須修改關聯檔案，Agent 可修改最小必要範圍，但必須在輸出中說明原因。
- 禁止刪除既有功能

## Refactor Restrictions
- 禁止主動移動資料夾結構
- 禁止未授權大型重構
- 禁止主動重新命名既有檔案
