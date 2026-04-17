---
marp: true
theme: default
paginate: true
backgroundColor: #ffffff
style: |
  section {
    font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
    font-size: 1.1rem;
  }
  section.lead h1 {
    font-size: 2.2rem;
    color: #1a1a2e;
  }
  section.lead p {
    color: #555;
  }
  h1 { color: #1a1a2e; border-bottom: 3px solid #4f46e5; padding-bottom: 0.3em; }
  h2 { color: #3730a3; }
  code { background: #f1f5f9; padding: 0.1em 0.4em; border-radius: 4px; font-size: 0.9em; }
  pre { background: #1e293b; color: #e2e8f0; border-radius: 8px; }
  pre code { background: transparent; color: inherit; }
  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5em; }
  blockquote { border-left: 4px solid #4f46e5; background: #eef2ff; padding: 0.5em 1em; margin: 0.5em 0; color: #3730a3; font-style: normal; }
  table { font-size: 0.85rem; }
  .warn { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.5em 1em; }
  .good { background: #dcfce7; border-left: 4px solid #22c55e; padding: 0.5em 1em; }
---

<!-- _class: lead -->

# 用 OpenSpec 驅動 AI 開發
## 從需求到程式碼的結構化 AI 協作流程

**示範專案：台灣電子發票 OCR 系統**

中租控股工程師分享
2026-04-16

---

# 背景：這個 session 做了什麼

本次示範用一個真實的 POC 專案走完 OpenSpec 完整流程：

> **台灣電子發票辨識與分類 Web App**
> — 相機拍照、QR 掃描、Gemma 4 Vision OCR、費用分類、Excel 匯出

**技術規模：**
- 後端：FastAPI + SQLAlchemy + SQLite（33 個 unit tests，全部通過）
- 前端：React + Vite + TypeScript + Tailwind CSS v4
- 總計約 **74 個實作任務**，跨越 2 個 Claude Code session

**誠實說明：** propose → specs → design → tasks 發生在第一個 session；本次 session 主要執行 apply（前端實作）與收尾文件。兩段流程合起來才是完整的 OpenSpec 循環。

---

# 傳統 AI 開發 vs. OpenSpec 開發

<div class="columns">

**傳統方式**
1. 人寫需求文件（或不寫）
2. 直接跟 AI 說「幫我寫一個發票系統」
3. AI 產出一堆程式碼
4. 發現架構決策沒有討論
5. 改了這裡壞那裡
6. 重來

**OpenSpec 方式**
1. AI 協作產出 `plan.md`
2. `openspec propose` → 需求摘要
3. `openspec` 展開 specs、design、tasks
4. 架構決策有明確記錄
5. `/opsx:apply` 逐 task 實作
6. `openspec archive` 歸檔

</div>

<div class="warn">

**關鍵差異不是「有沒有文件」，而是文件跟程式碼之間有沒有受控的連結。**

</div>

---

# OpenSpec 是什麼

OpenSpec 是一個**結構化 AI 開發工作流程框架**，定義「actions，不是 phases」：

| Command | 作用 |
|---|---|
| `openspec propose` | 從輸入產生 proposal（需求摘要） |
| `openspec` (continue) | 依序展開 specs → design → tasks |
| `openspec apply` 或 `/opsx:apply` | AI 根據 tasks 實作程式碼 |
| `openspec archive` | 完成後歸檔 change |

**Schema 類型：** 這個專案使用 `spec-driven`，適合從零建立新功能的情境。

> config.yaml 設定語言規則、spec 格式等慣例，確保每個 artifact 的一致性。

---

# 完整流程一覽

```
plan.md                    ← GitHub Copilot Plan Mode 產出（AI 協作）
    │
    ▼
openspec propose           → proposal.md（why / what / capabilities）
    │
    ▼
openspec (continue)        → specs/*.md（6 個 capability specs，GIVEN/WHEN/THEN）
    │
    ▼
openspec (continue)        → design.md（架構決策，含 trade-offs）
    │
    ▼
openspec (continue)        → tasks.md（74 個實作任務，逐條可勾選）
    │
    ▼
/opsx:apply                → Claude Code 逐 task 實作，即時打勾
    │
    ▼
openspec archive           → change 歸檔，artifacts 保留
```

---

# Step 0：GitHub Copilot Plan Mode → `plan.md`

這一步是整個流程的**起點**，也是 AI 協作的第一層。

Copilot Plan Mode 將模糊的需求對話轉成結構化計畫文件：

```markdown
## 需求摘要
| 項目 | 決定 |
|------|------|
| 前端 | React + Vite + TypeScript + TailwindCSS |
| OCR/AI | 內部 Gemma 4 endpoint (OpenAI-compat API) |
| 分類來源 | 會計提供 CSV 規則 → 程式判斷 → LLM fallback → 使用者確認 |

## OCR Pipeline
ScanRequest {image_base64, qr_left, qr_right, barcode_raw}
  ├─ Step 1: qr_parser.parse_qr_left()
  ├─ Step 4: gemma_client.extract_from_image(image_b64, hint=qr_data)
  └─ Step 5: merge — QR > OCR > barcode
```

**這份文件不是給工程師看的，是給 OpenSpec 吃的。**

---

# Step 1：`openspec propose` → `proposal.md`

OpenSpec 以 `plan.md` 為基礎，提煉出正式的 proposal：

```markdown
## Why
公司報帳流程仰賴人工手動輸入發票資訊，耗時且容易出錯...

## What Changes
- 新增 OCR pipeline：QR > OCR > barcode 優先順序合併
- 新增費用分類引擎：CSV 規則 + LLM fallback

## Capabilities（新增）
- invoice-scanning
- invoice-management
- expense-classification
- bundle-management
- data-export
- category-settings
```

**Proposal 的作用：** 明確「為什麼要做這個」，並列舉影響範圍（capabilities），讓後續 specs 有邊界。

---

# Step 2：展開 Specs

每個 capability 各有一份 spec，用 Gherkin 格式描述行為：

```markdown
### Requirement: 規則分類引擎
系統 SHALL 在 OCR pipeline 完成後，對發票進行規則比對分類...

#### Scenario: 賣家統編精確比對命中
- WHEN 發票的 seller_tax_id 與某條 rule_type = seller_tax_id 完全相符
- THEN 系統 SHALL 將該規則分數以 priority × 2 加權計算
```

**本專案共產出 6 份 spec：**
`invoice-scanning` / `invoice-management` / `expense-classification` / `bundle-management` / `data-export` / `category-settings`

> Specs 用 SHALL / MUST / SHOULD 明確區分強制與建議行為，避免「應該」的模糊地帶。

---

# Step 3：展開 `design.md`

Design 記錄**架構決策與 trade-offs**，這是最容易在 AI 開發中消失的資訊：

```markdown
### 2. OCR Pipeline 資料合併策略
決定：QR code > OCR 視覺辨識 > 條碼解析，採用優先順序 merge

理由：台灣電子發票左側 QR 包含完整結構化資料（發票號碼、金額、統編），
準確度最高。OCR 主要補充 QR 沒有的「賣家名稱」欄位。

替代方案考慮：純 OCR → 錯誤率高；只用 QR → 遺漏賣家名稱。

### Risks / Trade-offs
- [Gemma 4 endpoint 可用性] → OCR 失敗時允許使用者手動輸入
- [行動瀏覽器相機權限] → 開發環境使用 localhost（HTTPS 豁免）
- [SQLite 並發限制] → POC 階段接受此限制，記錄為已知限制
```

**如果不寫 design.md，這些決策只存在工程師腦中——或 AI 的上下文裡，換個 session 就消失了。**

---

# Step 4：展開 `tasks.md`

74 個具體的實作任務，按模組分組，每條可獨立勾選：

```markdown
## 4. OCR Pipeline 核心服務
- [x] 4.1 建立 backend/app/services/qr_parser.py：實作 parse_qr_left()
      （解析台灣電子發票左側 QR，含民國→西元日期轉換、B2C 買方統編為零處理）
- [x] 4.4 建立 backend/app/services/gemma_client.py：實作 extract_from_image()
      （呼叫 Gemma 4 Vision endpoint，含 hint_json 注入、markdown wrapper regex fallback）

## 10. 前端掃描元件
- [x] 10.4 建立 frontend/src/components/scanner/BarcodeScanner.tsx
      （html5-qrcode Code39 掃描）
- [x] 10.5 建立 frontend/src/pages/ScanPage.tsx
      （4 步驟 wizard：Capture → Processing → Review → Save）
```

**Tasks 是 AI 執行的指令，也是人類 review 的 checklist。兩個功能同時成立。**

---

# Step 5：`/opsx:apply` — AI 實作

Claude Code 讀取所有 artifact 後，逐 task 實作：

**AI 在 apply 時做的事：**
1. 讀取 `proposal.md` → 理解目標與邊界
2. 讀取對應 `spec.md` → 理解每個功能的行為要求
3. 讀取 `design.md` → 採用已決定的架構（不重新決策）
4. 按 `tasks.md` 逐條實作 → 完成即打 `[x]`

**實際觀察到的行為：**

```bash
# AI 遇到問題時會停下來，不是猜
# 例如：發現 @hookform/resolvers 未安裝
npm install @hookform/resolvers

# TypeScript 型別檢查通過才繼續
npx tsc --noEmit   # → 無輸出（乾淨）
```

> Apply 不是「一鍵生成全部」，AI 會逐步推進、遇到實際問題即處理。

---

# 一個真實的除錯案例

**問題：** 後端 API 整合測試失敗 — `"no such table: invoices"`

**原因：** in-memory SQLite 的每個連線是獨立的，schema 在 A 連線建立，B 連線看不到。

**如何發現：** AI 讀了錯誤訊息、追蹤 FastAPI 的 dependency injection 機制，找到根因。

**解法：**

```python
# 加入 StaticPool，讓所有連線共用同一個 in-memory DB
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,   # ← 關鍵
)
```

**這個 fix 沒有記錄在任何 artifact 裡**——它是 apply 過程中發現的實作細節，記錄在 CLAUDE.md 的 Testing patterns 章節。

---

# Step 6：`openspec archive`

（本次 session 以「假設已執行」方式呈現）

Archive 的作用：
- 將這個 change 標記為完成
- Artifacts（proposal / specs / design / tasks）保留在 `openspec/changes/` 目錄
- 未來可查閱：「這個功能當初為什麼這樣設計？」

```
openspec/changes/taiwan-invoice-ocr-webapp/
├── .openspec.yaml    ← schema: spec-driven, created: 2026-04-16
├── proposal.md
├── design.md
├── tasks.md          ← 74/74 [x]
└── specs/
    ├── invoice-scanning/spec.md
    ├── expense-classification/spec.md
    └── ...（共 6 個）
```

> 這是 OpenSpec 跟「AI 幫你寫完就忘了」最大的差別：**決策有歷史紀錄。**

---

# CLAUDE.md 的角色

Apply 結束後，另一個重要產出是 `CLAUDE.md`：

```markdown
# CLAUDE.md
## Commands
# 所有 Python 用 uv，不用 pip
uv run pytest tests/test_qr_parser.py   # 單一測試
uv run alembic upgrade head             # 套用 migration

## Architecture
# OCR pipeline merge priority: QR > OCR > barcode
# seller_name 只來自 OCR（QR 不含此欄位）

## Testing patterns
# 整合測試用 StaticPool 讓所有連線共用 in-memory DB
# Gemma 呼叫一律用 AsyncMock
```

**CLAUDE.md 是給「下一個 AI session」看的**，不是給人看的文件。它把這個 session 學到的東西持久化，下次 AI 不用從頭探索。

---

# 流程中的三種 AI 角色

| 階段 | AI 工具 | AI 的角色 |
|---|---|---|
| `plan.md` 產出 | GitHub Copilot Plan Mode | 協助人類整理需求、提問、產出結構化計畫 |
| Propose → Tasks | OpenSpec CLI | 將計畫轉為規格體系（proposal / specs / design / tasks） |
| Apply | Claude Code | 根據已決定的規格實作程式碼，遇問題自行診斷 |

**人類在哪裡？**
- 在 `plan.md` 階段：定義 **what** 和 **why**，AI 幫你問你沒想到的問題
- 在 specs / design review：確認邊界和架構決策是否正確
- 在 apply 之後：驗收成果（E2E 測試仍需人工執行）

---

# Trade-offs 與限制

<div class="warn">

**1. Context window 斷裂**
本次專案分兩個 session，中間做了 `/compact`。CLAUDE.md 和 memory 系統可以緩解，但無法完全替代連續對話的上下文。74 個 tasks 在一個 session 裡完成有壓力。

</div>

<div class="warn">

**2. Spec 跟程式碼可能漂移**
Tasks 是 AI 寫的，但實作細節（例如 `StaticPool` fix）不會自動回寫到 spec。需要靠 `openspec verify` 指令（本次未使用）來做一致性檢查。

</div>

<div class="warn">

**3. E2E 驗證無法自動化**
Tasks 13.1–13.8（真實發票圖片、行動瀏覽器相機）仍需人工執行。AI 實作了邏輯，但感知世界仍是人的工作。

</div>

---

# 實際效益（這個案例）

**74 個任務，跨越 2 個 Claude Code sessions：**

- 後端 FastAPI + OCR pipeline + 分類引擎：33 個 unit tests，全部通過
- 前端 React 全功能：掃描 wizard、發票管理、bundle、設定頁面
- CLAUDE.md、README.md 自動產出

**如果傳統方式呢？**

- 架構文件通常在「等有空再補」的 backlog 裡
- 每次 AI 對話都要重新解釋背景
- 「當初為什麼這樣設計」需要問原作者

> **OpenSpec 解決的核心問題不是「讓 AI 寫更多程式碼」，而是「讓 AI 的決策可追溯、可接續」。**

---

# 適合 / 不適合的場景

<div class="columns">

**適合**
- 新功能從零開始
- 需要多人 review 規格
- 預期需求會迭代演進
- 跨 session 的長期開發
- 需要對 PM/PM 說明架構決策

**不適合**
- 一次性腳本或小改動
- 需求完全清晰、直接實作
- 團隊尚未建立 AI 開發習慣
- 沒有時間做 spec review

</div>

<div class="good">

**最關鍵的一點：** OpenSpec 的價值在 **explore / design** 階段，不在 **apply** 階段。如果跳過前面直接 apply，就只是「更結構化的 prompt engineering」。

</div>

---

<!-- _class: lead -->

# 總結

**OpenSpec 是一個框架，讓 AI 開發從「一次性對話」變成「可追溯的工程流程」。**

```
人的想法
  → Copilot Plan Mode（plan.md）
    → OpenSpec（proposal → specs → design → tasks）
      → Claude Code apply（實作）
        → Archive（歸檔，決策保留）
          → CLAUDE.md（下個 session 的記憶）
```

每一步都有 artifact，每個 artifact 都有明確目的。
下一個工程師（或下一個 AI session）不需要從頭問「當初為什麼這樣做」。

---

<!-- _class: lead -->

# Q & A

**幾個可能的討論方向：**

- 你們目前的 AI 開發流程卡在哪個環節？
- Spec review 的成本是否值得？（我的答案：取決於需求的穩定性）
- OpenSpec 能跟現有的 Jira / Linear 工作流整合嗎？

**相關資源：**
- OpenSpec: https://github.com/Fission-AI/OpenSpec
- 本次示範的 artifacts: `openspec/changes/taiwan-invoice-ocr-webapp/`
