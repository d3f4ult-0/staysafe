"""Synthetic Demonstration Adapter and Unconfigured Template Adapters."""
import json
import os
from typing import Dict, Any, List
from bengal_safety_map.services.etl.adapters.base import BaseSourceAdapter


class SyntheticDemoAdapter(BaseSourceAdapter):
    """Adapter for ingesting synthetic test fixtures."""

    def __init__(self, fixture_path: str = "data/fixtures/demo_pilot_data.json"):
        self.fixture_path = fixture_path

    def get_source_id(self) -> str:
        return "wb_pilot_synthetic_demo"

    def is_enabled(self) -> bool:
        return True

    def fetch_raw_payload(self) -> Dict[str, Any]:
        if not os.path.exists(self.fixture_path):
            # Check relative to repo root
            root_path = os.path.join(os.path.dirname(__file__), "../../../../../../data/fixtures/demo_pilot_data.json")
            if os.path.exists(root_path):
                self.fixture_path = root_path

        with open(self.fixture_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def parse_records(self, raw_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        return raw_payload.get("incidents", [])


class UnconfiguredSourceAdapter(BaseSourceAdapter):
    """Template for prospective official source adapters."""

    def __init__(self, source_id: str, name: str):
        self.source_id = source_id
        self.name = name

    def get_source_id(self) -> str:
        return self.source_id

    def is_enabled(self) -> bool:
        # Intentionally disabled until legal, privacy, and technical access are validated
        return False

    def fetch_raw_payload(self) -> Dict[str, Any]:
        raise NotImplementedError(
            f"Source adapter '{self.source_id}' is unconfigured and pending legal/technical onboarding."
        )

    def parse_records(self, raw_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
