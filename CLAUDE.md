# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend

All Python commands use `uv`. Run from `backend/`.

```bash
uv run uvicorn app.main:app --reload   # start API server (port 8000)
uv run pytest                          # run all tests
uv run pytest tests/test_qr_parser.py # run a single test file
uv run pytest -k "test_parse_qr_left" # run a single test by name
uv run alembic upgrade head            # apply migrations
uv run alembic revision --autogenerate -m "description"  # new migration
```

### Frontend

Run from `frontend/`.

```bash
npm run dev      # start Vite dev server (port 5173)
npm run build    # type-check + production build
npx tsc --noEmit # type-check only
```

## Architecture

### Data flow

```
Browser → Vite dev server (/api proxy) → FastAPI (port 8000) → SQLite
```

The Vite proxy rewrites all `/api/*` requests to `http://localhost:8000`, so the frontend never needs to know the backend port.

### Backend

**Entry point:** `app/main.py` — mounts all routers under `/api/v1`, adds CORS for `localhost:5173`.

**OCR pipeline** (`services/ocr_pipeline.py`): The core logic. Called by `POST /invoices/scan`. Runs QR parsing → barcode parsing → Gemma Vision OCR → merge. Merge priority is strictly **QR > OCR > barcode** for every field except `seller_name`, which only comes from OCR (QR codes don't carry it).

**Classifier** (`services/classifier.py`): Two phases:
1. Rule-based — scores all `CategoryRule` rows against the invoice; `seller_tax_id` exact match gets `priority × 2` weight. Confidence = top score / (top score + 10).
2. LLM fallback — if confidence < 0.5, calls Gemma with a JSON prompt and parses `category_code`/`confidence`/`reasoning` from the response.

**Gemma client** (`services/gemma_client.py`): Uses the `openai` SDK pointed at `GEMMA_ENDPOINT_URL`. Accepts an optional `hint_json` dict that is injected into the prompt (pre-filled QR data to guide extraction).

**Database:** SQLAlchemy with SQLite. `app/database.py` exposes `get_db` (FastAPI dependency). Models live in `app/models/`; Alembic manages migrations.

### Frontend

**State split:** Zustand for ephemeral client state (`invoiceStore` for the current scan draft, `bundleStore` for the selected bundle); TanStack Query for all server data (invoices, bundles, categories).

**Scan wizard** (`pages/ScanPage.tsx`): Four steps — `capture → qr → barcode → processing → review`. `invoiceStore` accumulates `imageBase64`, `qrLeft`, `qrRight`, `barcodeRaw` across steps, then calls `POST /invoices/scan` and drops into the review form.

**Tailwind v4:** Uses `@tailwindcss/vite` plugin — no `tailwind.config.ts`. The only CSS entry is `@import "tailwindcss"` in `src/index.css`.

### Testing patterns

Integration tests (`tests/test_api_invoices.py`) use an in-memory SQLite engine with `StaticPool` (so all connections share one DB), override `get_db` via `app.dependency_overrides`, and recreate the schema in an `autouse` fixture around each test. Gemma calls are always mocked with `unittest.mock.AsyncMock`.

## Environment

Backend config is driven by `backend/.env` (see `.env.example`). Key variables:

| Variable | Default | Purpose |
|---|---|---|
| `GEMMA_ENDPOINT_URL` | `http://localhost:8080/v1` | OpenAI-compatible Vision endpoint |
| `GEMMA_API_KEY` | `dummy` | API key for the endpoint |
| `GEMMA_MODEL_NAME` | `gemma4` | Model name sent in requests |
| `DATABASE_URL` | `sqlite:///./invoice_ocr.db` | SQLAlchemy connection string |
| `UPLOAD_DIR` | `storage/uploads` | Where invoice images are saved |
