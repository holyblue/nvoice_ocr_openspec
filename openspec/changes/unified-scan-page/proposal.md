## Why

目前的掃描頁面將「拍照」、「掃 QR Code」、「掃條碼」分成多個獨立步驟，使用者需要在步驟間切換，流程繁瑣。將三個動作整合到單一頁面，讓使用者一次完成所有輸入後再點「開始辨識」，體驗更直覺。

## What Changes

- 將多步驟精靈（capture → qr → barcode → processing → review）改為單頁表單（single-page → processing → review）
- 新增拍照 / 上傳圖片兩個 tab，放在同一卡片頂部
- 在同一卡片內新增 QR Code / 條碼掃描按鈕區（左側 QR Code、右側 QR Code（選填）、紙本條碼（選填））
- 「開始辨識」按鈕於未拍照前保持 disabled
- 進度列簡化為：拍照 → 辨識中 → 確認 → 完成

## Capabilities

### New Capabilities

- `unified-scan-page`：整合拍照、QR Code 掃描、條碼掃描於單一頁面，使用者填完所有欄位後一鍵送出辨識

### Modified Capabilities

（無現有 spec 需要修改）

## Impact

- **前端**：`frontend/src/pages/ScanPage.tsx` 全面重構；相關 store（`invoiceStore`）維持不變但步驟欄位可簡化；相關掃描子元件（QR、barcode）內嵌至新頁面
- **後端**：不受影響，`POST /api/v1/invoices/scan` 介面不變
