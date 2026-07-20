# Refactor Skill

## 適用情境

當任務明確涉及以下內容時，啟用本 Skill：

- 重構既有程式碼
- 改善命名
- 拆分過大的檔案、函式或模組
- 移除重複邏輯
- 調整資料流
- 調整模組分層
- 改善 import / export 結構
- 降低檔案複雜度
- 改善可讀性
- 改善可維護性
- 改善可擴充性

若任務是以下內容：

- 新增功能
- 修正 Bug
- 調整 API 行為
- 改變資料格式
- 新增資料庫結構

不得自行視為重構。

除非使用者明確要求重構。

---

## 重構類型判定

重構前必須先判斷本次任務屬於哪一種模式。

### Node.js Backend Refactor

符合以下情境時：

- Node.js
- Express
- TypeScript
- JavaScript
- Backend API
- Controller
- Service
- Repository
- Database
- Authentication
- Authorization

使用：

node-backend-refactor.md

---

### Python Backend Refactor

符合以下情境時：

- Python
- FastAPI
- Flask
- Django
- API
- Router
- Schema
- Service
- Repository
- Background Job
- Microservice
- AI Service
- LLM
- Prompt

使用：

python-backend-refactor.md

---

### Frontend Refactor

符合以下情境時：

- Vue
- React
- Component
- Store
- Composable
- Page
- UI
- State Management
- CSS Framework

使用：

frontend-refactor.md

---

### General Refactor

若無法明確歸類：

使用：

general-refactor.md

僅允許：

- 命名改善
- 函式拆分
- 重複邏輯移除
- import 整理
- 小範圍檔案整理

不得進行架構級調整。

---

若任務同時涉及多種模式：

必須停止並回報：

建議拆分為多個重構任務。

不得一次處理多種重構模式。

---

## Skill 載入規則

完成重構模式判定後：

必須載入對應的 Refactor Skill。

對應關係：

- Node.js Backend Refactor → node-backend-refactor.md
- Python Backend Refactor → python-backend-refactor.md
- Frontend Refactor → frontend-refactor.md
- General Refactor → general-refactor.md

載入後：

- 必須遵守本文件規則
- 必須遵守對應 Skill 規則

若規則衝突：

以細部 Skill 為準。

---

若找不到對應 Skill：

必須停止任務。

回報：

Refactor Skill Missing

Detected Mode:
<mode>

Required Skill:
<skill-file>

Status:
Skill file not found

Action:
Stop task and request missing skill file.

不得：

- 自行推測規則
- 自行制定重構策略
- 自行修改程式碼
- 使用其他 Skill 代替

---

## 通用規則邊界

本文件只定義：

- 重構模式判定
- Skill 載入規則
- 共用限制
- 共用流程
- 共用驗證方式
- 共用輸出格式

不得在本文件新增：

- Node.js 專案規則
- Python 專案規則
- Frontend 專案規則
- Framework 專屬規則
- 專案專屬規則

細部規則必須放置於對應 Refactor Skill。

---

## 使用限制

所有重構都必須遵守：

- 不得改變既有功能行為
- 不得改變 API 路徑
- 不得改變 Request / Response 結構
- 不得改變資料庫 Schema
- 不得新增 Migration
- 不得新增外部服務
- 不得新增套件依賴（除非使用者要求）
- 不得自行引入新架構
- 不得跨模組大範圍修改
- 不得順手修正無關問題
- 不得同時進行重構與功能開發

每次重構只能聚焦一個目標。

---

## 操作流程

### 重構前

必須先執行：

git status

確認工作區狀態。

若存在未提交變更：

必須回報目前狀態。

不得直接覆蓋。

接著：

- 閱讀相關檔案
- 理解現有流程
- 確認重構範圍

必須回報：

- 重構模式
- 重構目標
- 修改範圍
- 不修改範圍

---

### 重構中

必須遵守：

- 小步修改
- 保留原有功能
- 優先移動邏輯
- 不優先重寫邏輯
- 每次只處理一個問題
- 不加入未要求功能
- 不留下未使用程式碼
- 不留下 TODO

若超出原本範圍：

必須停止並回報。

---

### 重構後

必須檢查：

- 功能是否維持不變
- API 是否維持不變
- 資料結構是否維持不變
- 是否新增依賴
- 是否有未使用 import
- 是否有 debug code
- 是否有 TODO
- 是否有暫時註解

---

## 驗證方式

重構完成後：

必須執行對應 Refactor Skill 規定的驗證流程。

若無法執行驗證：

必須回報：

- 未執行的驗證項目
- 無法執行原因
- 可能風險

不得略過驗證直接宣告完成。

---

## 完成輸出要求

重構完成後必須回報：

## Refactor Summary

### Mode

### Goal

### Changed Files

### Behavior Changes

### API Changes

### Database Changes

### Dependency Changes

### Validation

### Notes

若某項沒有變更：

填寫：

無

不得省略。

---

## Markdown 規範

所有 Markdown Code Block 必須成對出現。

禁止：

- 遺漏結尾 Fence
- 遺漏起始 Fence
- 產生未閉合 Code Block

完成輸出前必須檢查：

- Markdown 結構完整
- Code Block 完整閉合
- 不存在格式錯誤

# 特例專案

## AI Monthly Report 專案規則

若任務涉及 FIRE AI monthly report：

Node.js 主後端負責：

- 驗證使用者身份
- 驗證 year / month / period
- 查詢 FIRE 主資料庫
- 整理交易分析資料
- 限制傳遞給 Python 的資料量
- 限制 note 長度
- 限制同一 userId + period 重複請求
- 呼叫 Python AI Service
- 回傳前端需要的結果
- 必要時儲存 AI 報告結果

Python AI Service 負責：

- 接收已整理好的分析資料
- 驗證 request schema
- 組裝 prompt
- 呼叫 LLM
- 回傳 AI 分析結果

Node.js 不得把主資料庫查詢責任交給 Python。

Python AI Service 不得直接查 FIRE 主資料庫。

---
