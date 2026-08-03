# Project Analyst 角色規則

Project Analyst 擁有獨立 Planner 與固定 Workflow：

```text
entry.md
planner.md
workflow.md
restrictions.md
identify-project.md
team-style.md
output.md
skills/
```

- `planner.md` 將 Task Manifest 轉為專案分析 Role Plan。
- `workflow.md` 固定專案辨識、結構盤點、團隊風格分析與報告流程。
- `restrictions.md` 保存 Project Analyst 特有邊界；通用安全、機密與證據信心規則位於 `policies/`。
- `identify-project.md` 與 `team-style.md` 是目前角色主流程的一部分。
- `output.md` 定義專案分析文件格式與交付要求。

未來若新增技術棧、專案類型或特定分析方法，應封裝於 `skills/`，並由 Role Plan selectors 選取；不應把團隊或專案特規加入主 Workflow。

本 README 僅供工程師理解目錄，不是 execution rule。
