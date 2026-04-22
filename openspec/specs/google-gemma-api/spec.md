## Purpose
透過 Google AI Studio OpenAI 相容 endpoint 呼叫 Gemma 4 模型，用於發票 OCR 擷取與費用分類。

## Requirements

### Requirement: 使用 Google AI Studio endpoint 呼叫 Gemma 4

系統 SHALL 透過 Google AI Studio 的 OpenAI 相容 endpoint（`https://generativelanguage.googleapis.com/v1beta/openai/`）呼叫 `gemma-4-31b-it` 模型，使用環境變數 `GEMMA_ENDPOINT_URL`、`GEMMA_MODEL_NAME`、`GEMMA_API_KEY` 進行設定。

#### Scenario: OCR 擷取成功
- **WHEN** `extract_from_image` 被呼叫且 `GEMMA_ENDPOINT_URL` 指向 Google AI Studio
- **THEN** 系統 SHALL 回傳包含發票欄位的 dict，行為與自架 server 相同

#### Scenario: 分類呼叫成功
- **WHEN** `classify_with_llm` 被呼叫且 `GEMMA_ENDPOINT_URL` 指向 Google AI Studio
- **THEN** 系統 SHALL 回傳包含 `category_code`、`confidence`、`reasoning` 的 dict

#### Scenario: API Key 無效
- **WHEN** `GEMMA_API_KEY` 為無效的 Google API Key
- **THEN** 系統 SHALL 記錄錯誤並回傳空 dict（現有錯誤處理行為不變）

### Requirement: `.env` 中的 API Key 不被 Claude Code model 讀取

系統 SHALL 在 `.claude/settings.json` 的 `permissions.denyRead` 中列出 `backend/.env`，防止 Claude Code 在工作階段中讀取該檔案內容。

#### Scenario: Claude Code 嘗試讀取 `.env`
- **WHEN** Claude Code model 嘗試讀取 `backend/.env`
- **THEN** 系統 SHALL 拒絕該讀取請求

### Requirement: `.env.example` 反映 Google AI Studio 設定

`backend/.env.example` SHALL 包含 Google AI Studio 的正確 endpoint URL、model name 佔位值，以及說明 API Key 來源的註解。

#### Scenario: 開發者首次設定環境
- **WHEN** 開發者複製 `.env.example` 為 `.env`
- **THEN** 檔案內容 SHALL 清楚標示需填入 Google API Key 的欄位及取得方式
