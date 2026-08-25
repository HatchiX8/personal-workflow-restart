# Weekly Team Review

此個人 Skill 將可取得的 Codex 對話與 `agent-workspaces/task-journals/` 中的任務日誌整理成一份具體、可追溯的每週團隊回顧。

使用時在任務中明確指定：

```text
個人 Skills：weekly-team-review
任務：建立本週團隊回顧。
```

預設範圍是 Asia/Taipei 執行時刻往前 7 天，也可直接指定起訖日期或時間。輸出寫入 `agent-workspaces/weekly-reviews/<YYYY>/`，不會修改專案程式碼、`project.config.json`、Workflow 或其他 Skill。

資料來源受工具可存取範圍、對話截斷與時間資料完整性限制；報告會如實記錄限制，不會補造遺漏資訊。

任務日誌流程每次結束時，會清除保存期限達 30 天的任務日誌與週報；不影響 `analysis/` 或 `acceptance/`。
