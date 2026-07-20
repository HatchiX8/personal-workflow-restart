# Architecture Rules

本文件是 Architecture Task 的規則入口。

本文件不定義特定專案的資料夾名稱、模組責任、分層邊界或 import direction。

上述專案客製規則應放在 `AI-Workflow/roles/developer/skills/project-structure.md`。

## 結構變更判斷

涉及以下情境時，必須同時閱讀 `AI-Workflow/roles/developer/skills/project-structure.md`：

- 新增資料夾
- 新增模組
- 移動檔案
- 刪除檔案或資料夾
- 修改 import direction
- 調整專案分層
- 拆分 service、rules、parser、detectors、types 等檔案
- 新增跨模組共用工具

若 `AI-Workflow/roles/developer/skills/project-structure.md` 不存在：

- 停止 Architecture Task
- 回報缺少 `AI-Workflow/roles/developer/skills/project-structure.md`
