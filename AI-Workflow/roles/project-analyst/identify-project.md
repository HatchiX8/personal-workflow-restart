# Identify Project

本階段負責辨識專案，不深入分析每個工程細節。

本階段目標是建立 high-level project map，讓工程師先知道專案長什麼樣子、用什麼技術、從哪裡開始讀。

## 目標

- 建立專案地圖
- 辨識專案類型
- 辨識主要技術棧
- 找出主要入口與啟動方式
- 標記需要人工確認的未知資訊

## 執行順序

Project Analyst 應依以下順序辨識專案：

1. 掃描根目錄檔案與第一層資料夾
2. 辨識 package manager、workspace 或 solution 結構
3. 讀取 README 或既有文件
4. 讀取 dependency、build、test、lint、framework 設定檔
5. 找出 app、server、library 或 CLI 入口
6. 建立主要資料夾職責地圖
7. 標記外部服務、環境變數名稱與待確認事項

若專案很大，第一輪只建立高階地圖，不展開每個子專案。

## 建議觀察來源

- 根目錄檔案
- package / dependency 設定檔
- build / test / lint 設定檔
- framework 設定檔
- 主要入口檔
- 主要資料夾結構
- README 或既有文件

## 專案類型辨識

需辨識專案主要類型，例如：

- frontend app
- backend service
- fullstack app
- monorepo
- package / library
- CLI / tool
- desktop app
- mobile app
- documentation-only project
- infrastructure / deployment project

若專案同時包含多種類型，應標記為 mixed project，並列出主要 app / package 邊界。

## 技術棧辨識

需辨識可由檔案確認的技術棧：

- programming language
- framework
- runtime
- package manager
- build tool
- test tool
- lint / format tool
- UI framework 或 design system
- state management
- database / ORM
- API style
- deployment 或 infrastructure tool

技術棧只能根據設定檔、依賴檔、入口檔或既有文件判斷。

若只根據目錄名稱或少量樣本推論，必須標記為「根據結構推論」。

## Entry Points

需找出主要入口，但不深入分析入口內部邏輯。

入口可能包含：

- app entry
- server entry
- route entry
- CLI entry
- package export entry
- build config entry
- deployment entry

若存在多個入口，應列出其用途與可能所屬子專案。

## Project Map

專案地圖應描述主要資料夾職責，不逐檔摘要。

每個主要資料夾建議記錄：

- 路徑
- 推定責任
- 可信度
- 是否需要人工確認

若資料夾責任無法由命名、README 或少量樣本確認，應標記為待人工確認。

## Workspace And Monorepo

若偵測到 workspace 或 monorepo，需先辨識邊界：

- apps
- packages
- services
- libs
- shared modules
- tools
- infrastructure

Project Analyst 不得逐一深入分析所有 workspace package。

若使用者未指定範圍，應優先產出 workspace map，並標記哪些 package 未深入分析。

## External Services

需辨識可能的外部服務或第三方整合，但不深入分析實作細節。

可觀察：

- dependency names
- config file names
- environment variable names
- README / docs mentions
- service client folder names

不得讀取 secret value 或 private config。

外部服務用途若無法確認，應標記為待人工確認。

## Environment Variables

本階段可以列出環境變數名稱，但不得讀取或輸出值。

可用來源：

- `.env.example`
- `.env.sample`
- README 或 docs
- 程式碼中的 `process.env`、`import.meta.env` 或類似引用
- framework 公開設定

不得讀取 `.env` 或 `.env.*` 的實際內容。

## 輸出重點

- 專案類型
- 技術棧
- package manager
- build / test / lint 工具
- app / server / library 入口
- 主要資料夾責任
- 外部服務或第三方依賴

## 本階段不得執行

- 不得分析每個 feature 的內部業務邏輯
- 不得逐檔摘要
- 不得讀取 secret 或 private config
- 不得執行 install、build、test、migration 或 dev server
- 不得提出重構或架構改善方案
- 不得因為缺少文件而自行腦補啟動方式或部署方式

