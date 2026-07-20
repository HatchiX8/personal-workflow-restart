# Developer Role Rules

Current Version: v1.03

本資料夾提供 Developer 角色的 AI Agent 開發規範基底。

使用方式：

- 入口規則使用 `AI-Workflow/bootstrap.md`
- 通用 workflow 使用 `AI-Workflow/workflow/common.md`
- Developer 角色入口使用 `AI-Workflow/roles/developer.md`
- Developer 細部規則放在 `AI-Workflow/roles/developer/`
- 保留 core、restrictions、workflow 作為 Developer 通用基底
- 依專案技術棧調整 frontend、backend、python-tool
- 將專案客製資料夾結構與模組責任放在 `AI-Workflow/roles/developer/skills/project-structure.md`
- 任務執行前，依任務類型讀取對應規則
- 若需要額外行為，需在 prompt 開頭指定任務模式
- 修改完成後，agent 自動依 review.md 進行自我檢查

本規則系統目標為：

- 提高 AI 開發可控性
- 降低技術債
- 維持架構一致性
- 提升多人協作穩定性

## Prompt 指定角色

目前 bootstrap 只支援 Developer。

建議在 prompt 開頭指定角色：

```txt
角色：Developer
```

可同時指定任務類型、任務模式與 skill：

```txt
角色：Developer
任務類型：前端任務
任務模式：學習模式
指定 skill：project-structure

本次任務：
修改 AssetCard component 樣式。
```

## 專案部署方式

若要在實際專案中使用本規則，建議採用以下結構：

```txt
your-project/
├─ AI-Workflow/
│  ├─ bootstrap.md
│  ├─ README.md
│  ├─ workflow/
│  │  └─ common.md
│  └─ roles/
│     ├─ developer.md
│     └─ developer/
│        ├─ core.md
│        ├─ restrictions.md
│        ├─ workflow.md
│        ├─ frontend.md
│        ├─ backend.md
│        ├─ python-tool.md
│        ├─ review.md
│        ├─ logging.md
│        └─ skills/
│           └─ project-structure.md
└─ ...
```

### 建立步驟

1. 將 `AI-Workflow/bootstrap.md` 作為入口規則。
2. 將 `AI-Workflow/workflow/common.md` 作為通用 workflow 規則。
3. 將 `AI-Workflow/roles/developer.md` 作為 Developer 角色入口。
4. 將 `AI-Workflow/roles/developer/` 作為 Developer 細部規則資料夾。
5. 之後在任務 prompt 開頭指定角色、任務類型、任務模式與需要的 skill。

`AI-Workflow/bootstrap.md` 作為 AI Workflow 入口；`AI-Workflow/workflow/common.md` 保存全角色通用 workflow；`AI-Workflow/roles/developer/` 資料夾保存 Developer 各任務類型的細部規則。

## 指定 Skill

Skill 用於保存專案客製或情境限定的額外規則，例如資料夾結構、模組責任、特殊檔案產生流程或團隊約定。

當任務 prompt 明確指定 skill 時，Agent 必須額外讀取：

```txt
AI-Workflow/roles/developer/skills/<skill-name>.md
```

Skill 不取代規則載入流程；它可補充或覆蓋通用任務類型規則，但不得違反 `AI-Workflow/roles/developer/restrictions.md`。

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

### architecture.md

定義 Architecture Task 的載入入口，說明何時需要讀取專案結構 skill。

### skills/project-structure.md

定義專案客製的資料夾結構、模組責任與依賴邊界。

當任務涉及新增、移動、刪除、拆分檔案、調整 import direction 或改變專案分層時，需額外讀取。

### review.md

定義任務完成後的 review 檢查項目。

### AI-Workflow/bootstrap.md

AI Workflow 的入口規則。

## 任務類型與任務模式

任務開始時，建議在 prompt 開頭明確指定：

```txt
角色：Developer
任務類型：前端任務
任務模式：學習模式
```

### 任務類型

任務類型決定 Agent 需要讀取哪些技術規則。

- 前端任務：讀取 frontend.md、review.md
- 後端任務：讀取 backend.md、review.md
- Python 工具任務：讀取 python-tool.md、review.md
- Review Task：讀取 core.md、restrictions.md、workflow.md、review.md
- Architecture Task：讀取 architecture.md、review.md；涉及專案結構判斷時，額外讀取 skills/project-structure.md

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
- Architecture Task 載入入口修改：architecture.md
- 專案資料夾結構與模組責任修改：skills/project-structure.md
- 前端規則修改：frontend.md
- 後端規則修改：backend.md
- Python 工具規則修改：python-tool.md
- Review 規則修改：review.md
