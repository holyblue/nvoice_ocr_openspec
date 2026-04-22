## Why

用戶在上傳發票與編輯發票時，無法看到完整的發票照片，導致難以比對 OCR 辨識結果的正確性。目前上傳流程完全不顯示圖片，編輯頁面的圖片顯示不完整（遭裁切），影響使用體驗與資料核對效率。

## What Changes

- **掃描上傳流程（ScanPage）**：在 review 步驟中加入發票照片預覽，並排顯示於表單旁邊
- **發票編輯頁面（InvoiceDetailPage / EditPage）**：將現有的圖片顯示改為顯示完整發票（`object-fit: contain`），並調整版面配置使圖片佔據側欄
- 圖片側欄固定於左側或右側，版面為左右分割（圖片 | 表單）
- 若圖片需縮放，必須保留發票的完整內容，不得裁切發票本體

## Capabilities

### New Capabilities

- `invoice-image-panel`: 在上傳審核與編輯兩個畫面中，於側欄顯示完整發票照片的共用元件與版面邏輯

### Modified Capabilities

（無現有 spec 層級的需求變更）

## Impact

- **前端元件**：`ScanPage.tsx`（review 步驟）、發票編輯/詳細頁面元件
- **CSS / Tailwind**：新增 `object-contain` 樣式，調整格線或 flex 版面
- **後端 / API**：無變更；圖片 URL 已由現有 API 提供
- **依賴**：無新依賴
