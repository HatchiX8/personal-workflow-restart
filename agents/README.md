# Agent Rules Template Version
Current Version: v1.0

本資料夾提供公司內部 AI Agent 開發規範基底。

使用方式：
- 每個專案複製此資料夾
- 保留 core、restrictions、workflow 作為通用基底
- 依專案技術棧調整 frontend、backend、architecture
- 任務執行前，依任務類型讀取對應規則
- 修改完成後，agent自動依 review.md 進行自我檢查

本規則系統目標為：
- 提高 AI 開發可控性
- 降低技術債
- 維持架構一致性
- 提升多人協作穩定性


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

### review.md
定義任務完成後的 review 檢查項目。

### runtime.md
AI 任務執行時的規則載入入口。


## 規則修改原則

- 核心理念修改：core.md
- 禁止事項修改：restrictions.md
- 任務流程修改：workflow.md
- 前端規則修改：frontend.md
- 後端規則修改：backend.md
- Review 規則修改：review.md


## 使用範例

1. 請閱讀 /agents/runtime.md
2. 描述任務
3. 描述限制條件
4. 描述完成條件

### Frontend Task

請閱讀 /agents/runtime.md

本次任務：
修改 AssetCard component 樣式。

需求：
- 調整卡片 hover 樣式
- 維持既有資料流
- 不修改 store 結構
- 不影響其他 component

完成後：
- 確認 TypeScript 無錯誤

### Backend Task

請閱讀 /agents/runtime.md

本次任務：
新增 positions API。

需求：
- 使用既有 service 架構
- 不直接操作 controller business logic
- 維持既有 response format

完成後：
- 確認 build 成功