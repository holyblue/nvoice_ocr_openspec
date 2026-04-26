## Purpose
以 `google-genai` SDK 實作 Gemma Vision OCR 與費用分類呼叫，支援 `ThinkingConfig` 思考深度控制。

## Requirements

### Requirement: 使用 google-genai SDK 呼叫 Gemma 模型

系統 SHALL 透過 `google-genai` 套件的 `genai.Client` 呼叫 Gemma 模型，使用 `client.aio.models.generate_content()` 進行非同步請求，以 `GOOGLE_API_KEY`（即現有的 `GEMMA_API_KEY` 環境變數）進行驗證。

#### Scenario: OCR 擷取使用原生 SDK 呼叫成功
- **WHEN** `extract_from_image` 被呼叫且 `GEMMA_API_KEY` 為有效的 Google API Key
- **THEN** 系統 SHALL 透過 `client.aio.models.generate_content()` 呼叫模型，並回傳包含發票欄位的 dict

#### Scenario: 分類使用原生 SDK 呼叫成功
- **WHEN** `classify_with_llm` 被呼叫且 `GEMMA_API_KEY` 為有效的 Google API Key
- **THEN** 系統 SHALL 透過 `client.aio.models.generate_content()` 呼叫模型，並回傳包含 `category_code`、`confidence`、`reasoning` 的 dict

### Requirement: 圖片以 bytes 方式傳入模型

系統 SHALL 將 base64 圖片解碼後，以 `types.Part.from_bytes(data=bytes, mime_type="image/jpeg")` 方式傳入 `contents`，不使用 Files API 上傳。

#### Scenario: 發票圖片正確傳遞至模型
- **WHEN** `extract_from_image` 被呼叫並傳入 base64 字串
- **THEN** 系統 SHALL 將其解碼為 bytes 並包裝為 `types.Part`，作為 `contents` 陣列的一部分傳入

### Requirement: 支援思考層級設定

系統 SHALL 透過 `GEMMA_THINKING_LEVEL` 環境變數（預設 `"minimal"`）控制思考行為。Gemma 4 支援三個值：`none`（關閉）、`minimal`、`high`。`none` 時完全省略 `thinking_config`；其他值使用對應的 SDK enum（`"MINIMAL"` / `"HIGH"`）。

#### Scenario: 思考層級為 none 時停用思考
- **WHEN** `GEMMA_THINKING_LEVEL` 設為 `"none"`（或 `"off"`）
- **THEN** 系統 SHALL 省略 `thinking_config`，不傳入任何 `ThinkingConfig` 物件

#### Scenario: 思考層級設為 minimal 時啟用輕量思考
- **WHEN** `GEMMA_THINKING_LEVEL` 設為 `"minimal"` 或未設定
- **THEN** 系統 SHALL 以 `ThinkingConfig(thinking_level="MINIMAL")` 呼叫模型

#### Scenario: 思考層級設為 high 時啟用深度思考
- **WHEN** `GEMMA_THINKING_LEVEL` 設為 `"high"`
- **THEN** 系統 SHALL 以 `ThinkingConfig(thinking_level="HIGH")` 呼叫模型

### Requirement: system_instruction 透過 GenerateContentConfig 傳入

系統 SHALL 將 system prompt 透過 `GenerateContentConfig(system_instruction=...)` 傳入，而非作為對話訊息。

#### Scenario: OCR system prompt 正確傳遞
- **WHEN** `extract_from_image` 建立請求
- **THEN** OCR system prompt SHALL 出現在 `GenerateContentConfig.system_instruction` 中，而非 `contents` 陣列內
