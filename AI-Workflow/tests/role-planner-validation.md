# 四角色 Role Planner 驗證

本驗證只執行到角色規劃完成，不進入角色內部 Workflow。

覆蓋案例：

- 明確指定 Developer。
- 明確指定 Review。
- 明確指定 Project Analyst。
- 明確指定 Module Analyst。
- 未提供角色控制欄位，由 Task Analysis 推導為 Developer。

每個案例都必須從 Role Registry 取得唯一 `planner.md`，產生 `status=planned` 的 Role Plan，
並包含符合 Task Manifest 的 Role、Action、模式與 Target selectors。
