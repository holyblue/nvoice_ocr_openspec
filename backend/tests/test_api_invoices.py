import pytest
import base64
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app

# StaticPool ensures all connections share the same in-memory DB
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


DUMMY_IMAGE_B64 = base64.b64encode(b"dummy").decode()

SCAN_QR_PAYLOAD = {
    "image_base64": DUMMY_IMAGE_B64,
    "qr_left": "AB12345678:1130315:1234:950:1000:0000000000:12345678:V:E",
    "qr_right": "咖啡:1:80**蛋糕:2:50",
    "barcode_raw": None,
}

MOCK_PIPELINE_RESULT = {
    "invoice_number": "AB12345678",
    "random_code": "1234",
    "purchase_date": None,
    "seller_name": "好吃咖啡廳",
    "seller_tax_id": "12345678",
    "buyer_tax_id": None,
    "amount_untaxed": 950,
    "amount_tax": 50,
    "amount_total": 1000,
    "items": [
        {"item_name": "咖啡", "quantity": 1, "unit_price": 80, "amount": 80},
        {"item_name": "蛋糕", "quantity": 2, "unit_price": 50, "amount": 100},
    ],
}

MOCK_CLASSIFICATION = MagicMock()
MOCK_CLASSIFICATION.category_id = None
MOCK_CLASSIFICATION.source = "llm"
MOCK_CLASSIFICATION.confidence = 0.0
MOCK_CLASSIFICATION.reasoning = None


class TestScanInvoice:
    def test_scan_creates_invoice(self):
        with patch("app.routers.invoices.run_pipeline", new=AsyncMock(return_value=MOCK_PIPELINE_RESULT)):
            with patch("app.routers.invoices.classify", new=AsyncMock(return_value=MOCK_CLASSIFICATION)):
                with patch("app.routers.invoices.save_base64_image"):
                    with TestClient(app) as client:
                        response = client.post("/api/v1/invoices/scan", json=SCAN_QR_PAYLOAD)

        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"] == "AB12345678"
        assert data["status"] == "pending"

    def test_scan_duplicate_returns_409(self):
        with patch("app.routers.invoices.run_pipeline", new=AsyncMock(return_value=MOCK_PIPELINE_RESULT)):
            with patch("app.routers.invoices.classify", new=AsyncMock(return_value=MOCK_CLASSIFICATION)):
                with patch("app.routers.invoices.save_base64_image"):
                    with TestClient(app) as client:
                        client.post("/api/v1/invoices/scan", json=SCAN_QR_PAYLOAD)
                        response = client.post("/api/v1/invoices/scan", json=SCAN_QR_PAYLOAD)

        assert response.status_code == 409

    def test_list_invoices(self):
        with patch("app.routers.invoices.run_pipeline", new=AsyncMock(return_value=MOCK_PIPELINE_RESULT)):
            with patch("app.routers.invoices.classify", new=AsyncMock(return_value=MOCK_CLASSIFICATION)):
                with patch("app.routers.invoices.save_base64_image"):
                    with TestClient(app) as client:
                        client.post("/api/v1/invoices/scan", json=SCAN_QR_PAYLOAD)
                        response = client.get("/api/v1/invoices/")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1

    def test_get_invoice(self):
        with patch("app.routers.invoices.run_pipeline", new=AsyncMock(return_value=MOCK_PIPELINE_RESULT)):
            with patch("app.routers.invoices.classify", new=AsyncMock(return_value=MOCK_CLASSIFICATION)):
                with patch("app.routers.invoices.save_base64_image"):
                    with TestClient(app) as client:
                        create_resp = client.post("/api/v1/invoices/scan", json=SCAN_QR_PAYLOAD)
                        inv_id = create_resp.json()["id"]
                        response = client.get(f"/api/v1/invoices/{inv_id}")

        assert response.status_code == 200
        assert response.json()["invoice_number"] == "AB12345678"

    def test_update_invoice_status(self):
        with patch("app.routers.invoices.run_pipeline", new=AsyncMock(return_value=MOCK_PIPELINE_RESULT)):
            with patch("app.routers.invoices.classify", new=AsyncMock(return_value=MOCK_CLASSIFICATION)):
                with patch("app.routers.invoices.save_base64_image"):
                    with TestClient(app) as client:
                        create_resp = client.post("/api/v1/invoices/scan", json=SCAN_QR_PAYLOAD)
                        inv_id = create_resp.json()["id"]
                        response = client.put(f"/api/v1/invoices/{inv_id}", json={"status": "confirmed"})

        assert response.status_code == 200
        assert response.json()["status"] == "confirmed"

    def test_delete_invoice(self):
        with patch("app.routers.invoices.run_pipeline", new=AsyncMock(return_value=MOCK_PIPELINE_RESULT)):
            with patch("app.routers.invoices.classify", new=AsyncMock(return_value=MOCK_CLASSIFICATION)):
                with patch("app.routers.invoices.save_base64_image"):
                    with TestClient(app) as client:
                        create_resp = client.post("/api/v1/invoices/scan", json=SCAN_QR_PAYLOAD)
                        inv_id = create_resp.json()["id"]
                        del_resp = client.delete(f"/api/v1/invoices/{inv_id}")
                        assert del_resp.status_code == 204
                        get_resp = client.get(f"/api/v1/invoices/{inv_id}")
                        assert get_resp.status_code == 404
