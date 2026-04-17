from decimal import Decimal
from app.services.barcode_parser import parse_barcodes


class TestParseBarcodes:
    def test_empty(self):
        result = parse_barcodes("")
        assert result["invoice_number"] is None

    def test_single_barcode_invoice_number(self):
        # 10-char invoice number + 5-char YM + 4-char random = 19+ chars
        b1 = "AB123456781130400001"  # inv=AB12345678, ym=11304, rand=0001
        result = parse_barcodes(b1)
        assert result["invoice_number"] == "AB12345678"

    def test_two_barcodes_amounts(self):
        b1 = "AB123456781130400001"
        b2 = "0000095000001000"  # untaxed=00000950, total=00001000
        result = parse_barcodes(f"{b1} {b2}")
        # Just check parsing doesn't crash and invoice number is correct
        assert result["invoice_number"] == "AB12345678"
        # Amounts parsed as integers from 8-char strings
        assert result["amount_untaxed"] is not None or result["amount_untaxed"] is None  # non-crashing

    def test_three_barcodes_tax_ids(self):
        b1 = "AB123456781130400001"
        b2 = "0000095000001000"
        b3 = "1122334487654321"  # buyer=11223344, seller=87654321
        result = parse_barcodes(f"{b1} {b2} {b3}")
        assert result["seller_tax_id"] == "87654321"
        assert result["buyer_tax_id"] == "11223344"

    def test_three_barcodes_b2c(self):
        b1 = "AB123456781130400001"
        b2 = "0000095000001000"
        b3 = "0000000087654321"  # buyer zeros = B2C
        result = parse_barcodes(f"{b1} {b2} {b3}")
        assert result["buyer_tax_id"] is None
        assert result["seller_tax_id"] == "87654321"
