---
tags: [pm88helper, data, schema, v2]
created: 2026-04-19
---

# pm88helper v2 data/ README（給 AI / Agent 使用）

> 目的：讓不同 AI（Claude Code / Codex / OpenClaw agents）能以**同一套 JSON** 讀取與合併資訊，生成「本週待辦 + 補助速查 + 疫苗速查」。
>
> 原則：**資料是 SSOT**。前端 `v2/scripts/app.js` 只負責按照 mapping 合併顯示。

## 檔案總覽（你應該讀哪些）

- `stage_mapping.json`（v2 核心）
  - 定義：每個「階段」要如何挑選待辦、補助顯示模式、疫苗資料集/錨點。

- `checklist.json`
  - 定義：待辦事項庫（每個 stage 的 items 必須有唯一 `id`）。

- `subsidy.json`
  - 定義：中央 + 各縣市生育補助摘要與官方入口。

- `vaccine.json`
  - 定義：嬰幼兒疫苗「月齡時間線」（timeline）。

- `vaccine_pregnancy.json`
  - 定義：孕期/備孕疫苗提醒時間線（timeline）。

- `ai.json`
  - 定義：AI 諮詢入口（Gemini/ChatGPT 等）的 CTA 連結與注意事項。

---

# 如何使用（對不同 AI 的指令模板）

## A) Claude Code / Codex（你在終端裡）

你可以直接說：
- 「讀 `v2/data/stage_mapping.json`，告訴我 `preg-early` 的 todo top3 是哪三個 checklist item；疫苗用哪個 timeline、錨點是什麼；最後輸出一段『本週 3 件事 + 疫苗速查 + 補助速查』。」

或更精準：
- 「請用 `stage_mapping.json` 合併 `checklist.json` 與 `vaccine_pregnancy.json`，以 `stageId=preg-early` 生成 UI 會顯示的內容（3 個待辦 + 2 個疫苗節點）。」

## B) OpenClaw agent（在 vault / repo 內）

你可以直接說：
- 「用 v2/data 的 SSOT 生成『階段=月子期、城市=臺北市』的顯示內容，並附上官方來源連結。」

> OpenClaw 內建 `browser` tool 不需要讀 JSON 就能抓頁面，但 v2 的設計是：**先用 JSON 合併**再顯示，避免每次都去爬。

---

# 合併規則（v2 資料驅動合併）

給任一階段/城市，輸出建議結構：

1) **本週 3 件事**
- 依 `stage_mapping.json` 找到 stage：`stages[].id == <stageId>`
- 取得 `todo.stageId`（對應到 checklist 的 stage）
- 取得 `todo.top3[]`（三個 item id）
- 從 `checklist.json.stages[]` 中找到相同 stageId 的 `items[]`，用 id 對齊

2) **補助速查**
- 固定顯示：`subsidy.json.central`（中央摘要 + sources）
- 城市顯示：在 `subsidy.json.locals[]` 找 `city == <cityName>`，顯示 `summary` + `official_url`

3) **疫苗速查**
- 依 `stage_mapping.json` 的 `vaccine` 欄位決定：
  - `mode=note`：直接顯示 `notes[]`
  - `mode=timeline`：
    - 選資料集：`timeline="pregnancy"` → `vaccine_pregnancy.json`；否則 → `vaccine.json`
    - 找錨點：`anchorAge` 對應 `timeline[].age`
    - 取 `take` 個節點（預設 2）
    - 來源連結：使用該資料集的 `sources[]`

---

# Schema 定義（逐 key 說明）

## 1) stage_mapping.json

### Root
- `version` (string)
  - 例："v2"
- `updated` (YYYY-MM-DD string)
  - mapping 更新日期
- `stages` (array)
  - 每個階段一筆設定

### stages[]
- `id` (string)
  - 階段 ID（必須唯一）
  - 例："pre", "preg-early", "postpartum"
- `label` (string)
  - 顯示給使用者的名稱
- `todo` (object)
  - 待辦合併規則
- `subsidy` (object)
  - 補助顯示規則（目前僅定義 mode）
- `vaccine` (object)
  - 疫苗顯示規則（note / timeline）

### stages[].todo
- `stageId` (string)
  - 對應到 `checklist.json.stages[].id`
- `top3` (array of string)
  - 三個待辦 item id（對應 checklist items[].id）

### stages[].subsidy
- `mode` (string)
  - 目前："central+city"（顯示中央 + 選定城市）

### stages[].vaccine
- `mode` ("note" | "timeline")
- `notes` (array of string)  *(mode=note 才有)*
- `timeline` (string) *(mode=timeline 才有)*
  - 目前支援："pregnancy"（對應 vaccine_pregnancy.json）；缺省表示使用 vaccine.json
- `anchorAge` (string) *(mode=timeline 才有)*
  - 必須能在對應資料集的 `timeline[].age` 找到
- `take` (number) *(mode=timeline 才有)*
  - 取幾個節點（建議 2）

---

## 2) checklist.json

### Root
- `updated` (YYYY-MM-DD string)
- `stages` (array)

### stages[]
- `id` (string)
- `name` (string)
- `items` (array)

### items[]
- `id` (string)
  - 唯一識別（mapping 會用）
- `title` (string)
- `tip` (string)

---

## 3) subsidy.json

### Root
- `updated` (YYYY-MM-DD string)
- `central` (object)
- `locals` (array)

### central
- `title` (string)
- `summary` (string)
- `sources` (array)

### sources[]
- `label` (string)
- `url` (string)

### locals[]
- `city` (string)
- `dept` (string)
- `official_url` (string)
- `has_local_subsidy` (string | boolean)
- `summary` (string)
- `central_stackable` (string)

---

## 4) vaccine.json（嬰幼兒月齡表）

### Root
- `updated` (YYYY-MM-DD string)
- `timeline` (array)
- `sources` (array, optional)

### timeline[]
- `age` (string)
  - 例："出生", "2 個月"
- `items` (array of string)

### sources[] (optional)
- `label` (string)
- `url` (string)

---

## 5) vaccine_pregnancy.json（孕期表）

### Root
- `updated` (YYYY-MM-DD string)
- `timeline` (array)
- `sources` (array)
- `notes` (array)

### timeline[]
- `id` (string)
- `age` (string)
  - 例："孕前（備孕）", "孕 27-36 週（常見節點）"
- `items` (array of string)

### sources[]
- `label` (string)
- `url` (string)

### notes[]
- 法務/醫療聲明與使用限制（避免誤用）

---

## 6) ai.json

### Root
- `updated` (YYYY-MM-DD string)
- `links` (array)
- `notes` (array)

### links[]
- `id` (string)
- `label` (string)
- `url` (string)

---

# 變更與相容性注意
- **請不要改動既有 `id`**（stage id / item id / timeline age），否則 mapping 會失效。
- 若需要調整文字（summary/tip/items），可自由更新，不影響 mapping。
- 若要新增 stage：
  1) 先在 `checklist.json` 增 stage+items（含 id）
  2) 再在 `stage_mapping.json` 加一筆對應設定
