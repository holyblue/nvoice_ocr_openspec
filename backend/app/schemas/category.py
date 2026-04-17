from typing import Optional
from pydantic import BaseModel


class CategoryRuleResponse(BaseModel):
    id: int
    rule_type: str
    rule_value: str
    priority: int

    model_config = {"from_attributes": True}


class CategoryResponse(BaseModel):
    id: int
    code: str
    name: str
    account_code: Optional[str] = None
    rules: list[CategoryRuleResponse] = []

    model_config = {"from_attributes": True}


class CategoryImportResult(BaseModel):
    created: int
    updated: int
    skipped: int
    warnings: list[str] = []
