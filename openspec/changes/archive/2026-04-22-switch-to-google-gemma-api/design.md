## Context

目前 `gemma_client.py` 使用 `openai` SDK 搭配自架推論 server（vLLM 或類似），透過 `GEMMA_ENDPOINT_URL`（預設 `http://localhost:8080/v1`）存取。Google AI Studio 提供 OpenAI 相容 endpoint（`https://generativelanguage.googleapis.com/v1beta/openai/`），可以讓現有程式碼在幾乎不修改的情況下切換至雲端服務。

## Goals / Non-Goals

**Goals:**
- 將 LLM 後端切換至 Google AI Studio，無需維護本地推論基礎設施
- 保持 `gemma_client.py` 的公開介面不變（`extract_from_image`、`classify_with_llm`）
- 確保 `.env` 中的 API key 不被 Claude Code model 讀取

**Non-Goals:**
- 更換 SDK（繼續使用 `openai`）
- 變更 OCR 或分類的輸入輸出格式
- 處理 Google AI Studio 的限流或重試邏輯

## Decisions

### 繼續使用 `openai` SDK，改換 `base_url`

Google AI Studio 提供 OpenAI 相容 endpoint，只需修改 `base_url` 和 `api_key`，`AsyncOpenAI` client 不需要替換。替代方案（`google-generativeai` SDK）需要重寫呼叫邏輯，改動範圍更大且沒有對應收益。

### `extra_body` 參數：保留並待驗證

`extra_body={"chat_template_kwargs": {"enable_thinking": False}}` 是官方 Gemma 4 thinking mode 控制寫法。Google AI Studio 是否透過相同機制支援此參數尚未確認。

策略：**實作時保留此參數**，執行連線測試。
- 若 API 接受 → 無需進一步修改
- 若 API 回傳錯誤 → 移除 `extra_body`（接受預設行為）或改用 Google 提供的對應參數

### Claude Code `denyRead` 保護 `.env`

在 `.claude/settings.json` 的 `permissions.denyRead` 加入 `backend/.env`，防止 model 在工作階段中讀取 API key。

## Risks / Trade-offs

- **`extra_body` 相容性未知** → 實作後立即執行 `scripts/test_gemma_connection.py` 驗證；若失敗移除該參數
- **Google AI Studio 限流** → 目前不在範圍內，視需要後續處理
- **API Key 洩漏風險** → 透過 `denyRead` 設定和 `.gitignore` 雙重防護

## Migration Plan

1. 更新 `backend/.env`（本地，不提交）：填入 Google API Key，更新 endpoint 和 model name
2. 更新 `backend/.env.example`（提交）：反映新的預設值和說明
3. 更新 `.claude/settings.json`：加入 `denyRead`
4. 執行連線測試，確認 `extra_body` 是否相容
5. 依測試結果決定是否調整 `gemma_client.py`

**回滾**：將 `.env` 的 `GEMMA_ENDPOINT_URL` 改回本地位址即可，程式碼無需變更。

## Open Questions

- Google AI Studio 的 `gemma-4-31b-it` 是否支援 `chat_template_kwargs` via `extra_body`？（待實作時測試確認）
