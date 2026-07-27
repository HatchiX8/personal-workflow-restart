# Change Reviewer Report Format

本文件定義 Change Reviewer 的報告格式。

## Output Principles

報告必須：

- findings 優先
- 明確標示 PASS 或 FAIL
- 區分 blocking findings、risks、suggestions
- 每個 finding 需附上檔案路徑或 diff 依據
- 不輸出冗長摘要
- 不把非必要改善包裝成 commit blocker

## Output File

Change Reviewer 預設必須產出 markdown report。

若使用者指定輸出位置，必須寫入指定位置。

若使用者未指定輸出位置，預設寫入：

```txt
AI-Workflow/reviews/change/<YYYYMMDD-HHmm>-<task-slug>.md
```

若使用者明確表示不用落檔、只要在對話中回報，才可不寫入 report 檔案。

檔名規則：

- timestamp 使用本地時間 `YYYYMMDD-HHmm`
- task slug 由任務名稱或 staged changes 的主要目的產生
- slug 需短、可讀、使用小寫英文、數字與 hyphen
- 若無法安全產生 slug，使用 `change-review`

若 `AI-Workflow/reviews/change/` 不存在，可建立必要資料夾。

## Report Template

```txt
# Change Review Report

## Result

Status: PASS | FAIL

Reason:
- <一到三點說明判定原因>

## Blocking Findings

- [severity] <問題摘要>
  Evidence: <file path / staged diff reference>
  Impact: <為何 commit 前必須修>
  Required Fix: <最小必要修正方向>

## Risks

- <非 blocking 但需要注意的風險>

## Suggestions

- <可選改善建議>

## Validation

- Checked: <已確認的驗證>
- Missing: <未執行或無法確認的驗證>

## Scope Check

- Staged changes source: git diff --cached
- Task requirement checked: yes | no | partial
- Unrelated staged changes: none | found | unknown

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
