# Python Tool Rules

本文件適用於使用 Python 開發工具程式、自動化腳本、批次處理程式與內部開發輔助工具。

## 適用情境

- CLI 工具
- 檔案整理、轉換、批次處理
- 資料匯入、匯出、清洗
- 開發流程自動化
- 本機維運或檢查腳本
- 一次性工具程式整理成可重複執行工具

## Design Rules

- 工具必須有明確輸入、處理、輸出邊界
- 預設行為必須保守，避免直接覆蓋或刪除資料
- 會修改檔案或外部狀態的工具，應優先支援 dry-run
- 批次處理應能清楚回報成功、失敗與略過項目
- 不將環境路徑、帳密、token、專案絕對路徑硬編碼在程式中
- 避免把一次性假設寫死成隱藏規則

## Python Code Rules

- 使用 type hints 描述公開 function 的輸入與輸出
- 優先使用標準函式庫，避免不必要的第三方套件
- 路徑處理優先使用 `pathlib`
- CLI 參數解析優先使用 `argparse`
- 程式進入點使用 `main()` 包裝
- 腳本必須使用 `if __name__ == "__main__":`
- 避免在 import 階段執行實際工作
- 避免使用全域可變狀態保存任務結果
- 錯誤處理需提供可理解的訊息，不直接吞掉例外

## File Operation Rules

- 寫入、覆蓋、刪除、搬移檔案前，必須確認目標路徑來自明確輸入或安全推導
- 批次修改檔案時，應先列出將被影響的檔案
- 有破壞性操作時，需提供確認機制或 dry-run
- 輸出檔案應避免覆蓋原始資料，除非任務明確要求
- 處理文字檔時，需明確考慮 encoding

## CLI Output Rules

- 成功時輸出簡潔摘要
- 失敗時輸出失敗原因與可採取的下一步
- 批次任務需輸出統計資訊，例如 processed、created、updated、skipped、failed
- 不輸出敏感資訊，例如 token、password、secret、完整憑證內容

## Project Structure Rules

簡單工具可使用單一檔案。

當工具開始包含多個責任時，應拆分為：

- CLI entry：處理參數與輸出
- Core logic：處理主要邏輯
- IO layer：處理檔案、網路或外部系統

## Validation Rules

依修改範圍執行對應驗證：

- 語法檢查：`python -m py_compile <file>`
- 單元測試：若專案有測試架構，執行相關測試
- CLI smoke test：對主要指令執行一次最小案例
- dry-run test：若工具會修改檔案，優先驗證 dry-run 行為

若無法執行驗證，必須在輸出中說明原因與建議手動執行的指令。

## Python Tool Review Checklist

- 是否有清楚的輸入、處理、輸出邊界
- 是否避免硬編碼環境資訊或敏感資訊
- 是否避免 import 階段執行實際工作
- 是否使用 `main()` 與 `if __name__ == "__main__":`
- 是否對破壞性操作提供 dry-run 或確認機制
- 是否清楚處理錯誤與輸出摘要
- 是否已執行語法檢查、測試或 CLI smoke test
