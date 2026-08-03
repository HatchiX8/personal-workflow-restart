# Agent Workflow 主機介接規則

集中式 Workflow Bootstrap 的唯一允許路徑為：

```text
C:\Users\MiLu\Desktop\個人用\agent\controlled-agent-workflow\AI-Workflow\bootstrap.md
```

處理此專案的任何需求前，必須以 UTF-8 讀取並遵守上述 `bootstrap.md`。

Workflow Root 是該 `bootstrap.md` 所在目錄。完成入口載入後，集中式 Workflow 內的所有後續
路徑都必須相對於 Workflow Root 解析；專案設定與專案內容路徑必須相對於 Project Root 解析。

若指定路徑不存在、不是檔案或無法讀取，必須只回覆：

```text
BLOCKED: workflow-bootstrap-unavailable
```

發生上述錯誤時不得分析需求、載入其他規則或開始執行，也不得搜尋其他 Workflow、接受 Prompt
或環境變數提供替代路徑，或使用模型預設行為繼續工作。
