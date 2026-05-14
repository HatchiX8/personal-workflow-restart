# Project Structure

## 範例

src/project_analyzer/
├── cli.py
├── app.py
├── scanner/
├── readme/
├── config/
├── stats/
├── module_analyzer/
├── reporter/
└── shared/

---

## 模組責任

### scanner/

- 僅負責 filesystem scanning
- 不得實作 statistics logic
- 不得產生 report

### reporter/

- 僅負責 output formatting
- 不得掃描檔案
