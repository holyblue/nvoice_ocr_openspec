## MODIFIED Requirements

### Requirement: 使用 google-genai SDK 呼叫 Gemma 4 模型

系統 SHALL 透過 `google-genai` 套件（`google.genai`）呼叫 `gemma-4-31b-it` 模型，使用環境變數 `GEMMA_API_KEY`、`GEMMA_MODEL_NAME`、`GEMMA_THINKING_LEVEL` 進行設定。不再使用 OpenAI 相容 endpoint，`GEMMA_ENDPOINT_URL` 環境變數予以移除。

#### Scenario: OCR 擷取成功
- **WHEN** `extract_from_image` 被呼叫且 `GEMMA_API_KEY` 為有效的 Google API Key
- **THEN** 系統 SHALL 回傳包含發票欄位的 dict，行為與舊版相同

#### Scenario: 分類呼叫成功
- **WHEN** `classify_with_llm` 被呼叫且 `GEMMA_API_KEY` 為有效的 Google API Key
- **THEN** 系統 SHALL 回傳包含 `category_code`、`confidence`、`reasoning` 的 dict

#### Scenario: API Key 無效
- **WHEN** `GEMMA_API_KEY` 為無效的 Google API Key
- **THEN** 系統 SHALL 記錄錯誤並回傳空 dict（錯誤處理行為不變）

## REMOVED Requirements

### Requirement: `.env` 中的 API Key 不被 Claude Code model 讀取

**Reason**: 此需求為 Claude Code 工具設定，非 API 客戶端實作範圍，應保留於原 `google-gemma-api` spec 中，本次不予異動。
**Migration**: 無需遷移，原 `.claude/settings.json` 設定繼續有效。

### Requirement: `.env.example` 反映 Google AI Studio 設定（舊版）

**Reason**: 原需求僅描述 OpenAI 相容 endpoint 的設定；新版改為描述 google-genai SDK 所需的環境變數，由 `google-genai-client` spec 接管完整定義。
**Migration**: 移除 `GEMMA_ENDPOINT_URL`，新增 `GEMMA_THINKING_LEVEL=minimal`。
