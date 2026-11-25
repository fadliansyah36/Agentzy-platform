"""Application service for sales lifecycle invariants and normalized provider payloads."""
from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from app.domain.sales import transition_allowed


class SalesService:
    @staticmethod
    def assert_lead_transition(current: str, target: str) -> None:
        if not transition_allowed(current,target):
            raise HTTPException(status_code=409,detail=f"Transisi lead {current} ke {target} tidak valid.")

    @staticmethod
    def assert_order_transition(current: str, target: str) -> None:
        if not transition_allowed(current,target,order=True):
            raise HTTPException(status_code=409,detail=f"Transisi order {current} ke {target} tidak valid.")

    @staticmethod
    def assert_offerable_coverage(status: str, product_id: str, expected_product_id: str) -> None:
        if status!="available" or product_id!=expected_product_id:
            raise HTTPException(status_code=409,detail="Offer hanya dapat dibuat dari coverage result available yang cocok.")

    @staticmethod
    def provider_submission_payload(order: dict[str,Any]) -> dict[str,Any]:
        return {
            "order_reference":str(order["order_number"]),
            "customer":{
                "name":order["customer_name"],"contact":order["contact_name"],
                "email":order["email"],"phone":order["phone"],
                "service_address":order["service_address"],
            },
            "product":{"code":order["product_code"],"name":order["product_name"]},
        }
