## Context

目前兩個畫面都無法方便地對照發票照片與 OCR 結果：

- **ScanPage（review 步驟）**：`draft.imageBase64` 儲存在 Zustand store 中，但 review 步驟的 JSX 只渲染 `<InvoiceForm>`，完全沒有顯示圖片。
- **InvoiceDetailPage**：圖片顯示在表單上方，但容器限制為 `max-h-64`（256px），且未設定最小高度，造成寬景發票被嚴重壓縮。兩個元素垂直排列，不利於同時比對。

## Goals / Non-Goals

**Goals:**
- 在 ScanPage review 步驟與 InvoiceDetailPage 中，以左右並排版面顯示完整發票照片（左欄）與表單（右欄）
- 圖片使用 `object-contain` 確保完整顯示，不裁切發票本體
- 圖片欄位在桌面版採用 `sticky` 定位，讓使用者捲動表單時照片仍可見
- 行動裝置（`< md`）改為垂直堆疊：圖片在上、表單在下

**Non-Goals:**
- 不實作圖片縮放、旋轉等互動操作
- 不更改後端 API 或圖片上傳流程
- 不影響 ScanPage 的 input/qr/barcode/processing 步驟

## Decisions

### 版面結構

使用 Tailwind CSS Grid 實作兩欄版面：

```
md: grid grid-cols-[2fr_3fr] gap-6
mobile: flex flex-col
```

- **左欄（圖片）**：佔 2/5 寬度，`sticky top-4`，自動填滿視口高度
- **右欄（表單）**：佔 3/5 寬度，可捲動

選擇 Grid 而非 Flex 的原因：Grid 的欄寬定義更明確，且 `fr` 單位可確保比例穩定。

**替代方案考慮**：
- Flex + `w-2/5` / `w-3/5`：可行，但在 overflow 場景下容易出現縮排問題
- 單欄（圖片在上）：不符合需求，無法同時對照

### 圖片顯示

```html
<img class="w-full h-auto object-contain rounded-lg" />
```

圖片欄使用 `max-h-[calc(100vh-8rem)]` 限制最大高度，搭配 `object-contain` 確保不裁切。

**ScanPage** 使用 `data:image/jpeg;base64,${draft.imageBase64}` 作為圖片來源；**InvoiceDetailPage** 使用 `getInvoiceImageUrl(invoice.id)`。

### 元件共用

不抽取共用元件。兩個頁面的圖片 src 來源不同（base64 vs URL），且外部容器的語意脈絡也不同，共用反而增加不必要的 props 複雜度。直接在各頁面重複圖片欄的 JSX（約 6 行），符合 YAGNI 原則。

### 版面寬度

InvoiceDetailPage 目前限制 `max-w-2xl`，啟用兩欄後需放寬至 `max-w-5xl`，以避免圖片過窄。ScanPage 同樣放寬。

## Risks / Trade-offs

- **行動裝置體驗**：兩欄版面在小螢幕會退化為垂直堆疊，圖片可能佔用較多上方空間，使用者需要捲動才能看到表單 → 可接受，照片對比是主要需求
- **Sticky 失效條件**：若外層容器設有 `overflow: hidden/auto`，sticky 會失效 → 需確認現有頁面容器無此設定
