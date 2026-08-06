# Role Plan 精簡輸出契約

本契約只定義正常 Runtime 路徑中 LLM 必須產生的 Role Plan JSON 形狀。先讀本檔，再讀 Runtime
`next.load_paths` 中緊接其後的角色 Planner；不得讀取完整 Schema，也不得使用字串 shorthand 取代物件。

## 完整結構

```json
{
  "schema_version": "1.0",
  "task_id": "與 Task Manifest 完全相同",
  "role_id": "與 Task Manifest 完全相同",
  "action": "與 Task Manifest 完全相同",
  "planner_entry": "Runtime 回傳的角色 Planner 相對路徑",
  "facts": [
    {
      "fact_id": "target",
      "values": ["frontend"],
      "source": "manifest",
      "confidence": 1,
      "evidence": ["Task Manifest.targets"]
    }
  ],
  "skill_selectors": ["target=frontend"],
  "result_reporting": {
    "minimum_level": 1,
    "reasons": ["task-risk-level:1"],
    "upward_escalation": true
  },
  "validation_profiles": [],
  "context_requirements": [],
  "unresolved": [],
  "status": "planned"
}
```

## Facts

`facts` 的每一筆都必須是物件，且必須同時包含：

- `fact_id`：小寫 kebab-case，例如 `task-type`、`scope-mode`。
- `values`：一個以上非空字串；即使只有一個值也必須使用陣列。
- `source`：只能是 `manifest`、`config`、`registry`、`repository-evidence` 或 `inference`。
- `confidence`：`0` 到 `1` 的數字。
- `evidence`：字串陣列；不得用單一字串取代。

下列格式一律非法：

```json
{"facts": ["target=frontend", "framework=react"]}
```

`target=frontend` 這種字串只允許出現在 `skill_selectors`。`skill_selectors` 每筆必須使用
`key=value`；不得把 fact 物件放入其中。

## 狀態

- `status=planned` 時，`unresolved` 必須是空陣列。
- `status=needs-resolution` 時，`unresolved` 必須至少有一個穩定原因。
- `result_reporting.minimum_level` 不得低於 Runtime 回傳的 Task Risk level。
- 不得改寫 Task Manifest、Task Risk、Execution Profile 或 Runtime 回傳的 Planner 路徑。
