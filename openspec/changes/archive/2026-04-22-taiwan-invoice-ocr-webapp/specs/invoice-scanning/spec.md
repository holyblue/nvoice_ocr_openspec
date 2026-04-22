## ADDED Requirements

### Requirement: 相機拍照擷取發票圖片
系統 SHALL 允許使用者透過瀏覽器相機 API 拍攝發票圖片，優先開啟後鏡頭（`facingMode: environment`），並在前端將圖片轉為 base64 格式供後續處理。

#### Scenario: 成功開啟相機
- **WHEN** 使用者進入掃描頁面
- **THEN** 系統 SHALL 請求相機權限，並顯示即時預覽畫面（後鏡頭優先）

#### Scenario: 拍照後預覽
- **WHEN** 使用者按下拍照按鈕
- **THEN** 系統 SHALL 顯示所拍攝的圖片預覽，並提供重拍選項

#### Scenario: 相機權限被拒
- **WHEN** 使用者拒絕相機權限
- **THEN** 系統 SHALL 顯示錯誤提示，並允許使用者改以上傳圖片檔案方式繼續

### Requirement: QR code 掃描
系統 SHALL 支援掃描台灣電子發票的左側及右側 QR code，並將原始字串傳送至後端解析。

#### Scenario: 成功掃描左側 QR code
- **WHEN** 使用者對準發票左側 QR code 進行掃描
- **THEN** 系統 SHALL 解讀 QR code 內容，並於介面顯示「左側 QR 已讀取」狀態

#### Scenario: 成功掃描右側 QR code
- **WHEN** 使用者對準發票右側 QR code 進行掃描
- **THEN** 系統 SHALL 解讀 QR code 內容，並於介面顯示「右側 QR 已讀取」狀態

#### Scenario: QR code 無法辨識
- **WHEN** QR code 模糊或損毀無法讀取
- **THEN** 系統 SHALL 允許使用者略過此步驟，以其他方式（條碼或純 OCR）繼續流程

### Requirement: 紙本發票條碼掃描
系統 SHALL 支援掃描紙本發票的三條 Code39 條碼，並將原始字串傳送至後端解析。

#### Scenario: 成功掃描三條碼
- **WHEN** 使用者掃描紙本發票的條碼區域
- **THEN** 系統 SHALL 讀取條碼內容，並顯示「條碼已讀取」狀態

#### Scenario: 條碼掃描為可選步驟
- **WHEN** 使用者已有 QR code 資料，略過條碼掃描
- **THEN** 系統 SHALL 允許繼續流程，條碼欄位留空

### Requirement: 發票資料送後端辨識
系統 SHALL 將圖片 base64、左側 QR 原始字串、右側 QR 原始字串、條碼原始字串組合為 `ScanRequest`，透過 `POST /api/v1/invoices/scan` 送至後端處理。

#### Scenario: 完整資料送出
- **WHEN** 使用者完成拍照及掃描後送出
- **THEN** 系統 SHALL 以 `{image_base64, qr_left, qr_right, barcode_raw}` 格式呼叫後端 API，並顯示處理中狀態

#### Scenario: 僅圖片無 QR 送出
- **WHEN** 使用者只有圖片，無 QR code 及條碼資料
- **THEN** 系統 SHALL 允許僅以圖片送出，後端以純 OCR 模式處理

### Requirement: OCR Pipeline 資料合併
後端 SHALL 依照 QR > OCR > 條碼的優先順序合併發票資料，並保留原始字串於資料庫。

#### Scenario: QR 資料優先使用
- **WHEN** 左側 QR 解析成功，包含發票號碼、金額、統編等欄位
- **THEN** 系統 SHALL 以 QR 資料為主，OCR 僅補充 QR 沒有的「賣家名稱」欄位

#### Scenario: OCR 補足賣家名稱
- **WHEN** QR 解析成功但賣家名稱為空
- **THEN** 系統 SHALL 呼叫 Gemma 4 Vision 從圖片萃取賣家名稱

#### Scenario: 無 QR 時改以 OCR 取得品項
- **WHEN** 右側 QR 無法解析，發票含品項明細
- **THEN** 系統 SHALL 呼叫 Gemma 4 Vision 從圖片辨識品項名稱、數量、單價

#### Scenario: 重複發票偵測
- **WHEN** 送出的發票號碼與隨機碼和資料庫中既有紀錄完全相符
- **THEN** 系統 SHALL 返回 HTTP 409，並提示使用者此發票已存在

### Requirement: 台灣電子發票 QR 格式解析
後端 SHALL 正確解析台灣電子發票左側 QR code 格式（`發票號碼:民國日期:隨機碼:未稅額:總額:買方統編:賣方統編:驗證碼:加密資料`），並將民國年份轉換為西元年份。

#### Scenario: 標準格式左側 QR 解析
- **WHEN** 後端收到格式正確的左側 QR 字串
- **THEN** 系統 SHALL 正確解析所有欄位，並將民國日期（如 `1130315`）轉換為西元日期（`2024-03-15`）

#### Scenario: B2C 發票買方統編為零
- **WHEN** 左側 QR 的買方統編欄位為 `0000000000`
- **THEN** 系統 SHALL 將 `buyer_tax_id` 儲存為空值或 null，不報錯

#### Scenario: 右側 QR 品項解析
- **WHEN** 後端收到右側 QR 字串（格式：`品名:數量:單價**品名:數量:單價`）
- **THEN** 系統 SHALL 正確解析每個品項，並建立 `InvoiceItem` 清單
