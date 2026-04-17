from datetime import date
from decimal import Decimal
from app.services.qr_parser import parse_qr_left, parse_qr_right


class TestParseQrLeft:
    def test_standard_format(self):
        raw = "AB12345678:1130315:1234:950:1000:0000000000:12345678:VERIFY:ENCRYPTED"
        result = parse_qr_left(raw)
        assert result["invoice_number"] == "AB12345678"
        assert result["purchase_date"] == date(2024, 3, 15)
        assert result["random_code"] == "1234"
        assert result["amount_untaxed"] == Decimal("950")
        assert result["amount_total"] == Decimal("1000")
        assert result["buyer_tax_id"] is None  # B2C zeros
        assert result["seller_tax_id"] == "12345678"

    def test_b2c_buyer_tax_id_zero_8digits(self):
        """8-digit all-zeros buyer tax ID (standard B2C format) should be treated as None."""
        raw = "XX99999999:1120101:9999:100:105:00000000:87654321:V:E"
        result = parse_qr_left(raw)
        assert result["buyer_tax_id"] is None

    def test_b2c_buyer_tax_id_zero_10digits(self):
        """10-digit all-zeros variant should also be treated as None."""
        raw = "XX99999999:1120101:9999:100:105:0000000000:87654321:V:E"
        result = parse_qr_left(raw)
        assert result["buyer_tax_id"] is None

    def test_b2b_buyer_tax_id_preserved(self):
        raw = "XX99999999:1120101:9999:100:105:11223344:87654321:V:E"
        result = parse_qr_left(raw)
        assert result["buyer_tax_id"] == "11223344"

    def test_roc_year_conversion(self):
        # ROC 111 = AD 2022
        raw = "AB00000000:1110601:0000:0:0:0000000000:00000000:V:E"
        result = parse_qr_left(raw)
        assert result["purchase_date"] == date(2022, 6, 1)

    def test_empty_string(self):
        result = parse_qr_left("")
        assert result["invoice_number"] is None
        assert result["purchase_date"] is None

    def test_too_few_parts(self):
        result = parse_qr_left("AB12345678:1130315")
        assert result["invoice_number"] is None


class TestParseQrRight:
    def test_standard_items(self):
        raw = "咖啡:1:80**蛋糕:2:50"
        items = parse_qr_right(raw)
        assert len(items) == 2
        assert items[0]["item_name"] == "咖啡"
        assert items[0]["quantity"] == Decimal("1")
        assert items[0]["unit_price"] == Decimal("80")
        assert items[1]["item_name"] == "蛋糕"
        assert items[1]["quantity"] == Decimal("2")
        assert items[1]["unit_price"] == Decimal("50")

    def test_item_amount_calculated(self):
        raw = "商品A:3:100"
        items = parse_qr_right(raw)
        assert items[0]["amount"] == Decimal("300")

    def test_empty_string(self):
        items = parse_qr_right("")
        assert items == []

    def test_single_item(self):
        raw = "午餐:1:120"
        items = parse_qr_right(raw)
        assert len(items) == 1
        assert items[0]["item_name"] == "午餐"
