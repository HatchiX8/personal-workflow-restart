# Agent Rules Template Version

Current Version: v1.02

本資料夾提供公司內部 AI Agent 開發規範基底。

使用方式：

- 每個專案複製 `AGENTS.md` 與 `agents/` 資料夾
- 保留 core、restrictions、workflow 作為通用基底
- 依專案技術棧調整 frontend、backend、python-tool
- 任務執行前，依任務類型讀取對應規則
- 若需要額外行為，需在 prompt 開頭指定任務模式
- 修改完成後，agent自動依 review.md 進行自我檢查

本規則系統目標為：

- 提高 AI 開發可控性
- 降低技術債
- 維持架構一致性
- 提升多人協作穩定性

## 專案部署方式

若要在實際專案中使用本規則，建議採用以下結構：

```txt
your-project/
├─ AGENTS.md
├─ agents/
│  ├─ core.md
│  ├─ restrictions.md
│  ├─ workflow.md
│  ├─ frontend.md
│  ├─ backend.md
│  ├─ python-tool.md
│  ├─ review.md
│  └─ logging.md
└─ ...
```

### 建立步驟

1. 將 `AGENTS.md` 複製到目標專案根目錄。
2. 將整個 `agents/` 資料夾複製到目標專案根目錄。
3. 確認 `AGENTS.md` 內容仍指向 `agents/*.md` 規則檔。
4. 之後在任務 prompt 開頭指定任務類型與任務模式。

`AGENTS.md` 作為 Codex 讀取規則的預設入口；`agents/` 資料夾保存各任務類型的細部規則。

### 專案中的任務 prompt 範例

```txt
任務類型：前端任務
任務模式：學習模式

本次任務：
修改 AssetCard component 樣式。
```

若未指定任務模式，預設不啟用 Learning-oriented Output，也不更新 task log。

## 規則結構

### core.md

定義核心開發原則與架構價值觀。

### restrictions.md

定義禁止事項與硬性限制。

### workflow.md

定義 AI 任務執行流程與完成後檢查流程。

### frontend.md

定義前端開發規範與前端架構規則。

### backend.md

定義後端開發規範與 API 架構規則。

### python-tool.md

定義 Python 工具程式、自動化腳本與批次處理程式開發規則。

### review.md

定義任務完成後的 review 檢查項目。

### AGENTS.md

Codex 任務執行時的規則載入入口，需放在專案根目錄。

## 任務類型與任務模式

任務開始時，建議在 prompt 開頭明確指定：

```txt
任務類型：前端任務
任務模式：學習模式
```

### 任務類型

任務類型決定 Agent 需要讀取哪些技術規則。

- 前端任務：讀取 frontend.md、review.md
- 後端任務：讀取 backend.md、review.md
- Python 工具任務：讀取 python-tool.md、review.md
- Review Task：讀取 core.md、restrictions.md、review.md

### 任務模式

任務模式決定是否啟用額外輸出或紀錄。

- 學習模式：任務結束後輸出 Learning-oriented Output
- 正式專案模式：任務結束後更新 task log

若未指定任務模式：

- 不啟用學習模式
- 不啟用正式專案模式
- 不輸出 Learning-oriented Output
- 不更新 task log

任務模式可同時啟用：

```txt
任務模式：學習模式、正式專案模式
```

## 規則修改原則

- 核心理念修改：core.md
- 禁止事項修改：restrictions.md
- 任務流程修改：workflow.md
- 前端規則修改：frontend.md
- 後端規則修改：backend.md
- Python 工具規則修改：python-tool.md
- Review 規則修改：review.md

## 使用範例

1. 指定任務類型
2. 視需求指定任務模式
3. 描述任務
4. 描述限制條件
5. 描述完成條件

### Frontend Task - Learning Mode

任務類型：前端任務
任務模式：學習模式

本次任務：
修改 AssetCard component 樣式。

需求：

- 調整卡片 hover 樣式
- 維持既有資料流
- 不修改 store 結構
- 不影響其他 component

完成後：

- 確認 TypeScript 無錯誤

### Backend Task - Production Project Mode

任務類型：後端任務
任務模式：正式專案模式

本次任務：
新增 positions API。

需求：

- 使用既有 service 架構
- 不直接操作 controller business logic
- 維持既有 response format

完成後：

- 確認 build 成功

### Python Tool Task - Learning Mode

任務類型：Python 工具任務
任務模式：學習模式

本次任務：
建立一個整理指定資料夾內 CSV 檔案的工具程式。

需求：

- 使用 argparse 接收輸入資料夾與輸出資料夾
- 預設使用 dry-run
- 不覆蓋原始檔案
- 輸出 processed、created、skipped、failed 統計

完成後：

- 執行 Python 語法檢查
- 執行 CLI smoke test
