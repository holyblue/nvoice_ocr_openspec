## Context

目前 `ScanPage.tsx` 採用四步驟精靈：`capture → qr → barcode → processing → review`。每個步驟對應獨立的 UI 區塊，使用者必須逐步點「下一步」才能前進。實際上，QR Code 和條碼掃描並非強制順序，且使用者常常希望先拍照、再補掃 QR/條碼，最後才送出。現有設計不符合這種使用習慣。

## Goals / Non-Goals

**Goals:**
- 將 capture / qr / barcode 三個步驟合併為單一輸入頁面（`input` 狀態）
- 保留 `processing` 與 `review` 步驟的現有行為不變
- 進度列簡化為四節點：拍照 → 辨識中 → 確認 → 完成
- 「開始辨識」按鈕在未拍照前保持 disabled
- QR Code（右側）與條碼為選填，可略過

**Non-Goals:**
- 不修改後端 API 介面
- 不修改 `invoiceStore` 的資料結構
- 不引入新的掃描函式庫或相機 API
- 不重構 `CameraCapture`、`QRScanner`、`BarcodeScanner` 元件本身

## Decisions

### 1. Step 型別從五值改為四值

**決策**：`type Step = 'input' | 'processing' | 'review' | 'done'`，移除 `qr` 與 `barcode`。

**理由**：`qr` 和 `barcode` 不再是獨立步驟，而是 `input` 頁面內的互動區塊，不需要在 step machine 中獨立表示。

**替代方案**：保留舊 step 名稱但在 `input` 時同時顯示三個區塊 → 增加狀態判斷複雜度，放棄。

### 2. 掃描按鈕觸發 inline modal/drawer 而非跳頁

**決策**：點擊「左側 QR Code」等按鈕時，在頁面內展開掃描器（摺疊/展開模式），不離開當前頁面。

**理由**：與截圖設計一致；使用者可在掃完後立即看到結果徽章，不需要記憶已完成的步驟。

**替代方案**：維持獨立步驟頁跳轉 → 違背整合目標，放棄。

### 3. 拍照 / 上傳圖片以 Tab 呈現

**決策**：在卡片頂部以 tab 切換「拍照」與「上傳圖片」，分別對應 `CameraCapture` 的相機模式與 file input 模式。

**理由**：截圖設計如此；相機與上傳是互斥行為，tab 語義清晰。

### 4. 「開始辨識」按鈕邏輯

**決策**：`disabled={!draft.imageBase64}`，無其他條件。

**理由**：左側 QR Code 雖為主要來源，但後端 OCR 可在無 QR 的情況下運作，因此只要有圖片即可送出。

## Risks / Trade-offs

- **同時啟動多個 Html5Qrcode 實例的衝突風險**：若使用者同時展開多個掃描器（QR 左、QR 右、條碼），可能搶佔同一個攝影機串流。緩解方式：同一時間只允許一個掃描器處於展開狀態，展開新的時關閉舊的。
- **CameraCapture 自動啟動相機**：現有元件在 mount 時即呼叫 `startCamera()`，整合後頁面載入即啟動相機，行為不變。
- **進度列「拍照」節點在整個 input 階段保持 active**：使用者補掃 QR/條碼時，進度仍停留在「拍照」節點，視覺上未反映掃描中間態，屬可接受的取捨。
