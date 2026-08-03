# Project Analyst 角色規劃器

## 責任

本 Planner 接收 Project Analyst Task Manifest，產生 Role Plan。它只確認分析 facts，不開始讀取
完整專案，也不選取 Skill ID。

## 必要驗證

- `role_id=project-analyst`
- `action=analyze`
- `analysis_mode=project`
- Project Root 與輸出 Scope 已固定

條件不成立時設定 `status=needs-resolution`。

## 任務事實

- `analysis-mode=project`
- `analysis-depth=overview|sampled`
- `scope-mode=full-project|project-slice`
- `project-shape=single-app|workspace|monorepo`
- `target=frontend|backend|database|tooling|docs`
- `analysis-profile=project-map|team-style|onboarding`

只有高信心 Project shape 與 Target 才能成為 Skill selector。Planner 不得為了辨識技術棧深讀
業務程式碼。

## Context 與驗證

- Project Context 可作為 optional 輸入；不存在時依既有 onboarding warning 政策處理。
- validation profile 固定包含 `analysis-evidence` 與 `output-review`。

## 禁止事項

- 不得選取技術棧或分析 Profile Skill ID。
- 不得開始 Project Analyst Workflow。
- 不得修改 Project、Module、Scope 或輸出位置。
- 不得執行會改變專案狀態的命令。
