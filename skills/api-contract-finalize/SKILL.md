---
name: api-contract-finalize
description: 收斂 API 設計審核稿中的人工決策，確認答案完整且可唯一轉成 Contract 後更新 Markdown 為 Approved，並產生單一 OpenAPI YAML。當使用者已回覆 DEC-*、待確認或待決策事項並要求完成 API 文件時使用；不負責從零設計 API 或實作前後端。
---

# API Contract Finalize

把人工審核後的決策安全地寫回 API 設計文件，並在同一輪產生前後端共用的 OpenAPI 主文件。這是 `api-doc-context` 的收斂階段；不得把缺少的產品決策當成技術細節自行補完。

## 輸入

需要下列資訊：

- 一份可唯一定位的 API 設計審核 Markdown。
- 使用者對其中所有阻塞決策與待確認事項的回答。
- 明確要求修改文件；若只要求檢查，維持唯讀。

未指定 OpenAPI 輸出路徑時，在審核稿同層使用相同主名稱並加上 `.openapi.yaml`。若名稱無法唯一推導、目標是用途不同的既有檔案或覆寫範圍不明，先要求確認。

## 寫檔前閘門

以 UTF-8 完整讀取審核稿，先做唯讀稽核；通過前不得修改 Markdown，也不得產生或更新 YAML。

1. 列出所有尚未解決的 `DEC-*`、`待確認`、`待決策`、`尚待確認`、`未定`、`需確認` 與其他會改變公開 Contract 的語句。已位於「決策紀錄」、內容具體且與全文一致的 `DEC-*` 視為已解決；不要重複要求回答。不要只依「待決策總覽」，端點段落與限制中的未決內容也必須納入。
2. 將使用者回答逐項對應到原問題，確認沒有漏答、錯置或以同一答案含糊涵蓋不同決策。
3. 確認每個答案都能唯一決定受影響的 Method、Path、Authentication、參數位置、欄位型別與存在性、驗證限制、成功 Response、錯誤 Response 或流程恢復行為。
4. 比對答案與文件內其他 Contract。若答案彼此衝突、與既有已確認內容衝突，或會造成 Schema 與敘述不一致，視為阻塞。
5. 區分產品決策與不影響 API 行為的文件細節。OpenAPI 必填的 `info.version` 若來源未定義，可使用 `1.0.0` 作為規格文件版本；不得因此推導 API 路徑版本、產品版本或相容性政策。

遇到任何阻塞時：

- 停在寫檔前，不做部分更新，也不先產生草稿 YAML。
- 只列出缺少或不精準的項目、它影響的 Contract，以及使用者需補充的最小問題。
- 等待使用者補充；不得提供假定答案替代決策。

## 收斂 Markdown

全部回答通過閘門後：

1. 把答案寫入實際受影響的共用 Contract、Schema、端點 Request／Response、限制與錯誤流程，不能只更新決策總覽。
2. 移除或改寫已解決的待確認語句，保留穩定的 `DEC-*` 作為「決策紀錄」。
3. 同步修正摘要、用途與端點表中因決策而失效的舊敘述。
4. 僅在所有阻塞事項皆已解決且全文一致時，將狀態改為 `Approved`。
5. 不加入使用者沒有決定的功能、端點、欄位、錯誤碼或內部實作方式。

更新後再次搜尋未決標記與矛盾敘述。若此時發現新缺口，停止 OpenAPI 生成並清楚回報；不要把不完整文件宣告為 Approved。

## 產生 OpenAPI

只有收斂後確實為 `Approved` 的 Markdown 才能進入本階段。產生前讀取 [references/openapi-generation.md](references/openapi-generation.md)，並以核准後 Markdown 作為唯一設計輸入。

預設只建立或更新一份 OpenAPI YAML 主文件，不建立 Swagger UI、generator 設定、程式碼、Mock、測試流程或拆分後的 schema 檔，除非使用者另外明確要求。

## 驗證與回報

- 解析 YAML，確認它是有效的 OpenAPI 3.1 文件。
- 確認所有本地 `$ref` 存在，Method、Path、status code 與核准後 Markdown 一致。
- 對照決策紀錄抽查每項決策已同時反映在敘述與 Schema。
- 若環境沒有 OpenAPI semantic validator，不為驗證而安裝依賴；執行 YAML 與 `$ref` 檢查並明確說明未做完整語意驗證。

完成回覆列出修改的 Markdown、產生的 YAML、驗證結果，以及任何未執行的驗證。若仍有未完成事項，不得聲稱 Contract 已完成。
