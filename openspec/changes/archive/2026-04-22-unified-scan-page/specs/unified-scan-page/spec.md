## ADDED Requirements

### Requirement: 單頁輸入表單

掃描頁面 SHALL 在單一卡片內同時呈現拍照區、QR Code 掃描區、條碼掃描區，使用者無需在步驟間切換即可完成所有輸入。

#### Scenario: 頁面初始載入

- **WHEN** 使用者開啟掃描頁面
- **THEN** 系統 SHALL 顯示包含拍照 Tab、QR Code / 條碼掃描按鈕區、以及 disabled「開始辨識」按鈕的單一卡片

#### Scenario: 拍照後啟用辨識按鈕

- **WHEN** 使用者成功拍照或上傳圖片
- **THEN** 系統 SHALL 啟用「開始辨識」按鈕（移除 disabled 狀態）

### Requirement: 拍照與上傳圖片 Tab

拍照區 SHALL 以 Tab 形式提供「拍照」與「上傳圖片」兩種模式，兩者互斥。

#### Scenario: 預設顯示拍照 Tab

- **WHEN** 使用者開啟掃描頁面
- **THEN** 系統 SHALL 預設選取「拍照」Tab，並啟動相機預覽

#### Scenario: 切換至上傳圖片 Tab

- **WHEN** 使用者點擊「上傳圖片」Tab
- **THEN** 系統 SHALL 停止相機預覽，並顯示檔案選取按鈕

### Requirement: QR Code 掃描按鈕

QR Code / 條碼掃描區 SHALL 提供三個按鈕：「左側 QR Code」（必填建議）、「右側 QR Code（選填）」、「紙本條碼（選填）」。

#### Scenario: 點擊掃描按鈕展開掃描器

- **WHEN** 使用者點擊任一掃描按鈕
- **THEN** 系統 SHALL 在卡片內展開對應的掃描器，同時關閉其他已展開的掃描器

#### Scenario: 掃描成功顯示完成徽章

- **WHEN** 掃描器成功讀取 QR Code 或條碼
- **THEN** 系統 SHALL 收起掃描器並在對應按鈕旁顯示已完成徽章

#### Scenario: 略過選填掃描

- **WHEN** 使用者未點擊右側 QR Code 或紙本條碼按鈕即點擊「開始辨識」
- **THEN** 系統 SHALL 以 `null` 填入對應欄位並繼續辨識流程

### Requirement: 進度列

進度列 SHALL 顯示四個節點：拍照 → 辨識中 → 確認 → 完成，反映整體流程進度。

#### Scenario: 輸入階段進度

- **WHEN** 使用者處於單頁輸入表單（尚未送出）
- **THEN** 系統 SHALL 將「拍照」節點標示為 active，其餘節點為 inactive

#### Scenario: 辨識中進度

- **WHEN** 系統正在呼叫 `POST /api/v1/invoices/scan`
- **THEN** 系統 SHALL 將「辨識中」節點標示為 active，並顯示 loading spinner

#### Scenario: 確認階段進度

- **WHEN** OCR 辨識完成，系統進入確認表單
- **THEN** 系統 SHALL 將「確認」節點標示為 active

### Requirement: 送出辨識

使用者點擊「開始辨識」後，系統 SHALL 呼叫 `POST /api/v1/invoices/scan` 並進入 processing 狀態，成功後進入 review 表單。

#### Scenario: 辨識成功

- **WHEN** 使用者點擊「開始辨識」且 API 回傳成功
- **THEN** 系統 SHALL 顯示 review 確認表單，讓使用者確認並儲存發票

#### Scenario: 辨識失敗

- **WHEN** API 回傳錯誤
- **THEN** 系統 SHALL 顯示錯誤 toast，並回到輸入表單讓使用者重試
