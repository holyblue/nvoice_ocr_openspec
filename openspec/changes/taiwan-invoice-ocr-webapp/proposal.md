## Why

公司報帳流程仰賴人工手動輸入發票資訊，耗時且容易出錯。本系統建立一套 POC 等級的台灣電子發票辨識與分類 Web App，透過相機拍照、QR code 掃描、條碼掃描自動擷取發票資料，並依照會計提供的規則自動分類，大幅降低人工輸入的工時與錯誤率。

## What Changes

- 建立全新的 Web App（React + FastAPI），支援台灣電子發票拍照辨識與自動分類
- 新增 OCR pipeline：整合 QR code 解析、條碼解析、Gemma 4 Vision OCR，並以 QR > OCR > barcode 優先順序合併資料
- 新增費用分類引擎：支援 CSV 規則匯入、規則比對分類，以及 LLM fallback 分類
- 新增發票團包（Bundle）管理：將多張發票組成一批報帳單，並支援匯出 Excel/CSV
- 新增設定頁面：允許會計上傳分類規則 CSV

## Capabilities

### New Capabilities

- `invoice-scanning`: 相機拍照 + QR code 掃描 + 紙本三條碼掃描，送後端做 OCR pipeline 處理，回傳結構化發票資料
- `invoice-management`: 發票 CRUD、狀態管理（pending/confirmed/rejected）、發票清單篩選與詳細頁面
- `expense-classification`: 依據會計 CSV 規則自動分類，規則未命中時使用 Gemma 4 LLM fallback，前端顯示 AI 建議 badge 並由使用者確認
- `bundle-management`: 建立報帳發票團包（Bundle）、加入/移除發票、Bundle 狀態管理（open/submitted/archived）
- `data-export`: 按 Bundle 或查詢條件匯出發票明細為 Excel 或 CSV，供報帳使用
- `category-settings`: 會計人員上傳分類規則 CSV，系統 upsert 分類與規則資料

### Modified Capabilities

（無既有 spec，本次為全新建立）

## Impact

- **新增後端**：FastAPI 應用，SQLite 儲存，OpenAI-compat 呼叫內部 Gemma 4 Vision endpoint
- **新增前端**：React + Vite + TypeScript + TailwindCSS，無需登入（POC）
- **外部相依**：內部 Gemma 4 Vision endpoint（OpenAI-compat 格式），無需串接財政部 API
- **儲存**：SQLite 資料庫 + 本機圖片資料夾（`backend/storage/uploads/`）
- **套件新增**：fastapi、sqlalchemy、alembic、openai、openpyxl、pandas、html5-qrcode、zustand、@tanstack/react-query 等
