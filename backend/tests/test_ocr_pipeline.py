import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from app.services.ocr_pipeline import run_pipeline


class TestRunPipeline:
    @pytest.mark.asyncio
    async def test_qr_data_takes_priority_over_ocr(self):
        """QR invoice_number/amount should win over OCR values."""
        qr_left = "AB12345678:1130315:1234:950:1000:0000000000:12345678:V:E"
        ocr_response = {
            "invoice_number": "WRONG_NUM",
            "purchase_date": "2020-01-01",
            "seller_name": "好吃餐廳",
            "seller_tax_id": "WRONG",
            "amount_untaxed": 100,
            "amount_total": 200,
            "items": [],
        }

        with patch("app.services.ocr_pipeline.gemma_client.extract_from_image", new=AsyncMock(return_value=ocr_response)):
            with patch("app.services.ocr_pipeline.resize_image_base64", return_value="resized"):
                result = await run_pipeline(
                    image_base64="dummybase64",
                    qr_left=qr_left,
                    qr_right=None,
                    barcode_raw=None,
                )

        assert result["invoice_number"] == "AB12345678"
        assert result["amount_total"] == Decimal("1000")
        assert result["amount_untaxed"] == Decimal("950")
        # seller_name comes from OCR (QR doesn't have it)
        assert result["seller_name"] == "好吃餐廳"

    @pytest.mark.asyncio
    async def test_qr_items_preferred_over_ocr_items(self):
        qr_right = "咖啡:1:80**蛋糕:2:50"
        ocr_response = {
            "items": [{"item_name": "OCR_ITEM", "quantity": 1, "unit_price": 999, "amount": 999}]
        }

        with patch("app.services.ocr_pipeline.gemma_client.extract_from_image", new=AsyncMock(return_value=ocr_response)):
            with patch("app.services.ocr_pipeline.resize_image_base64", return_value="resized"):
                result = await run_pipeline(
                    image_base64="dummybase64",
                    qr_left=None,
                    qr_right=qr_right,
                    barcode_raw=None,
                )

        assert len(result["items"]) == 2
        assert result["items"][0]["item_name"] == "咖啡"

    @pytest.mark.asyncio
    async def test_ocr_items_used_when_no_qr_right(self):
        ocr_response = {
            "seller_name": "某商店",
            "items": [{"item_name": "商品A", "quantity": 1, "unit_price": 100, "amount": 100}],
        }

        with patch("app.services.ocr_pipeline.gemma_client.extract_from_image", new=AsyncMock(return_value=ocr_response)):
            with patch("app.services.ocr_pipeline.resize_image_base64", return_value="resized"):
                result = await run_pipeline(
                    image_base64="dummybase64",
                    qr_left=None,
                    qr_right=None,
                    barcode_raw=None,
                )

        assert len(result["items"]) == 1
        assert result["items"][0]["item_name"] == "商品A"

    @pytest.mark.asyncio
    async def test_ocr_failure_non_fatal(self):
        """OCR failure should not raise; pipeline continues with QR data."""
        qr_left = "AB12345678:1130315:1234:950:1000:0000000000:12345678:V:E"

        with patch("app.services.ocr_pipeline.gemma_client.extract_from_image", new=AsyncMock(side_effect=Exception("OCR down"))):
            result = await run_pipeline(
                image_base64="dummybase64",
                qr_left=qr_left,
                qr_right=None,
                barcode_raw=None,
            )

        assert result["invoice_number"] == "AB12345678"
        assert result["amount_total"] == Decimal("1000")

    @pytest.mark.asyncio
    async def test_no_inputs_returns_empty(self):
        result = await run_pipeline(None, None, None, None)
        assert result["invoice_number"] is None
        assert result["items"] == []

    @pytest.mark.asyncio
    async def test_random_code_falls_back_to_ocr(self):
        """random_code should be taken from OCR when no QR left data is present."""
        ocr_response = {
            "invoice_number": "WF51366221",
            "random_code": "7467",
            "seller_name": "Times PARKING",
            "seller_tax_id": "91605324",
            "buyer_tax_id": "05072925",
            "amount_untaxed": 114,
            "amount_total": 120,
            "items": [],
        }
        with patch("app.services.ocr_pipeline.gemma_client.extract_from_image", new=AsyncMock(return_value=ocr_response)):
            with patch("app.services.ocr_pipeline.resize_image_base64", return_value="resized"):
                result = await run_pipeline(
                    image_base64="dummybase64",
                    qr_left=None,
                    qr_right=None,
                    barcode_raw=None,
                )

        assert result["random_code"] == "7467"

    @pytest.mark.asyncio
    async def test_amount_tax_derived(self):
        """amount_tax = amount_total - amount_untaxed when only those two are present."""
        qr_left = "AB12345678:1130315:1234:950:1000:0000000000:12345678:V:E"
        with patch("app.services.ocr_pipeline.gemma_client.extract_from_image", new=AsyncMock(return_value={})):
            result = await run_pipeline(None, qr_left, None, None)

        assert result["amount_tax"] == Decimal("50")
