# Skills Rules

skills 是任務類型之外的能力擴充規則。

## 載入原則

- skill 不取代規則載入流程
- skill 可補充或覆蓋通用任務類型規則
- 任務需要時才載入對應 skill
- 可同時載入多個 skill
- skill 不得違反 AI-Workflow/roles/developer/restrictions.md

## 優先級

規則衝突時：

1. AI-Workflow/roles/developer/restrictions.md
2. 明確指定或任務觸發載入的 AI-Workflow/roles/developer/skills/*.md
3. AI-Workflow/roles/developer/architecture.md
4. AI-Workflow/roles/developer/core.md
5. AI-Workflow/roles/developer/workflow.md
6. 任務類型規則
7. AI-Workflow/roles/developer/review.md

## Skill 檔案應包含

- 適用情境
- 使用限制
- 操作流程
- 驗證方式
- 完成輸出要求
