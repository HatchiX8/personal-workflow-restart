# Team Style Sampling

從入口附近、主要 app、常見 feature、shared 模組與少量測試中抽樣；避免 generated、vendor、minified、archive、一次性 script 與特殊案例。

觀察命名、資料夾與 module 分層、component／service 拆分、資料流、API／state／error handling、測試與文件風格、import direction。Monorepo 從每個主要 app、技術棧及高階 shared 區選取最小代表性樣本。

以「穩定慣例」（多個樣本一致）、「局部慣例」（只在特定範圍成立）與「待人工確認」（樣本不足或矛盾）呈現。不同風格分開列出範圍與可能原因，不評價好壞或提出統一重構。
