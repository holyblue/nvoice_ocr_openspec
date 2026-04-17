## 1. 專案初始化與基礎建設

- [x] 1.1 建立後端目錄結構（`backend/app/`、`models/`、`schemas/`、`routers/`、`services/`、`utils/`）
- [x] 1.2 建立 `backend/requirements.txt`，加入所有相依套件（fastapi、uvicorn、sqlalchemy、alembic、openai、Pillow、openpyxl、pandas、aiofiles、python-multipart、pydantic-settings）
- [x] 1.3 建立 `backend/app/config.py`（Pydantic BaseSettings：Gemma endpoint URL、API key、model name）
- [x] 1.4 建立 `backend/app/database.py`（SQLAlchemy engine、session factory、Base）
- [x] 1.5 初始化 Alembic（`alembic init alembic`），設定 `alembic.ini` 連接 SQLite
- [x] 1.6 建立前端專案（`npm create vite@latest frontend -- --template react-ts`）
- [x] 1.7 安裝前端相依套件（zustand、axios、@tanstack/react-query、html5-qrcode、react-hook-form、zod、@tanstack/react-table、tailwindcss、@headlessui/react、lucide-react、date-fns、react-hot-toast、react-router-dom）
- [x] 1.8 設定 TailwindCSS（`tailwind.config.ts`、`postcss.config.js`）
- [x] 1.9 建立 `.env.example`（GEMMA_ENDPOINT_URL、GEMMA_API_KEY、GEMMA_MODEL_NAME）

## 2. 後端資料模型與資料庫遷移

- [x] 2.1 建立 `backend/app/models/category.py`（Category、CategoryRule ORM 模型）
- [x] 2.2 建立 `backend/app/models/invoice.py`（Invoice、InvoiceItem ORM 模型，含所有欄位）
- [x] 2.3 建立 `backend/app/models/bundle.py`（Bundle ORM 模型）
- [x] 2.4 建立 Alembic 遷移腳本，產生初始 schema
- [x] 2.5 執行 `alembic upgrade head` 驗證 SQLite 資料庫建立成功

## 3. 後端 Pydantic Schemas

- [x] 3.1 建立 `backend/app/schemas/invoice.py`（ScanRequest、InvoiceResponse、InvoiceUpdate、ClassificationSuggestion）
- [x] 3.2 建立 `backend/app/schemas/bundle.py`（BundleCreate、BundleUpdate、BundleResponse）
- [x] 3.3 建立 `backend/app/schemas/category.py`（CategoryResponse、CategoryRuleResponse、CategoryImportResult）

## 4. OCR Pipeline 核心服務

- [x] 4.1 建立 `backend/app/services/qr_parser.py`：實作 `parse_qr_left()`（解析台灣電子發票左側 QR，含民國→西元日期轉換、B2C 買方統編為零處理）
- [x] 4.2 實作 `parse_qr_right()`（解析右側 QR 品項，`**` 分隔，`品名:數量:單價` 格式）
- [x] 4.3 建立 `backend/app/services/barcode_parser.py`：實作 `parse_barcodes()`（紙本三條碼 Code39 解析）
- [x] 4.4 建立 `backend/app/services/gemma_client.py`：實作 `extract_from_image()`（呼叫 Gemma 4 Vision endpoint，含 `hint_json` 注入、markdown wrapper regex fallback）
- [x] 4.5 建立 `backend/app/utils/image_utils.py`（base64 驗證、圖片 resize、格式驗證）
- [x] 4.6 建立 `backend/app/services/ocr_pipeline.py`：實作 `run_pipeline()`（串接 QR 解析 → 條碼解析 → Gemma OCR → 資料合併，QR > OCR > barcode 優先順序）
- [x] 4.7 建立 `backend/scripts/test_gemma_connection.py`（驗證 Gemma endpoint 連線測試腳本）

## 5. 分類引擎服務

- [x] 5.1 建立 `backend/app/services/classifier.py`：實作規則比對邏輯（載入 CategoryRule，依 priority 降序排列，`seller_tax_id` 精確比對 priority × 2 加權）
- [x] 5.2 實作 LLM fallback 分類（信心值 < 0.5 時呼叫 Gemma 4，解析返回 JSON 含 `category_code`、`confidence`、中文 `reasoning`）
- [x] 5.3 實作 `classify()` 主函式（整合規則分類 + LLM fallback，返回 ClassificationSuggestion）

## 6. 匯出服務

- [x] 6.1 建立 `backend/app/services/exporter.py`：實作 `export_bundle_excel()`（openpyxl，含欄位標頭、資料列、金額加總列）
- [x] 6.2 實作 `export_bundle_csv()`（UTF-8 with BOM，欄位同 Excel）
- [x] 6.3 實作 `export_invoices_excel()`（依查詢條件匯出，支援可選品項明細工作表）

## 7. 後端 API Routers

- [x] 7.1 建立 `backend/app/routers/invoices.py`：`POST /scan`（呼叫 OCR pipeline，儲存發票，偵測重複發票返回 409）
- [x] 7.2 實作 `GET /` 發票查詢（支援 bundle_id、status、category_id、date_from、date_to、page、size 查詢參數）
- [x] 7.3 實作 `GET /{id}`、`PUT /{id}`（使用者確認/修改）、`DELETE /{id}`（含刪除圖片）、`POST /{id}/classify`、`GET /{id}/image`
- [x] 7.4 建立 `backend/app/routers/bundles.py`：CRUD + `POST /{id}/invoices`、`DELETE /{id}/invoices/{inv_id}`（含 Bundle 狀態鎖定驗證）
- [x] 7.5 建立 `backend/app/routers/categories.py`：`POST /import`（CSV upsert）、CRUD（含刪除時清除發票關聯）
- [x] 7.6 建立 `backend/app/routers/export.py`：`GET /bundle/{id}/excel`、`GET /bundle/{id}/csv`、`GET /invoices/excel`
- [x] 7.7 建立 `backend/app/main.py`（FastAPI app、CORS、lifespan、掛載所有 routers、`/api/v1` 前綴）

## 8. 後端單元測試

- [x] 8.1 建立 `backend/tests/test_qr_parser.py`（民國日期轉換、B2C 統編為零、右側 QR 品項解析）
- [x] 8.2 建立 `backend/tests/test_barcode_parser.py`（紙本三條碼解析）
- [x] 8.3 建立 `backend/tests/test_classifier.py`（規則命中、LLM fallback、mock gemma_client）
- [x] 8.4 建立 `backend/tests/test_ocr_pipeline.py`（QR 優先於 OCR 的 merge 邏輯）
- [x] 8.5 建立 `backend/tests/test_api_invoices.py`（完整掃描流程整合測試）

## 9. 前端基礎結構

- [x] 9.1 建立 `frontend/src/types/index.ts`（Invoice、InvoiceItem、Bundle、Category、CategoryRule、ClassificationSuggestion、ScanRequest 等 TypeScript 介面）
- [x] 9.2 建立 `frontend/src/api/client.ts`（axios 實例，設定 baseURL 指向後端）
- [x] 9.3 建立 `frontend/src/api/invoices.ts`、`api/bundles.ts`、`api/categories.ts`、`api/export.ts`（型別化 API 呼叫函式）
- [x] 9.4 建立 `frontend/src/stores/invoiceStore.ts`（Zustand，管理目前掃描中的發票草稿狀態）
- [x] 9.5 建立 `frontend/src/stores/bundleStore.ts`（Zustand，管理目前選取的 Bundle）
- [x] 9.6 設定 `frontend/src/App.tsx`（react-router-dom Routes，各頁面路由）

## 10. 前端掃描元件

- [x] 10.1 建立 `frontend/src/hooks/useCamera.ts`（封裝 getUserMedia，後鏡頭優先，含錯誤處理）
- [x] 10.2 建立 `frontend/src/components/scanner/CameraCapture.tsx`（相機預覽、拍照、重拍功能）
- [x] 10.3 建立 `frontend/src/components/scanner/QRScanner.tsx`（html5-qrcode 整合，掃描左右側 QR）
- [x] 10.4 建立 `frontend/src/components/scanner/BarcodeScanner.tsx`（html5-qrcode Code39 掃描）
- [x] 10.5 建立 `frontend/src/pages/ScanPage.tsx`（4 步驟 wizard：Capture → Processing → Review → Save）

## 11. 前端發票元件

- [x] 11.1 建立 `frontend/src/components/shared/StatusBadge.tsx`（pending/confirmed/rejected 狀態標籤）
- [x] 11.2 建立 `frontend/src/components/shared/ConfidenceBadge.tsx`（信心值色彩，≥0.8 綠、0.5–0.8 黃、<0.5 紅，規則/AI 圖示）
- [x] 11.3 建立 `frontend/src/components/classification/CategorySelector.tsx`（下拉選單，含 AI 建議高亮、信心百分比、來源 badge）
- [x] 11.4 建立 `frontend/src/components/invoice/InvoiceForm.tsx`（react-hook-form + zod，預填 OCR 資料，金額自動計算）
- [x] 11.5 建立 `frontend/src/components/invoice/ItemsTable.tsx`（品項明細表格，支援新增/刪除）
- [x] 11.6 建立 `frontend/src/components/invoice/InvoiceCard.tsx`（發票清單卡片元件）
- [x] 11.7 建立 `frontend/src/pages/InvoicesPage.tsx`（發票清單、篩選欄、@tanstack/react-table）
- [x] 11.8 建立 `frontend/src/pages/InvoiceDetailPage.tsx`（完整發票詳細資訊、圖片顯示、重新分類按鈕）

## 12. 前端 Bundle 與設定元件

- [x] 12.1 建立 `frontend/src/components/bundle/BundleList.tsx`（Bundle 清單，顯示狀態、發票數、金額加總）
- [x] 12.2 建立 `frontend/src/components/bundle/BundleDetail.tsx`（Bundle 詳細、加入/移除發票、匯出按鈕）
- [x] 12.3 建立 `frontend/src/pages/BundlesPage.tsx`（Bundle 管理頁面）
- [x] 12.4 建立 `frontend/src/pages/BundleDetailPage.tsx`（Bundle 詳細頁面）
- [x] 12.5 建立 `frontend/src/pages/SettingsPage.tsx`（CSV 上傳、分類清單顯示）

## 13. 端對端驗證

- [ ] 13.1 執行 Gemma 4 連線測試腳本，確認 endpoint 可用
- [ ] 13.2 以真實發票圖片測試雙 QR 掃描，驗證所有欄位正確（含金額、日期）
- [ ] 13.3 測試遮住 QR 的情況，確認 OCR 仍能取得賣家名稱
- [ ] 13.4 上傳分類 CSV → 掃描發票 → 確認 `classification_source = "rule"`
- [ ] 13.5 測試無規則命中情況，確認 `classification_source = "llm"` 且有中文 reasoning
- [ ] 13.6 建立 Bundle → 加入 3 張發票 → 匯出 Excel → 確認金額加總正確
- [ ] 13.7 測試重複發票（同號碼+隨機碼），確認返回 409 或重複警告
- [ ] 13.8 在 iOS Safari 及 Android Chrome 測試相機開啟（後鏡頭）
