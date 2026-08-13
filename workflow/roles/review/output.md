# Review Output

## 共通原則

報告必須：

- findings 優先。
- 明確標示 Review mode：`change` 或 `feature`。
- 明確標示 PASS 或 FAIL。
- 區分 blocking findings、risks、suggestions。
- 每個 finding 提供 Evidence、Impact 與 Required Fix。
- 不輸出冗長摘要。

若使用者要求落檔，使用 UTF-8、中文內容與指定輸出位置；未指定檔名時採用可辨識的 timestamp 與短 slug。

## 共通區塊

```text
## Mode
## Result
## Blocking Findings
## Risks
## Suggestions
## Validation
## Report File
```

若沒有 blocking findings，寫：

```text
No blocking findings.
```

若沒有 risks 或 suggestions，可以省略該區塊。

## Severity

- blocker
- high
- medium
- low

只有 blocker 或 high 可作為 FAIL 的主要依據。

## 對話完成回覆

對話完成回覆必須遵守：

- 永遠包含 PASS／FAIL 與 blocking findings。
- 沒有 blocking finding 時可以使用 `No blocking findings.`，但不得另外產生空的 Risks 或
  Suggestions 區塊。
- 有建立 report 時提供實際路徑；未建立時不輸出空的 Report File 區塊。
