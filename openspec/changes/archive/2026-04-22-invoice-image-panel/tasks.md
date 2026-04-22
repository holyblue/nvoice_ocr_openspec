## 1. InvoiceDetailPage 版面重構

- [x] 1.1 將 `InvoiceDetailPage.tsx` 外層容器從 `max-w-2xl` 改為 `max-w-5xl`
- [x] 1.2 當 `invoice.image_path` 有值時，以 `md:grid md:grid-cols-[2fr_3fr] gap-6` 實作兩欄版面
- [x] 1.3 左欄：將圖片容器改為 `sticky top-4`，移除 `max-h-64` 高度限制，改用 `max-h-[calc(100vh-8rem)] object-contain`
- [x] 1.4 右欄：將標題列、操作按鈕、InvoiceForm 包入右欄容器
- [x] 1.5 當 `invoice.image_path` 為空時，維持單欄版面（只顯示右欄內容）

## 2. ScanPage review 步驟圖片顯示

- [x] 2.1 在 ScanPage `step === 'review'` 的 JSX 中，加入對 `draft.imageBase64` 的判斷
- [x] 2.2 當 `draft.imageBase64` 有值時，以 `md:grid md:grid-cols-[2fr_3fr] gap-6` 包裹照片欄與表單欄
- [x] 2.3 左欄：以 `<img src={data:image/jpeg;base64,...}>` 顯示發票照片，套用 `sticky top-4 w-full object-contain max-h-[calc(100vh-8rem)] rounded-lg`
- [x] 2.4 當 `draft.imageBase64` 為空時，維持原本單欄 InvoiceForm 版面

## 3. 驗證

- [x] 3.1 執行 `npx tsc --noEmit`，確認無 TypeScript 錯誤
- [x] 3.2 啟動前端 dev server，進行掃描流程至 review 步驟，確認照片與表單並排且完整顯示
- [x] 3.3 開啟現有發票的詳細頁，確認照片與表單並排，捲動表單時照片維持 sticky
- [x] 3.4 縮小瀏覽器視窗至行動裝置尺寸，確認版面退化為垂直堆疊
