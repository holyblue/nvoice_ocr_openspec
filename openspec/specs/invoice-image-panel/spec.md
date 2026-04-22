## Purpose
在發票上傳審核與編輯頁面中，以左右並排版面顯示完整發票照片，便於使用者與 OCR 辨識結果比對。

## Requirements

### Requirement: 掃描審核步驟顯示完整發票照片
ScanPage 的 review 步驟 SHALL 在表單左側顯示完整的發票照片（`draft.imageBase64`），使用者 MUST 能在不捲動的情況下同時看到照片與表單欄位。

#### Scenario: 有圖片時顯示左右並排版面
- **WHEN** 步驟為 review 且 `draft.imageBase64` 有值
- **THEN** 頁面以兩欄 Grid 排列：左欄顯示發票照片，右欄顯示 InvoiceForm
- **AND** 照片使用 `object-contain` 完整顯示，不裁切發票本體

#### Scenario: 無圖片時僅顯示表單
- **WHEN** 步驟為 review 且 `draft.imageBase64` 為空字串
- **THEN** 頁面僅顯示 InvoiceForm，不顯示圖片欄

#### Scenario: 行動裝置版面退化
- **WHEN** 視窗寬度小於 768px（Tailwind `md` 斷點以下）
- **THEN** 版面改為垂直堆疊：照片在上，表單在下

### Requirement: 發票詳細頁顯示完整發票照片於側欄
InvoiceDetailPage SHALL 將發票照片置於表單左側，並以兩欄 Grid 並排，使使用者 MUST 能同時對照照片與編輯表單。

#### Scenario: 有圖片時顯示左右並排版面
- **WHEN** `invoice.image_path` 有值
- **THEN** 頁面以兩欄 Grid 排列：左欄顯示發票照片，右欄顯示操作按鈕與 InvoiceForm
- **AND** 照片使用 `object-contain` 完整顯示，不裁切

#### Scenario: 無圖片時維持單欄版面
- **WHEN** `invoice.image_path` 為空或 undefined
- **THEN** 頁面維持單欄版面，操作按鈕與 InvoiceForm 正常顯示

#### Scenario: 行動裝置版面退化
- **WHEN** 視窗寬度小於 768px
- **THEN** 版面改為垂直堆疊：照片在上，表單在下

### Requirement: 圖片欄位 sticky 定位
桌面版（md 以上）的圖片欄 SHALL 採用 `sticky` 定位，使圖片在使用者捲動右側表單時保持可見。

#### Scenario: 捲動表單時照片保持可見
- **WHEN** 使用者捲動頁面至表單下方區域（桌面版）
- **THEN** 左欄發票照片仍固定顯示在視口頂部附近，不隨頁面捲動消失

### Requirement: 版面寬度放寬以容納兩欄
兩欄版面的外層容器 SHALL 放寬至 `max-w-5xl`（或同等寬度），確保圖片欄有足夠寬度顯示發票。

#### Scenario: 桌面版兩欄有足夠空間
- **WHEN** 視窗寬度大於等於 768px
- **THEN** 頁面容器寬度允許圖片欄至少顯示 300px 有效寬度
