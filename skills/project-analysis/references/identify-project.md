# Project Identification

依序掃描根目錄與第一層資料夾、workspace／solution 結構、README、dependency／build／test／lint／framework 設定、主要入口，最後建立資料夾職責地圖。

辨識可由證據確認的專案類型、語言、框架、runtime、package manager、build／test／lint 工具、state management、database／ORM、API、deployment 與外部服務。只根據目錄或少量樣本的結論標記為結構推論。

Monorepo 必須列出主要 apps、packages、services、libs、shared modules、tools 與 infrastructure 邊界；不深入每個 package。可記錄環境變數名稱，但不得讀取 `.env` 或輸出值。
