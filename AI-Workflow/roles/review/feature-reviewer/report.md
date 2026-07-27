# Feature Reviewer Report Format

本文件定義 Feature Reviewer 的報告格式。

## Output Principles

報告必須：

- findings 優先
- 明確標示 PASS 或 FAIL
- 區分 blocking findings、risks、suggestions
- 每個 finding 需附上檔案路徑、需求來源或程式碼依據
- 明確說明 review 範圍
- 不把可選改善列為功能完成 blocker

## Output File

Feature Reviewer 預設必須產出 markdown report。

若使用者指定輸出位置，必須寫入指定位置。

若使用者未指定輸出位置，預設寫入：

```txt
AI-Workflow/reviews/feature/<YYYYMMDD-HHmm>-<feature-slug>.md
```

若使用者明確表示不用落檔、只要在對話中回報，才可不寫入 report 檔案。

檔名規則：

- timestamp 使用本地時間 `YYYYMMDD-HHmm`
- feature slug 由頁面、模組、功能名稱或 review 範圍產生
- slug 需短、可讀、使用小寫英文、數字與 hyphen
- 若無法安全產生 slug，使用 `feature-review`

若 `AI-Workflow/reviews/feature/` 不存在，可建立必要資料夾。

## Report Template

```txt
# Feature Review Report

## Result

Status: PASS | FAIL

Reason:
- <一到三點說明判定原因>

## Blocking Findings

- [severity] <問題摘要>
  Requirement: <對應需求或使用者流程>
  Evidence: <file path / code reference / behavior>
  Impact: <為何功能不能視為完成>
  Required Fix: <最小必要修正方向>

## Risks

- <非 blocking 但需要注意的功能風險>

## Suggestions

- <可選改善建議>

## Requirement Coverage

- Covered: <已確認覆蓋的需求>
- Missing: <缺少或未確認的需求>
- Unknown: <需求不明或需要人工確認的部分>

## Validation

- Checked: <已確認的驗證>
- Missing: <未執行或無法確認的驗證>

## Scope

- Feature/page/module reviewed: <範圍>
- Primary sources: <主要檔案或資料夾>
- Out of scope: <不在本次 review 的範圍>

## Report File

- Path: <report output path>
```

## Empty Sections

若沒有 blocking findings，寫：

```txt
No blocking findings.
```

若沒有 risks 或 suggestions，可省略該區塊。

## Severity

severity 可使用：

- blocker
- high
- medium
- low

只有 blocker 或 high 可作為 FAIL 的主要依據。
