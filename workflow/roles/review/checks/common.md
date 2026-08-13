# Common Review Checks

本文件定義所有 Review 任務都必須套用的通用檢查條件。

Common checks 只檢查 bug、邏輯衝突、需求落差、資料流破壞、contract 破壞與驗證缺口。

不得針對風格偏好、命名喜好、排版偏好或非必要重構提出 blocking finding。

## Requirement Fit

需檢查：

- 實作是否覆蓋任務需求或完整功能需求
- 是否遺漏必要行為
- 是否新增需求未提到且可能影響既有行為的功能
- 是否改變使用者未要求的 public behavior

可列為 blocking finding：

- 必要需求未完成
- 實作行為與需求相反
- 未經要求改變既有 public behavior 且有 regression 風險

## Logic Conflict

需檢查：

- 條件判斷是否互相矛盾
- early return 是否跳過必要流程
- success、error、empty、loading 等狀態是否互相覆蓋
- fallback 邏輯是否造成錯誤資料被當成有效資料
- 同一狀態是否被多個來源以不一致方式更新

可列為 blocking finding：

- 主要流程因條件衝突無法完成
- 錯誤狀態會被誤判為成功
- 必要資料缺失時仍繼續執行並造成錯誤結果

## Data Flow

需檢查：

- 資料來源是否一致
- 資料更新後是否同步到實際使用端
- 快取、狀態、參數是否可能使用過期資料
- parent/child、caller/callee、producer/consumer 間 contract 是否一致
- async flow 是否可能產生 race condition 或 stale update

可列為 blocking finding：

- 寫入與讀取使用不同資料來源導致功能失效
- 更新成功但 UI、API response 或下游流程看不到結果
- 明確 race condition 會讓主要流程不穩定

## Error Handling

需檢查：

- 失敗情境是否有可預期處理
- 錯誤是否被吞掉並造成假成功
- retry、fallback 或 default value 是否掩蓋真正失敗
- 必要錯誤資訊是否能被呼叫端或使用者流程取得

可列為 blocking finding：

- 主要流程失敗時仍回報成功
- 錯誤被吞掉後造成資料不一致
- 缺少必要錯誤處理導致 runtime failure

## Contract Compatibility

需檢查：

- public API、function signature、props、event、response shape 是否被破壞
- caller 與 callee 對 required / optional 欄位的理解是否一致
- 型別或 schema 是否與 runtime 行為一致
- 既有使用端是否需要同步更新

可列為 blocking finding：

- contract 變更造成既有使用端錯誤
- required 欄位被移除或改名但使用端未更新
- response 或 event shape 與 consuming code 不一致

## Validation

需檢查：

- 是否有對應 lint、typecheck、build、test 或手動驗證
- 驗證是否覆蓋本次主要風險
- 測試是否仍對應目前行為
- 未驗證項目是否需要在 report 中標記

可列為 blocking finding：

- 高風險變更沒有任何驗證，且無法從程式碼判斷安全
- 既有測試明顯與新行為衝突
- build/type contract 很可能失敗且未被確認
