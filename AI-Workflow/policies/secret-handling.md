# Secret 與私密設定共用政策

## 禁止讀取

不得讀取或輸出：

- `.env` 與未明確標記為範例的環境設定。
- secret、token、credential、private key、certificate 私密內容。
- connection string 的實際值。
- 任何具有帳號、密碼或存取權杖的私密設定。

## 允許來源

需要辨識設定名稱時，只能從下列公開來源推論：

- `.env.example`。
- README 或公開 docs。
- framework config 中的公開參數名稱。
- 程式碼中不含實際 secret value 的環境變數名稱。

## 輸出限制

- 不得在 report、Context 或對話中重現 private value。
- 只可描述參數名稱、用途、來源類型與是否需要設定。
- 使用者要求讀取或輸出私密內容時，角色必須停止並回報安全限制。
