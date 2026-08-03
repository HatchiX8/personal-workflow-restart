# Developer Node.js Runtime Skill

本 Skill 適用於 Node.js 後端任務，只定義 Node.js runtime 與套件生態相關規則。API、分層、
DTO、資料庫與一般重構規則由其他已選 Skill 提供。

## Runtime 相容性

- 修改前先確認專案宣告或實際使用的 Node.js 版本。
- 必須延續既有 CommonJS／ES Modules 模式，不得在單一任務中任意切換。
- 必須延續既有 package manager 與 lock file。
- 不得為單一需求升級 Node.js、package manager 或主要 dependency，除非任務明確要求。

## 非同步與程序行為

- Promise、async／await、callback 與 event flow 必須維持既有錯誤傳遞方式。
- 不得遺漏必要的 await，或讓非同步失敗變成未處理 rejection。
- Middleware、timer、listener、stream 與 background task 必須確認生命週期及清理責任。
- 不得因重構改變 request middleware 順序或既有程序啟停行為。

## 套件與模組

- 新增 dependency 前必須確認既有套件無法完成需求，且已獲任務授權。
- Import／require path、package export 與 module boundary 必須維持相容。
- 不得手動修改 lock file；只有核准的 package manager 操作可以更新。

## 驗證

- 只使用專案實際存在的 scripts。
- 依修改範圍執行 lint、typecheck、test 與 build。
- 若缺少 script 或 runtime 環境，回報未執行項目與原因。
