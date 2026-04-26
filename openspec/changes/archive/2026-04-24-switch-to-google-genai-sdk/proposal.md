## Why

目前 `gemma_client.py` 透過 OpenAI 相容 SDK 呼叫 Google AI Studio，但該相容層不支援 Google 原生參數，無法控制模型的思考深度（`ThinkingConfig`）。切換至 Google 官方 `google-genai` SDK 後，可直接透過 `types.ThinkingConfig(thinking_level=...)` 控制思考行為；目前專案不需要模型思考，應設為停用以降低延遲與 token 用量。

## What Changes

- 將 `gemma_client.py` 底層從 `openai.AsyncOpenAI` 換為 `google-genai`（`google.genai`）
- 圖片傳遞方式從 OpenAI 的 `image_url` base64 inline 改為 `types.Part.from_bytes()`
- 新增 `GEMMA_THINKING_LEVEL` 環境變數，預設 `"minimal"`，可設為 `"none"`（停用）/ `"high"`（深度思考）
- 更新 `backend/pyproject.toml`：加入 `google-genai`
- 更新 `.env.example` 加入 `GEMMA_THINKING_LEVEL` 說明

## Capabilities

### New Capabilities

- `google-genai-client`：以 `google-genai` SDK 實作 Gemma Vision OCR 與費用分類呼叫，支援 `ThinkingConfig` 思考深度控制

### Modified Capabilities

- `google-gemma-api`：API 呼叫底層從 OpenAI 相容層改為原生 Google SDK；對外行為（回傳欄位、錯誤處理）不變，新增思考層級設定需求

## Impact

- **後端服務**：`backend/app/services/gemma_client.py`（完整重寫）
- **設定**：`backend/app/config.py`（新增 `gemma_thinking_level` 欄位）
- **依賴**：`backend/pyproject.toml`（新增 `google-genai`）
- **環境變數**：`backend/.env.example`（新增 `GEMMA_THINKING_LEVEL`）
- **測試**：`tests/` 中 mock `gemma_client` 的測試需確認 mock 路徑仍正確（行為不變，只是內部實作換掉）
