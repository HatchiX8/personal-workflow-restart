# 角色規則重整基線

## 目的

本文件定義角色規則重整期間必須保持的行為邊界。此次重整只調整目錄、責任分類、重複規則引用
與 Skill 封裝，不改善、不刪減，也不改變既有專業判斷。

## 必須保持不變

- 四個角色維持各自獨立的 Workflow。
- Developer 的開發、驗證、自我檢查與輸出順序保持不變。
- Review 的 Change／Feature 範圍、檢查依據、finding 分類與 PASS／FAIL 判定保持不變。
- Project Analyst 的專案辨識、專案地圖、團隊風格與輸出內容保持不變。
- Module Analyst 的模組邊界、資料流、Contract、風險與輸出內容保持不變。
- 所有禁止事項、停止條件、secret 保護、可信度標記與 Scope 限制保持不變。
- 所有既有 active Skill 的觸發條件、相依規則與執行限制保持不變。

## 允許調整

- 移動或重新命名規則檔案。
- 將完全相同的共通規則移至共用政策，並由角色規則明確引用。
- 將 Target、Framework、Task Technique 與 Project Policy 規則封裝成 Skill Package。
- 將既有 routing 描述轉成 Role Planner facts 或 Skill Manifest selectors。
- 將重複的報告格式、驗證說明與輸出位置規則整理成單一來源。
- 更新 Registry、Rule Bundle、Schema、路徑、hash、fingerprint 與回歸測試。
- 將英文標題與維護說明翻成中文，但不得改變規則語意。

## 禁止調整

- 不得新增既有規則未要求的工程最佳實踐。
- 不得放寬或加嚴既有限制。
- 不得改變既有 PASS／FAIL、停止或阻擋條件。
- 不得將 Role Planner 變成第二個 Dispatcher。
- 不得讓 Role Workflow 在 Execute 階段自行載入或替換 Skill。
- 不得讓 README 參與 routing 或執行。

## 驗收方式

- 每個來源檔都必須在 Migration Map 中具有唯一去向。
- 純搬移且未中文化的檔案必須保持內容 hash 相同；中文化檔案以章節與規則覆蓋檢查取代 hash 相等。
- 拆分檔案必須能追溯至原始章節，且不得遺漏任何非空白規則。
- 四角色 baseline routing 必須通過。
- 新增 Skill 後不得要求修改 Role Entry、Role Planner 或 Role Workflow。
