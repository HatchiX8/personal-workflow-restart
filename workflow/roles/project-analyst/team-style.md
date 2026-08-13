# Team Style Analysis

本階段負責從既有程式碼歸納團隊工程風格。

Project Analyst 必須以代表性檔案抽樣觀察，不得深讀整個專案。

本階段目標不是評價程式碼好壞，而是描述團隊已經形成的工程慣例。

## 目標

- 找出 component / module 拆分風格
- 找出命名規則
- 找出檔案分層慣例
- 找出資料流與依賴方向
- 找出常見開發模式

## 執行順序

Project Analyst 應依以下順序分析團隊風格：

1. 根據 `identify-project.md` 的專案地圖選擇代表性區域
2. 從主要 app、shared modules、常見 feature 中抽樣檔案
3. 觀察命名、分層、拆分、資料流與依賴方向
4. 比對樣本是否呈現一致慣例
5. 將穩定慣例、局部慣例與待確認事項分開記錄

若樣本不足，不得擴大成全專案深讀；應標記為待人工確認。

## Sampling Selection

抽樣時應優先選擇：

- 主要入口附近的檔案
- 最常見的 feature 或 module
- shared / common / core / utils 類型資料夾
- 典型 UI component 或 API module
- 近期仍可能被維護的檔案
- 測試檔案或 story 檔案，若專案存在

抽樣時應避免：

- generated code
- vendor code
- minified code
- legacy 或 archive 資料夾，除非它是主要維護範圍
- 單次 migration 或一次性 script
- 明顯特殊案例

若專案是 monorepo，應從各主要 app、技術棧與高階 shared 區域選取最小代表性樣本。使用者指定的關注面向可增加該區域樣本，但不得因此將其他主要區域排除在專案層級結論之外。

## 建議觀察項目

- component / module 拆分方式
- 檔名、資料夾、class、function、component、hook 命名規則
- pages、components、hooks、services、utils、types、config 等分層慣例
- API 呼叫與資料取得方式
- state management 使用方式
- error / loading / empty state handling
- form、table、modal、layout 等常見 UI pattern
- 測試檔案命名與測試範圍
- import direction 與模組依賴邊界

## Frontend Style Signals

若專案包含 frontend，建議觀察：

- component 拆分粒度
- page / layout / component / feature 的分層方式
- hooks / composables / stores 的使用方式
- UI state、server state、form state 的分工
- API 呼叫是否集中封裝
- table、form、modal、filter、pagination 等常見 pattern
- styling 方式，例如 CSS modules、utility classes、styled components 或 design system
- loading、empty、error state 呈現方式

不得對 UI 品質或設計風格做審美評價，除非使用者明確要求。

## Backend Style Signals

若專案包含 backend，建議觀察：

- route / controller / service / repository 分層方式
- request validation 與 error handling 方式
- database access 或 ORM 使用方式
- DTO、schema、type 的放置位置
- middleware、auth、logging 的組織方式
- API response 格式是否一致
- background job、queue、scheduler 的組織方式
- test fixture 或 integration test 慣例

不得深入分析業務流程或資料庫細節，只記錄架構與風格慣例。

## Shared Module Style Signals

若專案包含 shared modules，建議觀察：

- shared code 的命名與分層
- types / constants / utils / config 的放置方式
- domain-specific shared modules 與 generic utils 是否分開
- import direction 是否避免循環依賴
- app 層是否直接依賴 shared modules

若無法確認依賴方向，應標記為待人工確認。

## Naming Rules

命名規則需從樣本中歸納，例如：

- file naming
- folder naming
- component naming
- hook / composable naming
- service / client naming
- type / interface naming
- test file naming

若不同區域命名不一致，應記錄差異，不得強行整理成單一規則。

## Style Confidence

團隊風格結論必須標記可信度。

建議使用：

- 穩定慣例：多個代表性樣本一致
- 局部慣例：只在特定資料夾、app 或 package 中成立
- 待人工確認：樣本不足、樣本矛盾或來源不明

不得把單一檔案、單一開發者風格或單一舊模組當成全專案慣例。

## Conflict Handling

若觀察到不同風格：

- 分開列出差異
- 標記各自出現的範圍
- 標記可能原因，例如 legacy、不同 app、不同 package、不同技術棧
- 不主動判定哪一種風格比較好
- 不提出重構統一建議，除非使用者明確要求

## 輸出重點

本階段應整理出：

- component / module 拆分慣例
- 命名規則
- 目錄分層規則
- 資料流與依賴方向
- API / state / error handling 慣例
- 測試與文件風格
- 穩定慣例、局部慣例、待確認事項

## 分析原則

- 從既有程式碼歸納，不主動套用外部最佳實踐
- 只記錄有代表性的團隊風格
- 不把單一特例當成專案慣例
- 無法確認時標記為待人工確認

## 本階段不得執行

- 不得逐檔分析所有 component 或 module
- 不得深入追蹤完整業務流程
- 不得為了確認風格而閱讀大量相似檔案
- 不得輸出 code review finding
- 不得輸出重構建議
- 不得將個人偏好寫成團隊規則
