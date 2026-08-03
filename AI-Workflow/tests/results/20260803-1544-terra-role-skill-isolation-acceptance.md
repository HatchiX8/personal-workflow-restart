# Role 與 Skill 隔離最終驗收

## 修正範圍

- Rule Resolution 只允許 `skill.role_id` 等於目前 Role 的 Skill 進入 selector 候選集合。
- 明確指定跨角色 Skill 時輸出 `skill-role-incompatible:<skill-id>`。
- Skill dependency 指向其他角色 Skill 時阻擋。
- Preflight 回查 Skill Registry，阻擋 `skill-role-mismatch:<skill-id>`。
- 空的 optional Project Context 不阻擋一般 Develop／Review。
- Module Analysis 面對 unbound／missing／non-current Module Context 時只產生 diagnostic。

## 驗收方式

- 模型：`gpt-5.6-terra`
- 推理強度：`medium`
- 執行範圍：Bootstrap、Dispatcher、Task Analysis、Role Planner、Rule Resolution、Preflight、Executor Adapter 准入
- 未執行角色實際任務，未由驗收代理修改檔案。

## 情境一：Developer Full Stack Refactor

本次任務：重構 Vue 3 + TypeScript 前端訂單列表與 Node.js + TypeScript 後端訂單 API 的付款狀態更新流程。

- 推導角色：`developer`
- 推導 Skill：`developer.backend.base`、`developer.frontend.base`、`developer.frontend.vue`、`developer.language.typescript`、`developer.runtime.node-js`、`developer.refactor.general`
- 跨角色 Skill：無
- Context：空的 optional Project Context，不阻擋
- Preflight：`PASS`，`can_execute=true`
- Executor Adapter：准入
- 結果：PASS

## 情境二：Feature Review Full Stack

本次任務：完整 Review Vue 3 前端訂單頁面與 Node.js 後端訂單 API。

- 推導角色：`review`
- Review Mode：`feature`
- 推導 Skill：`review.check.frontend`、`review.check.backend`
- 跨角色 Skill：無
- Context：Project Config 未要求 Project Context，不阻擋
- Preflight：`PASS`，`can_execute=true`
- Executor Adapter：准入
- 結果：PASS

## 情境三：Module Analyst Full Stack

本次任務：分析 Lunch 模組前端訂單頁面與後端 API。

- 推導角色：`module-analyst`
- Module：`lunch`
- 推導 Skill：`module-analyst.frontend`、`module-analyst.backend`
- 跨角色 Skill：無
- Context：既有 Lunch Context 未綁定且不是 current，因此不載入；Module Analysis 不因此阻擋
- Preflight：可執行
- Executor Adapter：准入
- 結果：PASS

## 負向回歸

Review 任務明確指定 `developer.language.typescript` 時，Rule Resolution 必須輸出
`skill-role-incompatible:developer.language.typescript`，Preflight 必須 `BLOCKED`。

## 結論

三個正向情境都能從唯一 Bootstrap 入口完成角色推導、角色內 Skill 選取、Preflight 與角色入口准入；跨角色 Skill 不再進入 Rule Set。
