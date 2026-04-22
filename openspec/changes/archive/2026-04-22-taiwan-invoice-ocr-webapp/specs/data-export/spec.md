## ADDED Requirements

### Requirement: 按 Bundle 匯出 Excel
系統 SHALL 提供按 Bundle 匯出 Excel 的功能，每個 Bundle 一個 Excel 檔案，包含發票清單及金額加總。

#### Scenario: 成功匯出 Bundle Excel
- **WHEN** 使用者在 Bundle 詳細頁面點擊「匯出 Excel」
- **THEN** 系統 SHALL 呼叫 `GET /api/v1/export/bundle/{id}/excel`，瀏覽器下載 `.xlsx` 檔案，檔名格式為 `bundle_{名稱}_{日期}.xlsx`

#### Scenario: Excel 內容正確性
- **WHEN** 使用者開啟匯出的 Excel 檔案
- **THEN** 檔案 SHALL 包含：發票號碼、日期、賣家名稱、賣方統編、未稅額、稅額、總金額、費用分類、狀態，最後一列為金額加總

#### Scenario: 空 Bundle 匯出
- **WHEN** Bundle 內沒有任何發票，使用者點擊匯出
- **THEN** 系統 SHALL 仍產生 Excel 檔案，僅含欄位標頭與空白資料列

### Requirement: 按 Bundle 匯出 CSV
系統 SHALL 提供按 Bundle 匯出 CSV 的功能，格式與 Excel 欄位一致。

#### Scenario: 成功匯出 Bundle CSV
- **WHEN** 使用者在 Bundle 詳細頁面點擊「匯出 CSV」
- **THEN** 系統 SHALL 呼叫 `GET /api/v1/export/bundle/{id}/csv`，瀏覽器下載 `.csv` 檔案，編碼為 UTF-8 with BOM（確保 Excel 開啟中文不亂碼）

### Requirement: 依查詢條件匯出 Excel
系統 SHALL 提供依篩選條件（日期範圍、分類、狀態等）匯出發票清單為 Excel 的功能，不限於特定 Bundle。

#### Scenario: 依日期範圍匯出
- **WHEN** 使用者在發票清單頁面設定篩選條件後點擊「匯出 Excel」
- **THEN** 系統 SHALL 呼叫 `GET /api/v1/export/invoices/excel`（帶同樣的查詢參數），下載符合條件的發票 Excel

#### Scenario: 匯出包含品項明細
- **WHEN** 使用者勾選「包含品項明細」選項後匯出
- **THEN** Excel SHALL 包含額外的品項明細工作表（Sheet），每筆品項一列

### Requirement: 匯出檔案格式規範
匯出的 Excel/CSV 檔案 SHALL 符合以下欄位規範，確保報帳系統可正確匯入。

#### Scenario: 日期格式
- **WHEN** Excel 或 CSV 包含日期欄位
- **THEN** 日期 SHALL 以 `YYYY-MM-DD` 格式呈現（西元年）

#### Scenario: 金額格式
- **WHEN** Excel 或 CSV 包含金額欄位
- **THEN** 金額 SHALL 以純數字（整數或小數）呈現，不含貨幣符號或千分位符號

#### Scenario: 費用分類欄位
- **WHEN** 發票有對應的費用分類
- **THEN** 匯出欄位 SHALL 同時包含 `category_code`（如 `MEALS`）與 `category_name`（如 `餐費`）
