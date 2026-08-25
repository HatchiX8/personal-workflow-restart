# Agent Workspaces

本目錄集中保存 Workflow 產生的本機分析報告、任務日誌與週回顧，避免將這些 Agent 產物寫入被分析的工作專案。

預設結構：

```text
analysis/
  <project-slug>/
    project/
      PROJECT_ANALYSIS.md
    modules/
      frontend/
      backend/
      fullstack/
      unknown/
task-journals/
  <YYYY>/<MM>/
    <timestamp>-<thread-id-short>-<slug>.md
weekly-reviews/
  <YYYY>/
    <start-date>_to_<end-date>.md
```

- Project Analysis 使用固定檔名，重新分析同一專案時可更新既有文件。
- Module Context 使用 timestamp 與 module slug 建立新報告；只有使用者明確指定時才更新既有文件。
- 每份報告都必須記錄 Project Name、Project Root、Project Config Path 與分析時間，避免同名專案混淆。
- `task-journals/` 由 `workflow/task-journal.md` 管理。每個已結束的 Developer、Review 或獨立個人 Skill 任務各有一份客觀日誌；日誌的 `completed_at` 是週回顧篩選依據，不使用檔案修改時間。
- `weekly-reviews/` 由明確指定的 `weekly-team-review` Skill 管理。報告只根據可取得的對話與任務日誌建立，並會記錄資料涵蓋限制。
- 每次任務日誌流程結束時，會依 `workflow/task-journal.md` 刪除 `task-journals/` 的 `completed_at` 或 `weekly-reviews/` 的 `report_end` 已達 30 天的紀錄。`analysis/` 與 `acceptance/` 不在清理範圍。
- 動態產物預設由 Git 忽略，只保留本說明與 `.gitkeep`。
