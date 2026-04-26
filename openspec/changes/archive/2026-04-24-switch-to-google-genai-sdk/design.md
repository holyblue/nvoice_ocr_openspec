## Context

`gemma_client.py` 目前使用 `openai.AsyncOpenAI` 指向 Google AI Studio 的 OpenAI 相容 endpoint（`/v1beta/openai/`）。此相容層的限制：無法傳遞 Google 原生參數，特別是 `ThinkingConfig`，導致無法控制模型思考深度。Google 官方 `google-genai` SDK 直接支援這些參數。

## Goals / Non-Goals

**Goals:**
- 換用 `google-genai` SDK，移除對 OpenAI 相容層的依賴
- 支援 `ThinkingConfig` 思考層級控制，預設 `"minimal"`
- 保持 `extract_from_image` 和 `classify_with_llm` 的函式簽名不變，上層呼叫端零修改

**Non-Goals:**
- 不改動 OCR pipeline、classifier、router 等上層邏輯
- 不引入 Gemini 模型（仍使用 Gemma 模型名稱）
- 不改變 API 回應格式或欄位定義

## Decisions

### 決策 1：使用 `client.aio.models.generate_content()` 做非同步呼叫

`google-genai` 的非同步介面透過 `client.aio` 命名空間暴露，呼叫方式為：

```python
client = genai.Client(api_key=settings.gemma_api_key)
response = await client.aio.models.generate_content(
    model=settings.gemma_model_name,
    contents=[...],
    config=types.GenerateContentConfig(...)
)
```

**捨棄方案**：使用 `asyncio.to_thread` 包裝同步呼叫 — 會佔用 thread pool，不適合高並發場景。

### 決策 2：圖片傳遞改用 `types.Part.from_bytes()`

原 OpenAI 格式使用 `image_url` 內嵌 base64 字串；`google-genai` 使用 `types.Part.from_bytes(data=bytes, mime_type="image/jpeg")`，直接傳入解碼後的 bytes，不需上傳至 Files API（適合小型發票圖片）。

**捨棄方案**：`client.files.upload()` — 適合大檔案，但增加額外 API 呼叫與複雜度，不必要。

### 決策 3：`system_instruction` 移至 `GenerateContentConfig`

`google-genai` 的 system instruction 透過 `GenerateContentConfig(system_instruction=...)` 傳入，而非作為對話訊息的一部分。這與 Gemini SDK 的慣例一致。

### 決策 4：移除 `GEMMA_ENDPOINT_URL`，新增 `GEMMA_THINKING_LEVEL`

`google-genai` SDK 自動使用 `https://generativelanguage.googleapis.com`，不需自行指定 endpoint。`GEMMA_ENDPOINT_URL` 從 config 中移除，並新增 `GEMMA_THINKING_LEVEL`（預設 `"minimal"`）。Gemma 4 支援三個值：`none`（省略 `thinking_config`）、`minimal`（`ThinkingConfig(thinking_level="MINIMAL")`）、`high`（`ThinkingConfig(thinking_level="HIGH")`）。`"low"` / `"medium"` 為 Gemini 專屬，Gemma 不接受。

**注意**：`openai` 套件目前只被 `gemma_client.py` 使用，重寫後可從 `pyproject.toml` 移除。

### 決策 5：測試 mock 路徑不變

所有測試均在函式層級 patch（`app.services.ocr_pipeline.gemma_client.extract_from_image`），不依賴底層 SDK。重寫後 mock 路徑無需調整。

## Risks / Trade-offs

- **`thinking_level` 有效值**（已解決）→ Gemma 4 實測確認只接受 `"MINIMAL"` 和 `"HIGH"`；停用思考須完全省略 `thinking_config`（`thinking_budget=0` 亦不被接受）。`"low"` / `"medium"` 為 Gemini 專屬，傳入會得到 400 INVALID_ARGUMENT。
- **`client.aio` 為實驗性 API** → 若 SDK 版本升級導致介面變動，需同步更新。鎖定 `google-genai>=1.0` 版本以求穩定。
- **`openai` 套件移除** → 若未來其他模組引入 `openai`，需重新加回依賴。

## Migration Plan

1. 在 `backend/pyproject.toml` 加入 `google-genai`，移除 `openai`
2. 重寫 `gemma_client.py`（保留函式簽名）
3. 更新 `app/config.py`：移除 `gemma_endpoint_url`，新增 `gemma_thinking_level`
4. 更新 `backend/.env.example`
5. 執行 `uv run pytest` 確認所有測試通過
6. 手動以實際 API Key 測試一張發票圖片

**回滾**：git revert 該 commit，恢復 `openai` 依賴與原 `gemma_client.py`。

## Open Questions

（已全部解決，無待確認事項）
