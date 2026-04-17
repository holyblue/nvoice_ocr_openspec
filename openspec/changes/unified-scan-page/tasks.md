## 1. 重構 ScanPage Step 狀態機

- [x] 1.1 將 `type Step` 從五值（`capture | qr | barcode | processing | review`）改為四值（`input | processing | review | done`）
- [x] 1.2 將進度列節點從四個（拍照、QR 碼、條碼、確認）改為四個（拍照、辨識中、確認、完成），對應新的 step 值
- [x] 1.3 移除 `handleCapture → setStep('qr')`、`handleQrDone`、`handleBarcodeDone` 的步驟跳轉邏輯，改為直接更新 store 不跳步驟

## 2. 實作單頁輸入卡片

- [x] 2.1 在 `ScanPage.tsx` 的 `step === 'input'` 區塊建立包含三個子區的卡片結構（拍照區、掃描按鈕區、送出按鈕）
- [x] 2.2 實作「拍照 / 上傳圖片」Tab 切換，預設選取「拍照」Tab；切換到上傳 Tab 時停止相機
- [x] 2.3 嵌入 `CameraCapture` 元件於「拍照」Tab，嵌入 file input 於「上傳圖片」Tab
- [x] 2.4 實作「開始辨識」按鈕的 `disabled={!draft.imageBase64}` 條件

## 3. 實作掃描按鈕區

- [x] 3.1 新增三個掃描按鈕：左側 QR Code、右側 QR Code（選填）、紙本條碼（選填）
- [x] 3.2 在 `ScanPage` 新增 `activeScanner: 'qr-left' | 'qr-right' | 'barcode' | null` 本地狀態，控制同一時間只展開一個掃描器
- [x] 3.3 點擊掃描按鈕時展開對應的 `QRScanner` 或 `BarcodeScanner`，同時關閉其他已展開的掃描器
- [x] 3.4 掃描成功後收起掃描器，在對應按鈕旁以綠色徽章顯示已完成狀態（重用 `CheckCircle` icon）
- [x] 3.5 已掃描成功的按鈕保持徽章顯示，允許點擊重新掃描（清除已掃描值並重啟掃描器）

## 4. 送出辨識流程

- [x] 4.1 「開始辨識」按鈕的 `onClick` 呼叫現有的 `handleScan` 邏輯（原 `handleBarcodeDone` 中的 API 呼叫），`setStep('processing')` 後觸發 `scanInvoice`
- [x] 4.2 成功後 `setStep('review')`，失敗後 `setStep('input')` 並顯示 toast

## 5. 收尾與驗證

- [x] 5.1 執行 `npx tsc --noEmit` 確認無型別錯誤
- [ ] 5.2 啟動 `npm run dev`，手動驗證：拍照後「開始辨識」啟用、QR 掃描成功後顯示徽章、未掃 QR 直接送出可正常運作、進度列四節點正確 highlight
