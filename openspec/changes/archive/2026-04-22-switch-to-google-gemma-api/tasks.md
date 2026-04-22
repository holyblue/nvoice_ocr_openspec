## 1. 環境設定

- [x] 1.1 更新 `backend/.env.example`：將 `GEMMA_ENDPOINT_URL` 改為 `https://generativelanguage.googleapis.com/v1beta/openai/`，`GEMMA_MODEL_NAME` 改為 `gemma-4-31b-it`，`GEMMA_API_KEY` 加上取得 Google API Key 的說明
- [x] 1.2 更新本地 `backend/.env`：填入真實 Google API Key（此檔案不提交）

## 2. Claude Code 設定

- [x] 2.1 在 `.claude/settings.json` 的 `permissions.denyRead` 加入 `backend/.env`，防止 model 讀取 API key

## 3. 驗證 `extra_body` 相容性

- [x] 3.1 執行 `uv run python scripts/test_gemma_connection.py` 測試與 Google AI Studio 的連線
- [x] 3.2 確認回應是否正常；若出現 `extra_body` 相關錯誤，移除 `gemma_client.py` 中兩處 `extra_body={"chat_template_kwargs": {"enable_thinking": False}}`（`extract_from_image` 第 97 行、`classify_with_llm` 第 149 行）

## 4. 測試

- [x] 4.1 執行 `uv run pytest tests/test_ocr_pipeline.py tests/test_classifier.py` 確認現有測試通過（Gemma 呼叫已 mock，與 endpoint 無關）
