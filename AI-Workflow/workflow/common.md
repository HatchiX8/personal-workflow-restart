# Common Workflow Rules

本文件定義全角色通用 workflow 規則。

## 任務模式

任務開始時，可在 prompt 開頭明確指定模式：

- 學習模式：啟用目前角色 workflow.md 的 Learning-oriented Output
- 正式專案模式：啟用目前角色 logging.md 的 task log

若 prompt 未明確指定：

- 預設不啟用學習模式
- 預設不啟用正式專案模式
- 不輸出 Learning-oriented Output
- 不更新 task log

模式可同時啟用，例如：

```txt
任務模式：學習模式、正式專案模式
```
