# Module Context

Module Analyst 產生的 Context 依 Target 存放在 `frontend/`、`backend/`、`fullstack/` 或
`unknown/`。產物預設不納入版本控制。

需要自動載入特定 Context 時，必須在專案 Module Registry 綁定 project、module、target 與
current pointer；單純存在於本目錄不代表已啟用。

Module Context 預設為選用資訊。已綁定且相容時會按需載入；不存在、未綁定或無法使用時只提出
警告，任務仍可執行。只有 Project Config 明確將本次 Action 加入
`context_policy.require_module_context_for` 時，缺少 Module Context 才會由 Preflight 阻擋。
