# Personal Skills

本目錄保存需要由使用者在單次 Prompt 明確指定的個人擴充 Skills。

## 結構

```text
skills/
  <skill-id>/
    SKILL.md
    scripts/       # 選配
    references/    # 選配
    assets/        # 選配
```

- `<skill-id>` 使用 lowercase kebab-case，並與 `SKILL.md` frontmatter 的 `name` 相同。
- 每個 Skill 必須有 UTF-8 編碼的 `SKILL.md`，frontmatter 只包含 `name` 與 `description`。
- 詳細資料按需要放入 `scripts/`、`references/` 或 `assets/`。使用者明確需要了解用途、使用方式或效果時，可以建立供人閱讀的 `README.md`；Agent 執行 Skill 時不載入該 README。
- Skill 只保留執行該流程必要的規則與資源，避免複製角色或 Project Config 已經定義的內容。

## 使用方式

獨立使用不屬於專案角色的能力：

```text
個人 Skills：project-analysis
任務：分析這個陌生專案並建立專案分析文件。
```

或在角色工作中補充個人流程：

```text
角色：developer
個人 Skills：frontend-ui, testing-workflow
任務：完成指定功能並依個人流程驗證。
```

沒有角色時，指定的個人 Skill 可直接執行；它是否需要 Project Config 或額外 references，由自身 `SKILL.md` 定義。Developer 或 Review 任務則會先讀完角色規則與角色槽位 Skills，再依 Prompt 順序讀取指定的個人 Skills。沒有被明確指定的個人 Skill 不會自動載入。

Developer 與 Review 都可以使用個人 Skills。Skill 必須遵守目前角色邊界；例如 Review 載入測試流程 Skill 時，只能補充檢查方法與證據要求，不能因此取得程式碼修改權限。

`project-analysis` 與 `module-analysis` 不需要角色：它們本身是獨立唯讀分析流程，會直接讀取各自的 SKILL.md 與 references。使用時不可同時指定 Developer 或 Review。

`weekly-team-review` 也不需要角色：它是明確指定的獨立回顧流程，從可取得的 Codex 對話與 Workflow Root 任務日誌建立週報；不讀取 `project.config.json`，也不進入專案角色流程。

個人 Skill 不得切換角色、變更 stack、取代專案規則、降低驗證要求或擴大使用者授權。
