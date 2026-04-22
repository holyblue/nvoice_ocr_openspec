## Purpose
對掃描後的發票執行規則比對與 LLM fallback 費用分類，並在前端顯示分類建議供使用者確認或覆寫。

## Requirements

### Requirement: 規則分類引擎
系統 SHALL 在 OCR pipeline 完成後，依照載入的 `CategoryRule` 資料，對發票進行規則比對分類，並計算信心值。

#### Scenario: 賣家統編精確比對命中
- **WHEN** 發票的 `seller_tax_id` 與某條 `rule_type = seller_tax_id` 的規則完全相符
- **THEN** 系統 SHALL 將該規則的分數以 `priority × 2` 加權計算，並將對應分類設為候選

#### Scenario: 賣家名稱包含比對命中
- **WHEN** 發票的 `seller_name` 包含某條 `rule_type = seller_name_contains` 的 `rule_value`
- **THEN** 系統 SHALL 以該規則的 `priority` 分數加入候選分類的累積分數

#### Scenario: 品項名稱包含比對命中
- **WHEN** 任一 `InvoiceItem.item_name` 包含某條 `rule_type = item_name_contains` 的 `rule_value`
- **THEN** 系統 SHALL 以該規則的 `priority` 分數加入候選分類的累積分數

#### Scenario: 規則比對成功，信心值達標
- **WHEN** 最高累積分數換算後的信心值 ≥ 0.5
- **THEN** 系統 SHALL 設定 `classification_source = "rule"`，`classification_confidence` 為計算所得信心值，並返回分類建議

#### Scenario: 規則比對失敗或信心值不足
- **WHEN** 無任何規則命中，或最高信心值 < 0.5
- **THEN** 系統 SHALL 進入 LLM fallback 流程

### Requirement: LLM Fallback 分類
系統 SHALL 在規則分類信心值不足時，呼叫 Gemma 4 LLM 進行智慧分類，並返回分類代碼、信心值與中文理由說明。

#### Scenario: LLM 成功返回分類
- **WHEN** Gemma 4 LLM 接收到發票資料（賣家名稱、品項、金額等）及可用分類清單
- **THEN** 系統 SHALL 解析 LLM 返回的 JSON，取得 `category_code`、`confidence`、中文 `reasoning`，設定 `classification_source = "llm"`

#### Scenario: LLM 返回 JSON 含 Markdown wrapper
- **WHEN** LLM 返回的內容被 markdown 程式碼區塊包裹（如 ```json ... ```）
- **THEN** 系統 SHALL 以 regex fallback 解析，提取有效 JSON 內容

#### Scenario: LLM 呼叫失敗
- **WHEN** Gemma 4 endpoint 無法連線或返回錯誤
- **THEN** 系統 SHALL 設定 `classification_source = "llm"`，`classification_confidence = 0`，分類為 null，並標記發票狀態為 `pending` 待使用者手動確認

### Requirement: 前端分類建議顯示
系統 SHALL 在 Review 步驟的 `CategorySelector` 元件中，以視覺化方式呈現 AI 或規則建議的分類，供使用者確認或覆寫。

#### Scenario: 顯示規則分類建議
- **WHEN** `classification_source = "rule"`
- **THEN** 系統 SHALL 在下拉選單頂端顯示建議分類，附上「規則」badge 及信心百分比

#### Scenario: 顯示 AI 分類建議
- **WHEN** `classification_source = "llm"`
- **THEN** 系統 SHALL 在下拉選單頂端顯示建議分類，附上「AI建議」badge（閃光圖示）、信心百分比，並顯示中文 `reasoning`

#### Scenario: 信心值色彩指示
- **WHEN** 顯示 `ConfidenceBadge`
- **THEN** 系統 SHALL 依信心值顯示對應顏色：≥ 0.8 為綠色、0.5–0.8 為黃色、< 0.5 為紅色

#### Scenario: 使用者覆寫分類
- **WHEN** 使用者在 `CategorySelector` 選擇與建議不同的分類
- **THEN** 系統 SHALL 記錄 `classification_source = "manual"`，並在儲存時以使用者選擇的分類為準

### Requirement: 分類優先順序排序
系統 SHALL 在載入所有 `CategoryRule` 時，依 `priority` 降序排列，確保高優先規則優先比對。

#### Scenario: 高優先規則先比對
- **WHEN** 發票同時符合多條不同優先度的規則
- **THEN** 系統 SHALL 優先以高 `priority` 的規則結果作為主要候選分類
