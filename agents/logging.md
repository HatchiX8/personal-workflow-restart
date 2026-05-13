# Logging Rules

本規則僅在 prompt 開頭明確指定「正式專案模式」時啟用。

未指定正式專案模式時，Agent 不需要更新 task log。

## Active Log

- 正式專案模式下，每次 task 結束後，Agent 必須更新 `logs/active-log.md`
- `active-log.md` 保留最近 20 筆 task
- 每筆 task 必須包含以下欄位：

```txt
Date
Task
Modified Files
Purpose
Validation
Known Issues
Next Step
```

## Archive Summary

- 當 `active-log.md` 超過 20 筆 task 時，Agent 必須整理較舊紀錄
- 舊紀錄濃縮後寫入 `logs/archive-summary.md`
- `archive-summary.md` 只保留摘要，不保留完整 task 細節
- 摘要應包含：

```txt
Completed
Important Decisions
Technical Debt
Repeated Issues
```
