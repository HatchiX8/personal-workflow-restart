# Project Analysis Output

本階段負責產出專案分析 md 檔。

建立正式文件時不得省略本文件要求的必要區塊。完成後的對話回覆至少說明分析範圍與實際路徑。

## 目標

- 產出讓工程師快速上手專案的分析文件
- 文件應精簡、可掃讀、可行動
- 文件不應成為逐檔摘要或大型技術報告
- 文件應清楚區分事實、推論與待確認事項

## Output File

正式文件集中保存在 Workflow Root，不寫入被分析的工作專案。使用者指定檔名或子路徑時，仍須放在 Workflow Root 的 `agent-workspaces/analysis/` 之下；若指定位置位於工作專案內，先說明限制並要求改用中央位置。

若使用者未指定輸出位置，建議使用：

```txt
<Workflow Root>/agent-workspaces/analysis/<project-slug>/project/PROJECT_ANALYSIS.md
```

- `<project-slug>` 優先由 `project.config.json` 的 `project.name` 正規化為 lowercase kebab-case。
- Project Config 不存在或名稱無法使用時，以工作專案根目錄名稱產生 slug，並在文件中標記來源。
- 專案分析使用固定檔名，供後續再次分析時更新同一份專案 context。
- 更新前必須以文件內的 Project Root 確認是同一專案；識別不一致或無法確認時，不得直接覆蓋。

## Writing Principles

專案分析 md 檔應遵守：

- 以工程師上手為目的
- 優先提供閱讀順序與專案地圖
- 使用短段落、表格與清單提高可掃讀性
- 避免過長背景說明
- 避免逐檔摘要
- 避免未經確認的架構評價
- 不輸出 secret、credential、token、connection string 或 private config 的實際值
- 不把改善建議混入既有狀態描述

若需要提出改善觀察，必須放在獨立區塊，且只有在使用者明確要求時輸出。

## 建議文件結構

```txt
# Project Analysis

## 分析識別
## 分析範圍與可信度說明
## 專案概覽
## 技術棧
## Project Config 與 Repository Evidence
## 專案啟動與主要入口
## 資料夾地圖
## 核心模組與責任
## 團隊工程風格
## 新工程師上手路線
## 建議閱讀順序
## 風險、未知與待確認事項
```

## Section Requirements

### 分析識別

需列出：

- Project Name
- Project Root（正規化後的絕對路徑）
- Project Config Path；未載入時明確標記
- Analyzed At（含時區）
- Project Slug

這些欄位只用於識別報告來源，不代表分析狀態分層。

### 分析範圍與可信度說明

需說明：

- 本次分析範圍
- 未深入分析的範圍
- 使用的主要資訊來源
- 可信度標記方式

### 專案概覽

需摘要：

- 專案類型
- 專案目的或主要功能，若可由文件確認
- 是否為 monorepo 或 mixed project
- 主要 app / package / service 邊界

### 技術棧

建議用表格列出：

- 分類
- 技術或工具
- 判斷來源
- 可信度

### Project Config 與 Repository Evidence

- 逐一列出 Project Config 宣告的 stacks 與實際 repository evidence。
- 一致項目可簡要確認；缺漏、過時或衝突項目必須列出雙方來源。
- 不得自行修改 `project.config.json`，也不得以其中一方覆蓋另一方後假裝已確認。
- Project Config 不存在時明確標記，並只依 repository evidence 描述技術棧。

### 專案啟動與主要入口

需列出：

- 可能的啟動 script
- app / server / library / CLI 入口
- build / test / lint 指令，若可由設定檔確認
- 需要的環境變數名稱，若可安全確認

不得假設未確認的啟動方式。

### 資料夾地圖

建議用表格列出：

- 路徑
- 推定責任
- 判斷來源
- 可信度
- 備註

不得逐檔摘要。

### 核心模組與責任

只列出高階核心模組。

需避免深入描述業務流程細節。

### 團隊工程風格

需整理 `team-style.md` 階段的觀察結果：

- 穩定慣例
- 局部慣例
- 待人工確認
- 命名、分層、資料流、測試與文件風格

### 新工程師上手路線

需給出可執行的上手建議：

- 第一天先看什麼
- 修改 UI 時先看哪裡
- 修改 API 時先看哪裡
- 新增功能通常會碰到哪些層
- 哪些區域需要先理解上下文再修改

### 建議閱讀順序

建議列出 5 到 10 個最重要的檔案或資料夾。

每個項目需說明閱讀目的，不做長篇摘要。

### 風險、未知與待確認事項

需列出：

- 文件缺失
- 啟動方式不明
- 架構邊界不明
- 風格不一致
- 樣本不足
- 需要人工確認的外部服務或環境變數

## 上手路線

專案分析文件應包含新工程師上手路線，例如：

- 第一天優先閱讀哪些檔案
- 修改 UI 時優先查看哪些資料夾
- 修改 API 時優先查看哪些資料夾
- 新增功能通常會涉及哪些層
- 哪些區域需要先理解上下文再修改

## 可信度標記

所有重要結論標記為明確事實、結構推論或待人工確認。

## Source References

重要事實提供檔案或資料夾路徑。來源衝突時列出衝突證據，推論不得寫成確定事實。

## Content To Avoid

專案分析 md 檔不得包含：

- secret value
- connection string
- credential
- 大量程式碼片段
- 逐檔摘要
- code review finding
- 重構建議
- 架構改造方案
- 未確認的啟動或部署步驟
- 對團隊風格的主觀評價

## Final Review

輸出前必須確認：

- 文件是否能讓新工程師知道從哪裡開始
- 是否包含專案地圖、技術棧、入口、團隊風格與上手路線
- 是否包含可辨識來源專案的分析識別資訊
- 是否已比對 Project Config 與 repository evidence
- 是否避免逐檔摘要與深度業務分析
- 是否已標記可信度
- 是否已列出待人工確認事項
- 是否未輸出 secret 或 private config
- 是否未把改善建議混入既有狀態描述
