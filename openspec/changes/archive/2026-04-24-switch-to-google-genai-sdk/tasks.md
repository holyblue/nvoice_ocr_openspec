## 1. 依賴套件更新

- [x] 1.1 在 `backend/pyproject.toml` 新增 `google-genai` 依賴
- [x] 1.2 從 `backend/pyproject.toml` 移除 `openai` 依賴（確認無其他模組使用後）
- [x] 1.3 執行 `uv sync` 確認依賴安裝無誤

## 2. Config 設定更新

- [x] 2.1 在 `backend/app/config.py` 移除 `gemma_endpoint_url` 欄位
- [x] 2.2 在 `backend/app/config.py` 新增 `gemma_thinking_level: str = "none"` 欄位
- [x] 2.3 更新 `backend/.env.example`：移除 `GEMMA_ENDPOINT_URL`，新增 `GEMMA_THINKING_LEVEL=none` 及說明註解

## 3. 重寫 gemma_client.py

- [x] 3.1 將 import 從 `openai` 改為 `from google import genai` 及 `from google.genai import types`
- [x] 3.2 重寫 `_get_client()` 使用 `genai.Client(api_key=settings.gemma_api_key)`
- [x] 3.3 實作 `_build_thinking_config()` 輔助函式，依 `settings.gemma_thinking_level` 建立 `types.ThinkingConfig`
- [x] 3.4 重寫 `extract_from_image()`：base64 解碼後用 `types.Part.from_bytes()`，system prompt 移至 `GenerateContentConfig(system_instruction=...)`，呼叫改為 `client.aio.models.generate_content()`
- [x] 3.5 重寫 `classify_with_llm()`：同樣使用 `client.aio.models.generate_content()` 並套用 `ThinkingConfig`
- [x] 3.6 確認 `response.text` 或等效屬性的取值方式（`google-genai` 回應格式與 OpenAI 不同）

## 4. 測試驗證

- [x] 4.1 執行 `uv run pytest` 確認所有現有測試仍通過（mock 路徑不變）
- [x] 4.2 以實際 API Key 手動測試一張發票圖片，確認 OCR 擷取結果正確
- [x] 4.3 確認 `GEMMA_THINKING_LEVEL=none` 時 API 回應正常（測試 `"none"` 是否為有效值；若不被接受，改為省略 `thinking_config`）
