---
name: python
description: Developer 的 Python 語言規則。當 project.config.json 的作用中 stack 宣告 languages 包含 python，或本次修改的程式碼明確使用 Python 時使用。
---

# Developer Python Language Skill

## 程式規則

- 使用 type hints 描述公開 function 的輸入與輸出。
- 優先使用標準函式庫，避免不必要的第三方套件。
- 路徑處理優先使用 `pathlib`。
- CLI 參數解析優先使用 `argparse`，除非專案已有其他一致方案。
- 可執行腳本使用 `main()` 包裝，並透過 `if __name__ == "__main__":` 進入。
- 避免在 import 階段執行實際工作。
- 避免使用全域可變狀態保存任務結果。
- 錯誤處理需提供可理解的訊息，不直接吞掉例外。

## 型別規則

- 公開 function 必須標註參數型別與回傳型別。
- 跨模組傳遞的資料結構優先使用 `dataclass`、`TypedDict` 或專案既有模型。
- 固定選項值優先使用 `Enum` 或 `Literal`。
- 複雜 dict 結構不得只使用裸 `dict` 表達。
- 避免使用 `Any`；確實需要時說明原因。
- 使用具體容器型別，例如 `list[Path]`、`dict[str, int]`。
- function 回傳可能為空時，明確標註 `T | None` 或專案所使用的等價寫法。
- 不得用型別註解掩蓋實際可能回傳的資料型態。
- 解析 JSON、設定檔或其他外部資料後，先轉成明確資料結構再跨模組傳遞。

## 驗證

- 依專案設定執行 formatter、lint、typecheck 與相關測試。
- 沒有專案指令時，可對修改的獨立檔案執行 `python -m py_compile <file>`。
- 修改 CLI 時，執行不改變外部狀態的最小 smoke test。
- 無法執行驗證時，回報原因與建議手動執行的指令。
