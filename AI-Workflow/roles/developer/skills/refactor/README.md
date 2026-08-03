# Developer Refactor Skills

本目錄包含 Developer Refactor Skill Packages：

- `general/`：通用 Refactor 範圍、限制與停止條件。

Role Planner 只產生 `task-type`、`target`、`runtime` 與 Scope facts；Rule Resolution 依各
`skill.json` selectors 分別選取 Refactor、Target、Language 與 Runtime Skill。任何
`rules.md` 都不得再做 Skill routing。

本 README 只供工程師閱讀，不參與 routing。
