# OpenAPI 主文件生成規則

本 reference 只在 `api-contract-finalize` 已完成決策稽核、且審核稿可標示為 `Approved` 時讀取。

## 文件形態

- 使用 OpenAPI `3.1.0` 與 YAML。
- 預設產生單一自包含主文件。
- `info.title` 取自審核單位或模組名稱；未定義文件版本時，`info.version` 使用 `1.0.0`，只代表規格文件版本。
- 審核稿沒有 Server 資訊時省略 `servers`，並保留核准的完整 Path；不得自行發明 host、環境或 base URL。
- Endpoint ID 可保留為 `x-endpoint-id`；`operationId` 使用穩定且唯一的程式識別名稱。

## Contract 映射

- Method 與 Path 必須逐字維持核准內容；若使用 `servers` 拆出 base path，組合後仍須完全相同。
- 依實際位置映射 Path、Query、Header、Cookie 與 Request Body。
- required、optional、nullable、enum、const、default、format、minimum、maximum、minLength、maxLength 與 pattern 不得遺漏或臆造。
- 必填且 nullable 在 OpenAPI 3.1 使用包含 `null` 的型別，並把欄位列入父物件 `required`。
- 互斥或條件式 Payload 使用 `oneOf`；有明確 discriminator 欄位時加入 `discriminator` 與 mapping。
- 可重用物件放入 `components.schemas`。只有 Contract 明確禁止未知欄位時才使用 `additionalProperties: false`。
- 所有成功與流程相關錯誤 status 都必須存在；共用錯誤 envelope 或 Response 使用 `$ref` 重用。
- Authentication 映射至 `components.securitySchemes` 與適用範圍的 `security`。不得把 Token、密碼或實際環境變數值寫入規格。
- 固定停用的功能必須同時反映在可回傳控制值、Request 說明與對應錯誤 Response；不能只在 description 宣告。
- 不把前端導頁、重試或狀態恢復語意藏在範例中；需要機器判斷的 redirect target、ID 或狀態欄位必須存在於 Schema。

## 一致性檢查

完成後逐項核對：

- 每個核准 Endpoint ID 都有且只有一個對應 operation。
- 所有 operationId 唯一。
- 每個 `$ref` 都能解析至主文件中的實際節點。
- Request 與 Response 的巢狀結構、欄位存在性及限制與 Markdown 相同。
- Markdown 的每個已核准錯誤狀態都存在，且 Response Schema 足以支援描述的前端行為。
- YAML 不包含任何仍待決策的 placeholder、`TODO` 或假定值。
