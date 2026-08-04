# Review Output

## 共通原則

報告必須：

- findings 優先。
- 明確標示 PASS 或 FAIL。
- 區分 blocking findings、risks、suggestions。
- 每個 finding 提供 Evidence、Impact 與 Required Fix。
- 不輸出冗長摘要。

檔案編碼、中文內容、指定輸出位置、timestamp 與 slug 遵守
`policies/report-file-policy.md`。

## 共通區塊

```text
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

Change／Feature mode report 規則負責定義 mode 專屬區塊、預設資料夾、slug 來源與 fallback。

## 對話完成回覆

Review report 是正式產物，不得因 `policies/result-reporting.md` 的 Level 1～3 而刪減本文件或
mode report 要求的內容。對話完成回覆才套用 Result Reporting 層級，並遵守：

- PASS／FAIL 與 blocking findings 永遠屬於角色必要語意，合併到「完成內容」或「任務摘要」。
- 有 blocker 或 high finding 時必須升級為 Level 3。
- 沒有 blocking finding 時可以使用 `No blocking findings.`，但不得另外產生空的 Risks 或
  Suggestions 區塊。
- 完成回覆必須提供 report 實際路徑；路徑可合併到完成內容，不需要另建空泛段落。
