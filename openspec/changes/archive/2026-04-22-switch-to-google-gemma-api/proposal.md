## Why

目前 backend 的 OCR 與分類功能依賴自架的 Gemma server（localhost:8080），需要維護本地推論基礎設施。改為使用 Google AI Studio 提供的雲端 API endpoint，可消除本地 server 維護負擔，並直接使用 Google 管理的 `gemma-4-31b-it` 模型。

## What Changes

- 將 `GEMMA_ENDPOINT_URL` 更新為 Google AI Studio 的 OpenAI 相容 endpoint
- 將 `GEMMA_MODEL_NAME` 更新為 `gemma-4-31b-it`
- `GEMMA_API_KEY` 改為使用真實的 Google API Key（存放於 `.env`）
- 更新 `.env.example` 反映新的設定值
- **【待驗證】** `extra_body={"chat_template_kwargs": {"enable_thinking": False}}` 為官方 Gemma 4 thinking mode 控制寫法；Google AI Studio endpoint 是否支援此參數尚未確認。實作時保留此參數並測試，若 API 回傳錯誤再移除或改用 Google 的對應寫法
- 加入 Claude Code 的 `denyRead` 設定，防止 model 讀取含有 API key 的 `.env` 檔案

## Capabilities

### New Capabilities

- `google-gemma-api`：透過 Google AI Studio 的 OpenAI 相容 endpoint 呼叫 Gemma 4 模型，包含 vision（OCR）與 text（分類）兩種使用情境

### Modified Capabilities

（無 spec 層級的行為變更——OCR 擷取與分類的輸入輸出介面不變，僅底層 API 供應商切換）

## Impact

- `backend/app/services/gemma_client.py`：依測試結果決定是否調整 `extra_body`
- `backend/.env` / `backend/.env.example`：更新三個環境變數
- `.claude/settings.json`：新增 `permissions.denyRead`
- 不影響任何 API 端點、資料庫 schema 或前端
