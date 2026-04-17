# 台灣電子發票 OCR Web App

一套 POC 等級的台灣電子發票辨識與分類系統，透過相機拍照、QR code 掃描、條碼掃描自動擷取發票資料，並依照會計規則自動分類，大幅降低人工輸入的工時與錯誤率。

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| 後端 | FastAPI + SQLAlchemy + Alembic + SQLite |
| OCR | 內部 Gemma 4 Vision（OpenAI-compat endpoint） |
| 狀態管理 | Zustand（前端暫態）+ TanStack Query（伺服器資料） |
| 套件管理 | `uv`（後端）、`npm`（前端） |

### 資料流

```
Browser → Vite dev server (/api proxy) → FastAPI (port 8000) → SQLite
```

## 功能一覽

- **發票掃描**：相機拍照 + QR code 雙碼解析 + 紙本三條碼掃描，OCR pipeline 合併資料（優先順序：QR > OCR > 條碼）
- **費用分類**：規則比對引擎（CSV 匯入），信心度不足時自動 fallback 至 Gemma LLM 分類
- **發票管理**：CRUD 操作、狀態流程（pending / confirmed / rejected）、清單篩選與詳細頁
- **報帳團包（Bundle）**：將多張發票組成一批報帳單，管理 open / submitted / archived 狀態
- **資料匯出**：按 Bundle 或條件匯出發票明細為 Excel / CSV
- **分類設定**：會計人員上傳分類規則 CSV，系統自動 upsert

## 環境需求

- Python ≥ 3.14
- Node.js ≥ 20
- `uv`（[安裝說明](https://docs.astral.sh/uv/getting-started/installation/)）
- 可存取的 Gemma 4 Vision endpoint（OpenAI-compat 格式）

## 快速開始

### 1. 複製專案

```bash
git clone <repo-url>
cd invoice_ocr_openspec
```

### 2. 設定後端

```bash
cd backend
cp .env.example .env
# 編輯 .env，填入 GEMMA_ENDPOINT_URL 與 GEMMA_API_KEY
```

安裝依賴並套用資料庫 migration：

```bash
uv run alembic upgrade head
```

啟動 API server（port 8000）：

```bash
uv run uvicorn app.main:app --reload
```

### 3. 設定前端

```bash
cd frontend
npm install
npm run dev   # 啟動 Vite dev server（port 5173）
```

開啟瀏覽器前往 `http://localhost:5173`。

## 環境變數

後端設定透過 `backend/.env`（參考 `.env.example`）：

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `GEMMA_ENDPOINT_URL` | `http://localhost:8080/v1` | OpenAI-compat Vision endpoint |
| `GEMMA_API_KEY` | `dummy` | API 金鑰 |
| `GEMMA_MODEL_NAME` | `gemma4` | 發送給 endpoint 的模型名稱 |
| `DATABASE_URL` | `sqlite:///./invoice_ocr.db` | SQLAlchemy 連線字串 |
| `UPLOAD_DIR` | `storage/uploads` | 發票圖片儲存路徑 |

## API 端點

Base path：`/api/v1`

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/invoices/scan` | 上傳圖片 + QR/條碼資料，執行 OCR pipeline |
| `GET` | `/invoices` | 查詢發票清單 |
| `GET` | `/invoices/{id}` | 取得發票詳細資料 |
| `PATCH` | `/invoices/{id}` | 更新發票（確認分類等） |
| `DELETE` | `/invoices/{id}` | 刪除發票 |
| `GET` | `/bundles` | 查詢 Bundle 清單 |
| `POST` | `/bundles` | 建立 Bundle |
| `PATCH` | `/bundles/{id}` | 更新 Bundle 狀態 |
| `POST` | `/bundles/{id}/invoices` | 加入發票至 Bundle |
| `DELETE` | `/bundles/{id}/invoices/{invoice_id}` | 從 Bundle 移除發票 |
| `GET` | `/categories` | 查詢分類清單 |
| `POST` | `/categories/import` | 上傳分類規則 CSV |
| `GET` | `/export/bundles/{id}` | 匯出 Bundle 為 Excel/CSV |
| `GET` | `/health` | 健康檢查 |

## 測試

```bash
cd backend

# 執行全部測試
uv run pytest

# 執行單一測試檔
uv run pytest tests/test_qr_parser.py

# 依測試名稱篩選
uv run pytest -k "test_parse_qr_left"
```

測試使用 in-memory SQLite（`StaticPool`），Gemma 呼叫一律以 `AsyncMock` mock 掉，不需要真實 endpoint。

## 資料庫 Migration

```bash
cd backend

# 套用所有 migration
uv run alembic upgrade head

# 建立新 migration
uv run alembic revision --autogenerate -m "描述"
```

## 前端型別檢查與建置

```bash
cd frontend

npx tsc --noEmit   # 僅型別檢查
npm run build      # 型別檢查 + 生產建置
```

## 專案結構

```
invoice_ocr_openspec/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口，掛載所有 router
│   │   ├── config.py            # 設定（pydantic-settings）
│   │   ├── database.py          # SQLAlchemy engine + get_db
│   │   ├── models/              # SQLAlchemy ORM 模型
│   │   ├── routers/             # API 路由（invoices / bundles / categories / export）
│   │   ├── schemas/             # Pydantic request/response schema
│   │   └── services/
│   │       ├── ocr_pipeline.py  # OCR 主流程（QR → Gemma → 條碼合併）
│   │       ├── classifier.py    # 分類引擎（規則比對 + LLM fallback）
│   │       ├── gemma_client.py  # Gemma Vision API 封裝
│   │       ├── qr_parser.py     # 台灣電子發票 QR 解析
│   │       └── barcode_parser.py
│   ├── alembic/                 # DB migration
│   └── tests/
└── frontend/
    └── src/
        ├── pages/               # ScanPage / InvoicesPage / BundlesPage / ...
        ├── components/          # 可複用 UI 元件
        ├── stores/              # Zustand stores（invoiceStore / bundleStore）
        ├── api/                 # TanStack Query + axios API 層
        └── types/               # 共用 TypeScript 型別
```

## 注意事項

- 本系統為 **POC 等級**，無使用者驗證機制，請勿直接暴露於公開網路。
- 圖片儲存於本機 `backend/storage/uploads/`，正式環境請替換為物件儲存（S3 等）。
- SQLite 適合 POC；正式環境建議替換為 PostgreSQL，僅需修改 `DATABASE_URL`。
