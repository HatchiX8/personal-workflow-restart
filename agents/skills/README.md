# Skills Rules

skills 是任務類型之外的能力擴充規則。

## 載入原則

- skill 不會取代 core / restrictions / workflow
- skill 僅補充特定能力的操作規則
- 任務需要時才載入對應 skill
- 可同時載入多個 skill
- skill 不得違反 restrictions.md

## 優先級

規則衝突時：

1. agents/restrictions.md
2. agents/core.md
3. agents/workflow.md
4. 任務類型規則
5. agents/skills/*.md
6. agents/review.md

## Skill 檔案應包含

- 適用情境
- 使用限制
- 操作流程
- 驗證方式
- 完成輸出要求