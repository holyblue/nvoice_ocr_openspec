import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.classifier import classify_by_rules, classify_by_llm, classify
from app.models.category import Category, CategoryRule
from app.schemas.invoice import ClassificationSuggestion


def make_db_with_rules(rules_config):
    """Create a mock db with categories and rules."""
    db = MagicMock()

    categories = {}
    rules = []

    for cfg in rules_config:
        cat_id = cfg["cat_id"]
        if cat_id not in categories:
            cat = MagicMock(spec=Category)
            cat.id = cat_id
            cat.code = cfg["cat_code"]
            cat.name = cfg["cat_name"]
            categories[cat_id] = cat

        rule = MagicMock(spec=CategoryRule)
        rule.category_id = cat_id
        rule.rule_type = cfg["rule_type"]
        rule.rule_value = cfg["rule_value"]
        rule.priority = cfg["priority"]
        rule.category = categories[cat_id]
        rules.append(rule)

    query_mock = MagicMock()
    query_mock.join.return_value = query_mock
    query_mock.order_by.return_value = query_mock
    query_mock.all.return_value = rules
    query_mock.filter.return_value = query_mock
    query_mock.first.return_value = None

    db.query.return_value = query_mock
    return db


class TestClassifyByRules:
    def test_seller_tax_id_exact_match(self):
        db = make_db_with_rules([{
            "cat_id": 1, "cat_code": "MEALS", "cat_name": "餐費",
            "rule_type": "seller_tax_id", "rule_value": "12345678", "priority": 10,
        }])
        invoice = {"seller_tax_id": "12345678", "seller_name": "", "items": []}
        result = classify_by_rules(invoice, db)
        assert result is not None
        assert result.category_code == "MEALS"
        assert result.source == "rule"
        # seller_tax_id gives 10*2=20, confidence = 20/30 ≈ 0.667
        assert result.confidence >= 0.5

    def test_seller_name_contains_match(self):
        db = make_db_with_rules([{
            "cat_id": 2, "cat_code": "TRANSPORT", "cat_name": "交通費",
            "rule_type": "seller_name_contains", "rule_value": "台鐵", "priority": 20,
        }])
        invoice = {"seller_name": "台灣台鐵公司", "seller_tax_id": None, "items": []}
        result = classify_by_rules(invoice, db)
        assert result is not None
        assert result.category_code == "TRANSPORT"

    def test_no_match_returns_none(self):
        db = make_db_with_rules([{
            "cat_id": 1, "cat_code": "MEALS", "cat_name": "餐費",
            "rule_type": "seller_tax_id", "rule_value": "99999999", "priority": 10,
        }])
        invoice = {"seller_tax_id": "00000000", "seller_name": "", "items": []}
        result = classify_by_rules(invoice, db)
        assert result is None

    def test_item_name_contains_match(self):
        db = make_db_with_rules([{
            "cat_id": 3, "cat_code": "OFFICE", "cat_name": "辦公費",
            "rule_type": "item_name_contains", "rule_value": "文具", "priority": 20,
        }])
        invoice = {
            "seller_name": "",
            "seller_tax_id": None,
            "items": [{"item_name": "筆記本文具組合"}],
        }
        result = classify_by_rules(invoice, db)
        assert result is not None
        assert result.category_code == "OFFICE"


class TestClassifyByLlm:
    @pytest.mark.asyncio
    async def test_llm_success(self):
        mock_result = {"category_code": "MEALS", "confidence": 0.85, "reasoning": "這是餐廳消費"}

        db = MagicMock()
        cat = MagicMock(spec=Category)
        cat.id = 1
        cat.code = "MEALS"
        cat.name = "餐費"
        cat.account_code = "5161"

        query_mock = MagicMock()
        query_mock.all.return_value = [cat]
        query_mock.filter.return_value = query_mock
        query_mock.first.return_value = cat
        db.query.return_value = query_mock

        with patch("app.services.gemma_client.classify_with_llm", new=AsyncMock(return_value=mock_result)):
            invoice = {"seller_name": "好吃餐廳", "seller_tax_id": None, "items": [], "amount_total": 500}
            result = await classify_by_llm(invoice, db)

        assert result.source == "llm"
        assert result.confidence == 0.85

    @pytest.mark.asyncio
    async def test_llm_failure_returns_zero_confidence(self):
        db = MagicMock()
        query_mock = MagicMock()
        query_mock.all.return_value = []
        query_mock.filter.return_value = query_mock
        query_mock.first.return_value = None
        db.query.return_value = query_mock

        with patch("app.services.gemma_client.classify_with_llm", new=AsyncMock(side_effect=Exception("connection error"))):
            invoice = {"seller_name": "某商店", "seller_tax_id": None, "items": [], "amount_total": 100}
            result = await classify_by_llm(invoice, db)

        assert result.source == "llm"
        assert result.confidence == 0.0
        assert result.category_id is None
