# Runtime 錯誤解釋契約

本契約只在 Runtime 已回傳 `status=blocked|invalid|error` 時載入。LLM 負責將不可變 diagnostics 與
精簡 `error_context` 翻譯成使用者可理解的原因和下一步；不得重新執行路由或解除 blocker。

## 分類

LLM 必須選擇一個主要分類：

- `user-input-required`：需求缺少唯一 Module、Target、Scope、Review mode 或其他必要事實。
- `project-config-required`：Project Config 缺少 Registry、alias、Context 或必要綁定。
- `workflow-contract-defect`：合法需求依已載入契約產生的資料，與 Runtime Schema／規則互相衝突。
- `policy-blocked`：風險、安全、權限、Preflight 或 Executor 政策明確拒絕。
- `runtime-environment-error`：Node、request file、Workflow 資源或宿主執行環境異常。
- `execution-evidence-missing`：Review 或 Analyze 缺少必要且可驗證的執行證據。
- `unknown`：現有資訊不足，不能安全歸類。

`PROFILE_BLOCKED` 若由先前的 Risk／Manifest blocker 連鎖產生，只能列為次要結果，不得當成根因。
分類是 LLM 解釋，不得寫回 Runtime 結果或視為新的 Workflow 事實。

## 回覆格式

```text
BLOCKED: <原 error_code 或穩定終止狀態>

判定：<分類>
原因：<先描述 Runtime 事實，再標示必要推論>
需要：<使用者可提供的資訊、應調整的專案設定，或應回報的 Workflow 缺陷>

diagnostics:
- [<code>] <path-or-/>: <reason>
```

沒有安全可行的使用者動作時省略 `需要`，不得提供繞過 blocker 的步驟。原始 diagnostics 必須逐筆
保留且順序不變。

## 安全邊界

- 不得把 `blocked`、`invalid` 或 `error` 改成 `ready`。
- 不得降低 Task Risk／Execution Profile、補造 Module／Target／Scope 或自動修改 Project Config。
- 不得自行改走 Markdown fallback；Runtime 技術上不可用時仍須遵守使用者確認契約。
- 不得載入完整 Registry、Schema、未命中規則或原始 request file；只使用 Runtime Result、
  `error_context`、已載入的精簡契約與對話中使用者已提供的事實。
- 推論必須明確標示；無法區分使用者資料與 Workflow 缺陷時使用 `unknown` 並說明缺少的證據。
