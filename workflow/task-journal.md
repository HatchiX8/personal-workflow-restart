# 任務日誌規則

本規則為 Workflow 共用規則，用來保存已結束任務的客觀執行紀錄，供後續週回顧或查核使用；不是個人 Skill，也不需要使用者另外指定。

## 適用時機

- 專案模式的 Developer 與 Review 任務，在角色工作結束後、對話完成回覆前，必須建立一份日誌。
- 未指定角色的獨立個人 Skill，在 Skill 流程結束後、對話完成回覆前，必須建立一份日誌；持續對話型的個人化模式除外。
- 僅在任務狀態為 `completed`、`partial`、`blocked` 或 `cancelled` 時建立；即使沒有修改檔案或驗證未執行，仍應記錄已知結果。
- 一般助理模式、持續對話型的個人化模式與「規則路徑測試」一律不得建立任務日誌。

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
project: "example-web"
workstream: "api-contracts"
role: "developer"
skills:
  - "testing-workflow"
status: "completed"
---
```

- `completed_at` 必須是含 `+08:00` offset 的 ISO 8601 結束時刻，供後續依內容篩選；不得以檔案修改時間替代。
- `mode` 為 `project` 或 `skill`；獨立 Skill 的 `role` 為 `none`。沒有適用 Skill 時 `skills` 使用空陣列。
- 專案模式的 `project` 優先使用本次流程已載入且驗證有效的 `project.config.json` 中 `project.name` 原值。Config 不存在或已依降級規則執行時，只有使用者或本次流程已明確確認專案名稱才可使用；否則填 `unknown`。Workflow Root、日誌存放目錄與目前 shell 目錄都不能代替工作專案名稱。
- 獨立 Skill 未讀取或不適用工作專案時，`project` 填 `none`；不得只為建立日誌而讀取 `project.config.json`。
- `workstream` 是本次任務所屬的長期工作主線，使用 lowercase kebab-case，例如 `frontend-foundation`、`api-contracts` 或 `git-collaboration`。它描述工作目的，不是 framework、language、檔名或單次動作。依任務目標與範圍能可靠判斷時直接填寫；無法確認時填 `unknown`，不為此額外詢問使用者。獨立 Skill 不適用工作主線時填 `none`。
- 必須保存可取得的完整 thread ID。無法取得時填 `unavailable`，並在正文及完成回覆標示限制；不得編造 ID。

## 正文內容

以客觀、可追溯的事實填寫至少下列區塊；不適用或沒有資訊時明確寫「無」或「未提供」。

```markdown
# 任務日誌

## 任務結果

- 目標：
- 最終結果：
- 工作影響：

## 關鍵決策與理由

- 決定：
- 原因：
- 取代或限制：

## 工作範圍與產出

## 驗證

## 返工、阻礙與偏差

- 發生什麼：
- 已確認原因：
- 處理結果：
- 剩餘影響：

## 後續狀態

- 必要後續：
- 候選延伸：
- 是否影響本次完成：
```

- 「最終結果」先說明任務結束後形成的可觀察狀態；「工作影響」只描述已證實或可直接看出的影響，不用檔案清單代替結果，也不推測長期效益。
- 「關鍵決策與理由」只寫使用者明確決定或本次流程有直接證據支持的設計結論。「取代或限制」記錄被替換的既有做法、刻意不做的範圍或適用邊界；沒有時寫「無」。
- 「工作範圍與產出」記錄實際修改檔案、建立的產物或唯讀檢查範圍；細節應足以查核，但不逐字複製工具輸出。
- 「驗證」記錄已執行與未執行的驗證、結果及未執行原因。只有 Markdown 或其他非程式碼變更時，可以說明為何未執行 lint、build 或 test。
- 「返工、阻礙與偏差」包含本次任務內的重試與阻礙，也包含本次明確取代先前已完成實作或文件的情況。原因只有在來源明確支持時才記錄；否則填「未確認」。已解決事項仍記錄處理結果，沒有剩餘影響時填「無」。
- 「必要後續」只記錄完成原始目標、解除阻礙或處理已確認缺口所必須的工作；「候選延伸」記錄不影響本次完成、尚未承諾的可選方向。不得把刻意未擴大的範圍自動寫成必要後續。
- `status: completed` 時，「是否影響本次完成」通常應為「否」。若仍有會阻止原始目標完成的必要後續，狀態應使用 `partial` 或 `blocked`，不得同時宣稱完整完成。
- 沒有決策、返工、阻礙、必要後續或候選延伸時，對應欄位明確寫「無」。
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
