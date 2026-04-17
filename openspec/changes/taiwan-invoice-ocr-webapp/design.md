## Context

本系統為公司報帳費用管理的 POC，需從零建立台灣電子發票辨識與分類 Web App。目前無任何既有系統，報帳流程完全仰賴人工輸入。核心限制：不串接財政部 API，所有資料從發票圖片、QR code、條碼取得；OCR/AI 使用內部 Gemma 4 Vision endpoint（OpenAI-compat 格式）；POC 階段無需使用者登入授權。

## Goals / Non-Goals

**Goals:**
- 建立可運作的 POC，涵蓋掃描、辨識、分類、管理、匯出完整流程
- QR code 解析優先，確保結構化資料準確性；OCR 作為補充（尤其是賣家名稱）
- 費用分類支援會計 CSV 規則 + LLM fallback，使用者確認後定案
- 支援行動瀏覽器（iOS Safari、Android Chrome）後鏡頭開啟
- 匯出 Excel/CSV 供報帳使用

**Non-Goals:**
- 財政部 API 整合或發票驗真
- 使用者登入/權限管理
- 多租戶/多公司支援
- 雲端部署或高可用架構
- 即時同步/多人協作

## Decisions

### 1. 前後端分離架構

**決定**：React SPA（Vite + TypeScript）+ FastAPI（Python）分離部署

**理由**：前端需要存取相機 API 與 QR/barcode 掃描，選 Vite 開發體驗佳；FastAPI 對 Python AI/ML 生態整合好，且 async 支援適合 LLM API 呼叫。分離架構允許前後端獨立開發。

**替代方案考慮**：Next.js 全端 → Python OCR 難整合；Django → 對 async AI 呼叫較笨重。

### 2. OCR Pipeline 資料合併策略

**決定**：QR code 資料 > OCR 視覺辨識 > 條碼解析，採用優先順序 merge

**理由**：台灣電子發票左側 QR 包含完整結構化資料（發票號碼、金額、統編等），準確度最高。右側 QR 包含品項。OCR 主要補充 QR 沒有的「賣家名稱」欄位。條碼為紙本發票 fallback。

**替代方案考慮**：純 OCR → 錯誤率高，無法確保金額準確；只用 QR → 遺漏賣家名稱。

### 3. 資料庫選型

**決定**：SQLite + SQLAlchemy + Alembic

**理由**：POC 階段無需多連線、無需高並發，SQLite 零配置易部署。SQLAlchemy ORM 提供資料庫抽象，未來若升級 PostgreSQL 成本低。Alembic 管理 schema 遷移。

**替代方案考慮**：PostgreSQL → 過重，POC 不需要；純 JSON 檔 → 查詢/篩選困難。

### 4. 分類引擎設計

**決定**：規則引擎（Phase 1）+ LLM fallback（Phase 2）兩階段分類

**理由**：規則分類確定性高、速度快、成本低，適合已知供應商（如固定餐廳、交通公司）。LLM fallback 處理規則未涵蓋的情況，提供彈性。信心值 < 0.5 才觸發 LLM，避免不必要的 API 呼叫。

**替代方案考慮**：純 LLM 分類 → 成本高、不穩定；純規則 → 難以覆蓋所有情況。

### 5. 圖片儲存

**決定**：圖片存本機資料夾，DB 僅存路徑

**理由**：POC 不需雲端儲存，本機路徑簡單直接。DB 存路徑而非 blob，避免 SQLite 膨脹，也方便未來遷移到 S3 等物件儲存。

### 6. 前端狀態管理

**決定**：Zustand（全域狀態）+ TanStack Query（伺服器狀態/快取）

**理由**：Zustand API 簡潔，適合 POC 規模；TanStack Query 處理 API 呼叫的快取、loading、error 狀態，避免手寫重複邏輯。

**替代方案考慮**：Redux → 樣板碼過多；純 useState → 跨元件共享困難。

### 7. QR/Barcode 掃描

**決定**：html5-qrcode 函式庫（前端掃描）

**理由**：支援 QR code 與 Code39 條碼，相機存取 API 封裝完整，支援行動瀏覽器。使用者在前端掃描後，原始字串送後端解析，後端掌握解析邏輯，易於單元測試。

## Risks / Trade-offs

- **[Gemma 4 endpoint 可用性]** → 內部 endpoint 若不穩定會影響 OCR 與 LLM 分類功能。緩解：OCR 失敗時允許使用者手動輸入；LLM fallback 失敗時標記為「待確認」。

- **[QR code 遮擋或損毀]** → 部分發票 QR 可能模糊或被折疊。緩解：OCR + 條碼作為 fallback；UI 提示使用者補填缺失欄位。

- **[行動瀏覽器相機權限]** → iOS Safari 對相機 API 有限制，需 HTTPS。緩解：開發環境使用 localhost（HTTPS 豁免），生產需部署至 HTTPS。

- **[台灣發票 QR 格式變異]** → 不同時期、不同廠商的發票 QR 格式可能有細微差異。緩解：qr_parser 加入容錯處理，保留 `raw_qr_left/right` 原始字串供除錯。

- **[SQLite 並發限制]** → POC 單人使用不成問題，多人同時上傳可能有寫入衝突。緩解：POC 階段接受此限制，記錄為已知限制。

- **[Excel 匯出記憶體]** → 大量發票時 openpyxl 在記憶體中建立 workbook 可能較慢。緩解：POC 階段資料量小，可接受；未來可改串流輸出。

## Migration Plan

本次為全新建立，無既有系統需遷移：

1. 建立 `backend/` 結構，執行 `alembic upgrade head` 初始化 SQLite schema
2. 建立 `frontend/` 結構，`npm install` 安裝相依
3. 設定 `.env`（Gemma endpoint URL、API key）
4. 啟動 `uvicorn app.main:app --reload`（後端）+ `npm run dev`（前端）
5. 驗證：執行 `backend/scripts/test_gemma_connection.py` 確認 endpoint 連線

**Rollback**：POC 階段無生產流量，直接刪除資料夾即可回復。

## Open Questions

- Gemma 4 endpoint 的實際 URL、API key 格式、model name 需向基礎設施團隊確認（目前以 `.env` 設定預留）
- 是否需要支援批次上傳（一次多張發票）？POC 階段先以單張為主
- 匯出 Excel 的欄位與格式是否需要對應特定報帳系統的模板？
