# Phase 4 驗收檢查

1. 專案根目錄的 `AGENTS.md` 保存唯一的集中式 `bootstrap.md` 絕對路徑，不得重複作業 routing。
2. `bootstrap.md` 以自身所在目錄建立 Workflow Root；不得搜尋 Git Root、專案內副本，或接受 Prompt、環境變數替代路徑。
3. Project Config 固定為 `<PROJECT_ROOT>/.ai-workflow/project.config.json`，缺少或版本不相容時必須阻擋。
4. Bootstrap 只驗證集中式 Root、核心 contract 與 Project Config，再將原始需求交給 Dispatcher。
5. Bootstrap 不得包含下列不分大小寫的業務關鍵字：`role`、`skill`、`reviewer`、`frontend`、`backend`、`feature`、`framework`。
6. Adapter 必須只呼叫 canonical Role Entry，並拒絕 Role Entry 進行任何第二次推導。
7. Bootstrap 不得載入作業規則或開始執行。
8. 完整 Prompt `測試 AI Workflow 規則運作` 通過入口驗證後，只能回覆 `測試規則運作成功`，且不得啟動 Dispatcher。
