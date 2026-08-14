---
name: project-analysis
description: 從陌生 repository 建立完整專案高階理解與工程師上手文件。當使用者明確指定「個人 Skills：project-analysis」來分析整個專案、技術棧、入口、專案地圖或團隊工程風格時使用。
---

# Project Analysis

以 repository evidence 建立全專案高階理解。這是唯讀分析流程；只有使用者明確要求建立或更新分析文件時，才可寫入 Workflow Root 的中央分析目錄。

## 執行流程

1. 確認工作專案根目錄、分析目的與優先關注面向。
2. 分析固定涵蓋完整專案的高階範圍；單一模組、功能或資料流需求改用 `module-analysis`。
3. 以高訊號來源辨識專案：依 `references/identify-project.md`。
4. 若工作專案存在 `project.config.json`，先讀取 Workflow Root 的 `workflow/project-config.md`，再依其規格解析設定；讀取全部已宣告的 stacks，逐一與 repository evidence 比對，不自動修改設定。不存在時，以 repository evidence 建立地圖並標記未載入 Config。
5. 建立主要 app、package、service、入口與資料夾的高階地圖。
6. 以代表性樣本分析團隊工程風格：依 `references/team-style.md`。
7. 只要求對話說明時直接回覆；要求文件時依 `references/output.md` 建立或更新中央報告。
8. 回覆時區分明確事實、結構推論與待人工確認事項，並列出未深入範圍。

## 邊界

- 使用只讀命令與最小必要的檔案抽樣；不得逐檔深讀整個 repository。
- 不讀取或輸出 secret、credential、token、connection string 或私密設定的實際值。
- 不修改產品程式碼、設定、依賴、Git 狀態或其他專案產物。
- 不執行 install、build、test、migration、格式化或啟動服務。
- 不將通用最佳實踐、單一檔案或個人偏好寫成既有團隊規則。
- 不輸出重構方案、架構改造、效能計畫或逐檔 code review，除非使用者另行要求且改用適當流程。

若必要入口或設定不足以安全辨識專案、需求實際需要修改程式碼，或要求全量逐檔分析大型專案，停止或降低分析深度並說明原因。

## 參考資料

- 專案辨識與高階地圖：`references/identify-project.md`
- 團隊風格抽樣：`references/team-style.md`
- 報告格式與落檔規則：`references/output.md`
