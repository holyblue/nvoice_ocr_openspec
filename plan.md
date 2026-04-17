
# 台灣電子發票辨識與分類 Web App — 實作計畫

## Context
使用者要建立一個 POC 等級的台灣電子發票辨識分類系統，主要用途為公司報帳費用管理。前端用 React，後端用 Python (FastAPI)，OCR 使用內部 Gemma 4 vision endpoint。不串財政部 API，僅由圖片 / QR code / barcode 取得資訊。

---

## 需求摘要

| 項目 | 決定 |
|------|------|
| 平台 | Web App |
| 前端 | React + Vite + TypeScript + TailwindCSS |
| 後端 | Python FastAPI + SQLite |
| OCR/AI | 內部 Gemma 4 endpoint (OpenAI-compat API) |
| 輸入 | 相機拍照 + QR code 掃描 + barcode 掃描，一起送後端 |
| 分類來源 | 會計提供 CSV 規則 → 程式判斷 → LLM fallback → 使用者確認 |
| 儲存 | SQLite + 本機圖片資料夾 |
| 授權 | 無（POC，無需登入） |
| 報帳功能 | 頁面顯示、匯出 Excel/CSV、發票團包管理 |

---

## 專案目錄結構

```
invoice_ocr/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, lifespan
│   │   ├── config.py             # Pydantic BaseSettings (Gemma endpoint URL, etc.)
│   │   ├── database.py           # SQLAlchemy engine + session factory
│   │   ├── models/
│   │   │   ├── invoice.py        # Invoice, InvoiceItem ORM
│   │   │   ├── bundle.py         # Bundle ORM
│   │   │   └── category.py       # Category, CategoryRule ORM
│   │   ├── schemas/
│   │   │   ├── invoice.py        # ScanRequest, InvoiceResponse, ClassificationSuggestion
│   │   │   ├── bundle.py
│   │   │   └── category.py
│   │   ├── routers/
│   │   │   ├── invoices.py       # POST /scan, CRUD
│   │   │   ├── bundles.py        # CRUD + add/remove invoices
│   │   │   ├── categories.py     # CSV import, CRUD
│   │   │   └── export.py         # GET Excel/CSV
│   │   ├── services/
│   │   │   ├── ocr_pipeline.py   # 主流程協調
│   │   │   ├── qr_parser.py      # 台灣電子發票 QR code 解析
│   │   │   ├── barcode_parser.py # 紙本發票 3 條碼解析
│   │   │   ├── gemma_client.py   # OpenAI-compat 呼叫 Gemma 4
│   │   │   ├── classifier.py     # 規則比對 + LLM fallback
│   │   │   └── exporter.py       # openpyxl / csv 匯出
│   │   └── utils/
│   │       └── image_utils.py    # Base64, resize, validate
│   ├── storage/uploads/          # 發票圖片（gitignore）
│   ├── data/categories.csv       # 會計分類規則
│   ├── requirements.txt
│   └── alembic/                  # DB migration
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Routes
│   │   ├── api/                  # axios client + typed API calls
│   │   ├── components/
│   │   │   ├── scanner/          # CameraCapture, QRScanner, BarcodeScanner, ScanBundle
│   │   │   ├── invoice/          # InvoiceCard, InvoiceDetail, InvoiceForm, ItemsTable
│   │   │   ├── classification/   # CategorySelector（含 AI 建議 badge）
│   │   │   ├── bundle/           # BundleList, BundleDetail
│   │   │   └── shared/           # StatusBadge, ConfidenceBadge
│   │   ├── pages/
│   │   │   ├── ScanPage.tsx      # 主要掃描流程（4 步驟 wizard）
│   │   │   ├── InvoicesPage.tsx  # 發票清單 + 篩選
│   │   │   ├── InvoiceDetailPage.tsx
│   │   │   ├── BundlesPage.tsx
│   │   │   ├── BundleDetailPage.tsx
│   │   │   └── SettingsPage.tsx  # 上傳分類 CSV
│   │   ├── stores/               # Zustand (invoiceStore, bundleStore)
│   │   ├── hooks/                # useCamera, useScanner
│   │   └── types/index.ts        # 共用 TypeScript 介面
│   ├── package.json
│   └── vite.config.ts
└── .env.example
```

---

## 資料模型

### Invoice（核心）
```
id, invoice_number, random_code, purchase_date
seller_name, seller_tax_id, buyer_tax_id
amount_untaxed, tax_amount, total_amount
verify_code, encrypted_data
category_id (FK), classification_source (rule|llm|manual), classification_confidence
status (pending|confirmed|rejected)
bundle_id (FK)
raw_qr_left, raw_qr_right, raw_barcode  -- 保留原始字串
image_path
created_at, updated_at
```

### InvoiceItem
```
id, invoice_id (FK), item_name, quantity, unit_price, subtotal
source (qr_right|ocr)
```

### Bundle
```
id, name, description, period_start, period_end
status (open|submitted|archived)
```

### Category + CategoryRule
```
Category: id, code, name, account_code
CategoryRule: id, category_id (FK), rule_type, rule_value, priority
rule_type: seller_name_contains | seller_tax_id | item_name_contains | amount_range
```

### CSV 格式（會計上傳）
```csv
category_code,category_name,account_code,rule_type,rule_value,priority
MEALS,餐費,5161,seller_name_contains,餐廳,10
TRAVEL,差旅費,5131,seller_tax_id,12345678,100
```

---

## API Endpoints

### `/api/v1/invoices`
- `POST /scan` — 接收 `{image_base64, qr_left, qr_right, barcode_raw}`，跑 OCR pipeline，返回 InvoiceResponse
- `GET /` — 查詢清單（支援 bundle_id, status, category_id, date_from, date_to, page, size）
- `GET /{id}` — 單一發票含品項
- `PUT /{id}` — 使用者確認 / 修改欄位
- `DELETE /{id}`
- `POST /{id}/classify` — 重新分類
- `GET /{id}/image` — 取得圖片

### `/api/v1/bundles`
- CRUD + `POST /{id}/invoices`（加入發票）、`DELETE /{id}/invoices/{inv_id}`

### `/api/v1/categories`
- `POST /import` — 上傳 CSV，upsert categories + rules
- CRUD

### `/api/v1/export`
- `GET /bundle/{id}/excel`
- `GET /bundle/{id}/csv`
- `GET /invoices/excel`（同查詢參數）

---

## OCR / AI Pipeline（`ocr_pipeline.py`）

```
ScanRequest {image_base64, qr_left, qr_right, barcode_raw}
     │
     ├─ Step 1: qr_parser.parse_qr_left(qr_left)
     │          → invoice_no, date(ROC→西元), random_code, amounts, tax IDs
     │
     ├─ Step 2: qr_parser.parse_qr_right(qr_right)
     │          → List[InvoiceItem]（品名:數量:單價，** 分隔）
     │
     ├─ Step 3: barcode_parser.parse_barcodes(barcode_raw)
     │          → 紙本發票 fallback 欄位
     │
     ├─ Step 4: gemma_client.extract_from_image(image_b64, hint=qr_data)
     │          → 補足 seller_name（QR 無此欄位）
     │          → 若無 QR right → 從圖片取得品項
     │
     ├─ Step 5: merge_sources() — 優先順序
     │          QR > OCR > barcode
     │          seller_name 僅 OCR
     │
     └─ Step 6: classifier.classify(merged)
                → Phase 1: 規則比對（priority 排序，seller_tax_id exact match 加權）
                → Phase 2: LLM fallback（規則無匹配或 confidence < 0.5）
                → 返回 ClassificationSuggestion
```

**Gemma 4 Extraction Prompt 策略**：
- System prompt 說明台灣電子發票格式
- 將 QR 已知資料作為 `hint_json` 注入，避免幻覺
- 返回 JSON，若有 markdown wrapper 用 regex fallback 解析

**台灣 QR Code 格式**（左側）：
```
invoice_no:date(民國YMMDD):random_code:sales_amt:total_amt:buyer_tax_id:seller_tax_id:verify_code:encrypted
```
右側 QR：`品名:數量:單價` 每筆用 `**` 分隔

**紙本三條碼**：Code39
- 條碼1：隨機碼
- 條碼2：發票號碼 + 年月
- 條碼3：未稅額 + 稅額

---

## 分類邏輯（`classifier.py`）

1. 載入所有 CategoryRule，按 priority 降序
2. 依 rule_type 比對發票資料，累積分數
3. `seller_tax_id` 精確比對 → priority × 2 加權
4. 最高分 ≥ 0.5 信心值 → source = "rule"
5. 否則呼叫 Gemma 4 LLM，返回 category_code + confidence + 中文 reasoning
6. 前端顯示 AI 建議 badge（"規則" vs "AI建議"），使用者確認後 source = "manual"

---

## 前端關鍵元件

### `ScanPage.tsx` — 4 步驟流程
1. **Capture**：`CameraCapture`（rear camera）+ `QRScanner`（html5-qrcode）+ `BarcodeScanner`（Code39）
2. **Processing**：spinner + 即時顯示已辨識欄位
3. **Review**：`InvoiceForm`（預填資料）+ `CategorySelector`（AI 建議高亮）
4. **Save**：確認後 PUT status=confirmed，可立即加入 bundle

### `CategorySelector.tsx`
- 下拉選單顯示所有分類
- 頂端顯示 AI 建議選項（含信心百分比 + 來源 badge）
- 使用者改選後標記 source = "manual"

### `ConfidenceBadge.tsx`
- ≥ 0.8 → 綠色，0.5–0.8 → 黃色，< 0.5 → 紅色
- 規則圖示 vs AI 閃光圖示

---

## 主要套件

### Backend
```
fastapi, uvicorn[standard]
sqlalchemy, alembic
pydantic, pydantic-settings
openai          # Gemma 4 OpenAI-compat client
Pillow          # 圖片處理
openpyxl        # Excel 匯出
pandas          # CSV 處理
aiofiles        # 非同步圖片儲存
python-multipart
```

### Frontend
```
react, react-dom, react-router-dom
zustand                 # 全域狀態
axios, @tanstack/react-query
html5-qrcode            # QR + barcode 掃描
react-hook-form + zod   # 表單驗證
@tanstack/react-table   # 發票清單
tailwindcss, @headlessui/react, lucide-react
date-fns, react-hot-toast
```

---

## 驗證計畫

### 後端單元測試
- `test_qr_parser.py`：測試 ROC 日期轉換、B2C 發票（買方統編=0000000000）
- `test_barcode_parser.py`：測試紙本三條碼
- `test_classifier.py`：規則命中、LLM fallback（mock gemma_client）
- `test_ocr_pipeline.py`：QR 優先於 OCR 的 merge 邏輯

### API 整合測試
- `test_api_invoices.py`：完整掃描流程 → 確認 → 查詢
- 分類 CSV 上傳 → 規則載入 → 掃描觸發規則分類

### E2E 驗證清單
1. 真實發票雙 QR 掃描 → 所有欄位正確（含金額、日期）
2. 遮住 QR → OCR 仍能取得賣家名稱
3. 上傳 CSV → 掃描命中規則 → source="rule"
4. 無規則命中 → source="llm"，有中文 reasoning
5. 建立 bundle → 加入 3 張發票 → 匯出 Excel → 金額加總正確
6. 重複發票（同號碼+隨機碼）→ 返回 409 或重複警告
7. 行動瀏覽器（iOS Safari/Android Chrome）相機可正常開啟後鏡頭

### Gemma 4 連線測試腳本
`backend/scripts/test_gemma_connection.py` — 驗證 endpoint 連線，並以已知發票圖片比對萃取結果
