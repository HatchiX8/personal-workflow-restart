# 遊歷頁面 API 設計審核

狀態：Approved

本提案聚焦第一階段 MVP 的遊歷頁面，涵蓋載入目前劇情與選擇預設行動。自行輸入的 Contract 保留供後續階段擴充，但第一階段暫時停用。遊歷觸發戰鬥時只回傳轉場資訊；戰鬥頁面的回合操作不在本文件範圍。

設計依據：

- Notion「凡人－遨遊天地」第一階段 MVP 遊歷系統：顯示目前劇情、推進至墨大夫結束的新手劇情，以及選擇預設劇本文字或自行輸入角色行動。
- Miro「遨遊天地」遊歷畫面與系統流程：顯示世界時間、所在地、章節、場景敘事、預設行動、自行輸入，以及由遊歷觸發戰鬥後返回遊歷的流程。

## 範圍與端點總覽

| 使用者操作             | Endpoint ID | Method | Path                        | 用途                           |
| ---------------------- | ----------- | ------ | --------------------------- | ------------------------------ |
| 進入或重新整理遊歷頁面 | ADV-001     | GET    | `/api/v1/adventure/current` | 取得目前劇情節點與頁面操作狀態 |
| 選擇預設行動           | ADV-002     | POST   | `/api/v1/adventure/actions` | 執行目前節點提供的預設行動     |
| 輸入角色行動並送出     | ADV-002     | POST   | `/api/v1/adventure/actions` | Contract 預留，第一階段暫停使用 |

第一階段不提供「跳過新手劇情」功能，因此不建立相關端點。

## 共用 Contract

### Authentication

兩支端點都使用 Bearer Token 驗證。前端第一階段先從環境變數取得 Token，並在每次 Request 帶入 `Authorization: Bearer <token>`；此設計保留未來替換 Token 取得方式的擴充空間。角色 ID 不由前端傳入，Server 應從驗證後的身分取得目前角色。

### State version

`stateVersion` 是大於等於 `0` 的整數，用於避免使用者以過期頁面重複執行或覆蓋較新的遊戲狀態。

- `ADV-001` 回傳目前 `stateVersion`。
- `ADV-002` 必須提交該版本。
- 成功執行行動後回傳新的 `stateVersion`。
- 版本不一致時回傳 `409 Conflict`，前端重新呼叫 `ADV-001`。

`stateVersion` 採角色遊戲狀態 aggregate version，涵蓋劇情、世界時間、角色流程狀態與戰鬥轉場；上述任一狀態變更都必須推進版本。

### 共用錯誤格式

```ts
type ApiErrorResponse = {
  message: string
}

type AdventureFlowConflictResponse = {
  message: string
  currentState: 'BATTLE'
  redirect: {
    target: 'BATTLE'
    battleId: string
  }
}
```

錯誤 Response 不得回傳 stack trace、內部路徑、原始例外或 Provider 內部內容。

### 共用 Schema

```ts
type ResourceMeter = {
  current: number
  max: number
}

type WorldTime = {
  seasonLabel: string
  day: number
  displayText: string
}

type AdventureLocation = {
  locationId: string
  name: string
}

type StoryScene = {
  chapterId: string
  chapterTitle: string
  sceneId: string
  headline: string
  narrative: string
  sceneAssetKey: string | null
  characterAssetKey: string | null
}

type PresetAction = {
  actionId: string
  label: string
}

type CustomActionControl = {
  enabled: boolean
  placeholder: string
  maxLength: number
}

type PlayerAdventureSummary = {
  name: string
  realmLabel: string
  hp: ResourceMeter
  mana: ResourceMeter
  speed: number
}

type AdventureNavigation = {
  canOpenCharacter: boolean
  canOpenInventory: boolean
  canOpenCultivation: boolean
}

type AdventurePageState = {
  stateVersion: number
  worldTime: WorldTime
  location: AdventureLocation
  scene: StoryScene
  presetActions: PresetAction[]
  customAction: CustomActionControl
  player: PlayerAdventureSummary
  navigation: AdventureNavigation
}
```

限制：

- 所有 `*Id` 與 `*AssetKey` 都是 Server 提供的不透明字串，前端不得解析其格式或自行組合。
- `ResourceMeter.current` 與 `ResourceMeter.max` 為大於等於 `0` 的整數，且 `current` 不得大於 `max`。
- `WorldTime.day` 為大於等於 `1` 的整數；前端以 Server 回傳的 `displayText` 為顯示依據，不自行推導季節換日規則。
- `PresetAction.actionId` 在目前 `sceneId` 中必須唯一。
- `PresetAction.label`、劇情文字與顯示名稱由 Server 回傳，前端不得以 `actionId` 推導文案。
- `customAction.enabled` 在第一階段固定為 `false`。
- `customAction.maxLength` 固定為 `300`；在 `enabled: false` 時僅作為後續啟用的 Contract 預留值。
- `sceneAssetKey` 與 `characterAssetKey` 必填但允許 `null`；第一階段沒有對應素材時前端顯示既定 placeholder。

## ADV-001｜取得目前遊歷頁面

用途：進入遊歷頁面或需要重新同步狀態時，取得當前劇情與可執行操作。

`GET /api/v1/adventure/current`

### Request

沒有 Path、Query 或 Body 參數。

Request 必須包含 `Authorization: Bearer <token>` Header。

### Success response

Status：`200 OK`

```ts
type Response = AdventurePageState
```

Response 必須是同一個遊戲狀態快照：世界時間、劇情節點、預設行動及玩家摘要不得來自互相矛盾的版本。

### 流程相關錯誤

- `401 Unauthorized`：登入不存在或已失效；前端導向重新登入。
- `404 Not Found`：目前使用者沒有可載入的角色或遊戲進度；前端導向建立角色／進入仙途流程。
- `409 Conflict`：角色目前仍在戰鬥中，Response 使用 `AdventureFlowConflictResponse` 並提供目前 `battleId`；前端必須依 `redirect.target` 返回該戰鬥頁面。這同時支援使用者在戰鬥頁面異常離開或重新開啟遊歷頁面時恢復既有戰鬥。
- `500 Internal Server Error`：無法載入遊歷狀態；前端保留頁面並提供重試。

第一階段不提供可互動區塊或結構化場景互動對象；玩家依現有場景敘事與預設行動自行探索。

## ADV-002｜執行遊歷行動

用途：第一階段供玩家執行目前劇情節點的預設行動；Server 驗證後推進劇情，並指示前端停留於遊歷或轉入戰鬥。自行輸入型別僅預留 Contract，第一階段不執行該行動。

`POST /api/v1/adventure/actions`

### Request

Request body：

```ts
type RequestBody =
  | {
      type: 'PRESET'
      actionId: string
      stateVersion: number
    }
  | {
      type: 'CUSTOM_TEXT'
      text: string
      stateVersion: number
    }
```

限制：

- `type` 是 discriminator。
- `type: "PRESET"` 時只允許 `actionId`，不得提供 `text`。
- `type: "CUSTOM_TEXT"` 時只允許 `text`，不得提供 `actionId`。
- `actionId` 必須是 ADV-001 目前 `sceneId` 所回傳的有效選項。
- `text` 去除前後空白後不得為空，長度不得超過 `300` 個字元。
- 第一階段 `customAction.enabled` 固定為 `false`，Server 收到 `type: "CUSTOM_TEXT"` 時回傳 `422 Unprocessable Entity`，不得推進遊戲狀態。
- `stateVersion` 為大於等於 `0` 的整數，且必須等於目前 Server 版本。

### Success response

Status：`200 OK`

```ts
type Response =
  | {
      transition: 'ADVENTURE'
      resultNarrative: string
      adventure: AdventurePageState
    }
  | {
      transition: 'BATTLE'
      resultNarrative: string
      stateVersion: number
      battleId: string
    }
```

限制：

- `transition: "ADVENTURE"` 表示行動已完成，前端以 `adventure` 原子性替換整個遊歷頁面狀態，不需要立即再呼叫 ADV-001。
- `transition: "BATTLE"` 表示行動已建立戰鬥；前端使用 `battleId` 導向戰鬥頁面。
- `resultNarrative` 是本次行動的結果敘事，不保證等於下一個 `adventure.scene.narrative`。
- `battleId` 是不透明字串，前端不得解析其格式。
- 成功 Response 不會同時回傳 `adventure` 與 `battleId`。

### 流程相關錯誤

- `400 Bad Request`：Body 格式錯誤、discriminator 與欄位不符、文字為空或超過允許長度；前端保留輸入並顯示錯誤。
- `401 Unauthorized`：登入不存在或已失效；前端導向重新登入。
- `404 Not Found`：`actionId` 不存在，或角色／目前劇情節點不存在；前端重新載入 ADV-001。
- `409 Conflict`：`stateVersion` 過期、同一操作已處理，或角色已進入戰鬥等互斥狀態；前端不得自動重送，應重新載入最新狀態。
- `422 Unprocessable Entity`：`actionId` 存在但在目前劇情狀態不可執行，或送出第一階段暫停使用的 `CUSTOM_TEXT`；前端保留頁面並顯示原因。
- `500 Internal Server Error`：遊歷行動未完成；前端不得假設狀態已推進，重新查詢 ADV-001 後再決定是否重試。

## 決策紀錄

- `DEC-ADV-001`：使用 Bearer Token；第一階段由前端環境變數帶入。
- `DEC-ADV-002`：`stateVersion` 採角色遊戲狀態 aggregate version。
- `DEC-ADV-003`：第一階段停用自行輸入，`customAction.enabled` 固定為 `false`；預留最大長度為 `300` 個字元。
- `DEC-ADV-004`：第一階段不提供跳過新手劇情功能。
- `DEC-ADV-005`：第一階段不提供結構化場景互動對象。
- `DEC-ADV-006`：角色仍在戰鬥時，ADV-001 回傳 `409 Conflict` 與戰鬥 redirect contract，讓前端返回既有戰鬥。

## OpenAPI 交接狀態

本文件的第一階段公開 Contract 已完成決策，可作為後續 OpenAPI 規格與 Skill 撰寫的設計依據。
