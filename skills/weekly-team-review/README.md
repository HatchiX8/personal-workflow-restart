# Weekly Team Review

此個人 Skill 將可取得的 Codex 對話與 `agent-workspaces/task-journals/` 中的任務日誌整理成一份約 5 分鐘可讀的每週工作回顧。正文聚焦本週主線、重要決策、返工與下週優先事項；完整來源與追溯資訊放在附錄。

使用時在任務中明確指定：

```text
個人 Skills：weekly-team-review
任務：建立本週團隊回顧。
```

預設範圍是 Asia/Taipei 執行時刻往前 7 天，也可直接指定起訖日期或時間。輸出寫入 `agent-workspaces/weekly-reviews/<YYYY>/`，不會修改專案程式碼、`project.config.json`、Workflow 或其他 Skill。

資料來源受工具可存取範圍、對話截斷與時間資料完整性限制；報告會在附錄如實記錄限制，不會補造遺漏資訊。只有足以改變主要結論的限制，才會出現在正文。

任務日誌流程每次結束時，會清除保存期限達 30 天的任務日誌與週報；不影響 `analysis/` 或 `acceptance/`。
