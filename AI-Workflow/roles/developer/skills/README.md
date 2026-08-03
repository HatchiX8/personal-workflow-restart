# Developer Skills

Developer 的 Target、Language、Runtime、Framework、Task Technique、Validation 與 Output
特規都封裝為 Skill Package。專案結構、模組責任與專案技術限制由 Project Context 提供，不放在
集中式 Developer Skill。

每個 package 必須包含：

```text
skill.json
rules.md
README.md
tests/
```

`skill.json` 是唯一 routing metadata，`rules.md` 必須使用中文；README 只供工程師閱讀。

新增 Skill 不得修改 Developer Entry、Planner 或 Workflow。Skill 不得自行載入其他 Skill，
相依與衝突必須宣告在 Manifest。

主要分類：

- `frontend/`、`backend/`：Target 共通能力。
- `language/`：可跨前後端使用的語言規則。
- `runtime/`：Runtime 與套件生態規則。
- `frontend/vue`、`frontend/react`：Frontend Framework 規則。
- `refactor/`：任務技巧。
- `tooling/`：工具特規。
