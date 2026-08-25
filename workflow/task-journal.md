# 任務日誌規則

本規則為 Workflow 共用規則，用來保存已結束任務的客觀執行紀錄，供後續週回顧或查核使用；不是個人 Skill，也不需要使用者另外指定。

## 適用時機

- 專案模式的 Developer 與 Review 任務，在角色工作結束後、對話完成回覆前，必須建立一份日誌。
- 未指定角色的獨立個人 Skill，在 Skill 流程結束後、對話完成回覆前，必須建立一份日誌。
- 僅在任務狀態為 `completed`、`partial`、`blocked` 或 `cancelled` 時建立；即使沒有修改檔案或驗證未執行，仍應記錄已知結果。
- 一般助理模式與「規則路徑測試」一律不得建立任務日誌。

日誌是完成流程的一部分，但不改變角色或 Skill 的其他授權。若無法寫入，必須在對話完成回覆中明確說明原因與未建立的日誌，不得假稱已落檔。

## 寫入位置與檔名

以 Workflow Root 為基準，建立 UTF-8 Markdown 檔：

```text
agent-workspaces/task-journals/<YYYY>/<MM>/<YYYYMMDD-HHmmss+0800>-<thread-id-short>-<slug>.md
```

- 時間使用實際結束時刻的 Asia/Taipei（`+08:00`）時間；檔名的 timestamp 只使用安全字元。
- `thread-id-short` 是目前 Codex thread ID 的可辨識短碼；`slug` 以任務目標建立 lowercase ASCII、數字與連字號的簡短名稱。不得把 Prompt、對話內容或敏感資料放入檔名。
- 同名時保留既有檔案，於副檔名前加上遞增序號，例如 `-01`；不得覆寫過去日誌。

## 必填 metadata

每份日誌開頭使用 YAML frontmatter，至少包含下列欄位：

```yaml
---
completed_at: "2026-08-19T14:30:00+08:00"
thread_id: "實際 Codex thread ID"
mode: "project"
project: "已知專案名稱或 none"
role: "developer"
skills:
  - "testing-workflow"
status: "completed"
---
```

- `completed_at` 必須是含 `+08:00` offset 的 ISO 8601 結束時刻，供後續依內容篩選；不得以檔案修改時間替代。
- `mode` 為 `project` 或 `skill`；獨立 Skill 的 `role` 為 `none`。沒有適用 Skill 時 `skills` 使用空陣列。
- `project` 使用可由本次流程確認的專案名稱；獨立 Skill 未讀取或不適用專案時填 `none`，不得為了日誌而讀取 `project.config.json`。
- 必須保存可取得的完整 thread ID。無法取得時填 `unavailable`，並在正文及完成回覆標示限制；不得編造 ID。

## 正文內容

以客觀、可追溯的事實填寫至少下列區塊；不適用或沒有資訊時明確寫「無」或「未提供」。

```markdown
# 任務日誌

## 任務目標、範圍與完成條件

## 使用者決策與中途調整

## 完成內容與修改範圍

## 驗證

## 未完成項目

## 返工、阻礙與預期差異
```

- 記錄實際完成內容、修改檔案或唯讀範圍、已執行與未執行的驗證及其結果。
- 只寫已確認的使用者決策、實際調整、阻礙、返工與和原先完成條件的差異；沒有時明確標示無。
- 不評價任何人好壞，不推測動機，不逐字複製 Prompt、對話或工具輸出。
- 不寫入密碼、token、credential、個人資料、私密設定值或其他敏感資料。必要時以「敏感資訊未記錄」概述。

## 完成順序

1. 依角色或 Skill 自己的規則完成工作、驗證與結果判定。
2. 以本規則建立單一日誌，摘要本次實際工作。
3. 依「保存期限清理」刪除已過期的紀錄。
4. 在完成回覆提供日誌的實際路徑、清理的檔案數量，以及如實標記日誌寫入或清理限制。

同一次任務只建立一份任務日誌。不得依風險等級決定是否記錄，也不得為日誌重新推導風險。

## 保存期限清理

每次本規則被執行時，在建立本次日誌後檢查下列兩個 Workflow Root 位置：

```text
agent-workspaces/task-journals/
agent-workspaces/weekly-reviews/
```

- 使用實際執行時刻的 Asia/Taipei 時間建立 cutoff：`now - 30 days`。
- `task-journals/` 只以 YAML frontmatter 的 `completed_at` 判斷；`weekly-reviews/` 只以 YAML frontmatter 的 `report_end` 判斷。不得以檔名、建立時間或檔案修改時間替代。
- 時間可解析且早於或等於 cutoff 的檔案屬於過期紀錄，刪除該單一檔案；時間缺失、無法解析或超出上述兩個位置的檔案一律保留，並在完成回覆說明限制。
- 刪除後可移除這兩個位置之下已空的年月子目錄，但不得刪除 `agent-workspaces/`、`task-journals/`、`weekly-reviews/` 根目錄，也不得刪除 `analysis/`、`acceptance/` 或任何工作專案。
- 清理前先確認每個候選檔案的完整解析路徑仍位於上述兩個指定目錄內；不得以 glob、符號連結、未解析路徑或計算出的父目錄擴大刪除範圍。
- 清理沒有候選檔案時正常完成，不得回報為錯誤。每次完成回覆都只需回報刪除數量；有無法判定的檔案時，再提供其實際路徑與原因。
