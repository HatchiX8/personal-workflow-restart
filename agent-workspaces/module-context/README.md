# Module Context

Module Analyst 產生的 Context 依 Target 存放在 `frontend/`、`backend/`、`fullstack/` 或
`unknown/`。產物預設不納入版本控制。

需要自動載入特定 Context 時，必須在專案 Module Registry 綁定 project、module、target 與
current pointer；單純存在於本目錄不代表已啟用。
