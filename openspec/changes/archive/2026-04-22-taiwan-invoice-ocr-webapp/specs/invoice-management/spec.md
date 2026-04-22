## ADDED Requirements

### Requirement: 發票清單查詢
系統 SHALL 提供發票清單頁面，支援多條件篩選，並以分頁方式顯示結果。

#### Scenario: 無條件查詢所有發票
- **WHEN** 使用者開啟發票清單頁面，不設定任何篩選條件
- **THEN** 系統 SHALL 顯示所有發票，每頁預設 20 筆，並顯示總筆數

#### Scenario: 依狀態篩選
- **WHEN** 使用者選擇篩選狀態為「pending」
- **THEN** 系統 SHALL 只顯示狀態為 `pending` 的發票

#### Scenario: 依日期範圍篩選
- **WHEN** 使用者輸入起始日期與結束日期
- **THEN** 系統 SHALL 只顯示 `purchase_date` 在該範圍內的發票

#### Scenario: 依分類篩選
- **WHEN** 使用者選擇特定費用分類
- **THEN** 系統 SHALL 只顯示該 `category_id` 的發票

#### Scenario: 依 Bundle 篩選
- **WHEN** 使用者選擇特定 Bundle
- **THEN** 系統 SHALL 只顯示已加入該 Bundle 的發票

### Requirement: 發票詳細頁面
系統 SHALL 提供發票詳細資訊頁面，顯示所有發票欄位、品項明細、分類資訊及原始圖片。

#### Scenario: 查看完整發票資料
- **WHEN** 使用者點擊特定發票
- **THEN** 系統 SHALL 顯示發票號碼、日期、賣家名稱、統編、金額、分類、狀態等所有欄位及品項明細

#### Scenario: 查看發票圖片
- **WHEN** 使用者在詳細頁面點擊圖片區塊
- **THEN** 系統 SHALL 顯示原始發票圖片（透過 `GET /api/v1/invoices/{id}/image` 取得）

### Requirement: 發票狀態管理
系統 SHALL 支援發票狀態流轉（`pending` → `confirmed` 或 `rejected`），使用者確認或拒絕 OCR 辨識結果。

#### Scenario: 確認發票資料
- **WHEN** 使用者審閱 Review 步驟的發票資料並點擊「確認」
- **THEN** 系統 SHALL 呼叫 `PUT /api/v1/invoices/{id}`，將狀態更新為 `confirmed`，並將 `classification_source` 設為 `manual`（若使用者有修改分類）

#### Scenario: 拒絕發票
- **WHEN** 使用者點擊「拒絕」
- **THEN** 系統 SHALL 將發票狀態更新為 `rejected`，並從 Bundle 中移除（若已加入）

### Requirement: 發票欄位編輯
系統 SHALL 允許使用者在 Review 步驟修改 OCR 辨識結果中任何欄位，以修正辨識錯誤。

#### Scenario: 修改賣家名稱
- **WHEN** 使用者在表單中修改「賣家名稱」欄位
- **THEN** 系統 SHALL 以使用者輸入的值覆蓋 OCR 辨識結果，並在儲存時保留修改值

#### Scenario: 修改金額
- **WHEN** 使用者修改「未稅額」或「稅額」
- **THEN** 系統 SHALL 自動重新計算「總金額」（未稅額 + 稅額）

### Requirement: 發票刪除
系統 SHALL 允許使用者刪除發票紀錄，並同時移除對應的圖片檔案。

#### Scenario: 刪除發票
- **WHEN** 使用者在發票詳細頁面點擊「刪除」並確認
- **THEN** 系統 SHALL 呼叫 `DELETE /api/v1/invoices/{id}`，從資料庫刪除紀錄，並刪除對應圖片檔案

#### Scenario: 刪除已加入 Bundle 的發票
- **WHEN** 使用者嘗試刪除已加入某 Bundle 的發票
- **THEN** 系統 SHALL 先從 Bundle 中移除該發票，再執行刪除

### Requirement: 重新分類
系統 SHALL 允許使用者對已確認的發票觸發重新分類，重新執行規則比對與 LLM fallback。

#### Scenario: 觸發重新分類
- **WHEN** 使用者在發票詳細頁面點擊「重新分類」
- **THEN** 系統 SHALL 呼叫 `POST /api/v1/invoices/{id}/classify`，返回新的分類建議，使用者確認後更新紀錄
