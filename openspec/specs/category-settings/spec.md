## Purpose
管理費用分類與分類規則，支援 CSV 匯入 upsert 及基本 CRUD 操作，供會計人員維護分類設定。

## Requirements

### Requirement: 上傳分類規則 CSV
系統 SHALL 允許使用者（會計人員）在設定頁面上傳分類規則 CSV 檔案，系統以 upsert 方式更新分類與規則資料。

#### Scenario: 成功上傳有效 CSV
- **WHEN** 使用者在設定頁面選擇有效的 CSV 檔案並點擊上傳
- **THEN** 系統 SHALL 呼叫 `POST /api/v1/categories/import`，解析 CSV，upsert 所有分類與規則，並顯示成功訊息（包含新增/更新筆數）

#### Scenario: CSV 格式驗證
- **WHEN** 使用者上傳的 CSV 缺少必要欄位（`category_code`、`category_name`、`rule_type`、`rule_value`）
- **THEN** 系統 SHALL 返回 HTTP 422，顯示錯誤訊息，說明缺少哪些欄位，不執行任何資料庫更新

#### Scenario: 相同 category_code 的規則更新
- **WHEN** 上傳的 CSV 包含已存在的 `category_code`
- **THEN** 系統 SHALL 更新該分類的 `category_name`、`account_code`，並以新的規則集合取代舊規則（先刪除再新增）

#### Scenario: CSV 編碼支援
- **WHEN** 使用者上傳 UTF-8 或 Big5 編碼的 CSV
- **THEN** 系統 SHALL 能正確解析中文內容，不出現亂碼

### Requirement: 費用分類 CRUD
系統 SHALL 提供費用分類的基本 CRUD 操作（透過 API），允許程式化管理分類資料。

#### Scenario: 查詢所有分類
- **WHEN** 前端 `CategorySelector` 元件初始化
- **THEN** 系統 SHALL 呼叫 `GET /api/v1/categories`，返回所有分類的 `id`、`code`、`name`、`account_code`

#### Scenario: 查詢單一分類（含規則）
- **WHEN** 呼叫 `GET /api/v1/categories/{id}`
- **THEN** 系統 SHALL 返回分類基本資訊及其下所有 `CategoryRule` 的詳細清單

#### Scenario: 刪除分類
- **WHEN** 呼叫 `DELETE /api/v1/categories/{id}`
- **THEN** 系統 SHALL 同時刪除該分類的所有關聯規則；若有發票引用此分類，SHALL 將其 `category_id` 設為 null

### Requirement: CSV 格式規範
系統接受的分類規則 CSV SHALL 符合以下格式：欄位標頭為 `category_code,category_name,account_code,rule_type,rule_value,priority`，`rule_type` 支援 `seller_name_contains`、`seller_tax_id`、`item_name_contains`、`amount_range`。

#### Scenario: 標準 CSV 格式範例
- **WHEN** 使用者上傳含有效資料的 CSV（如 `MEALS,餐費,5161,seller_name_contains,餐廳,10`）
- **THEN** 系統 SHALL 建立 `category_code=MEALS`、`category_name=餐費`、`account_code=5161` 的分類，及對應的 `seller_name_contains` 規則

#### Scenario: 不支援的 rule_type
- **WHEN** CSV 中包含不在支援清單內的 `rule_type`
- **THEN** 系統 SHALL 跳過該列並記錄警告，繼續處理其他有效列，最終在回應中回報跳過的列數

### Requirement: 分類設定頁面顯示
系統 SHALL 在設定頁面顯示目前已載入的分類清單及各分類的規則數量，讓使用者確認上傳結果。

#### Scenario: 上傳後立即顯示更新結果
- **WHEN** CSV 上傳成功
- **THEN** 系統 SHALL 重新載入分類清單，顯示最新的分類數量與每個分類的規則筆數
