"""Base Source Adapter Interface."""
from abc import ABC, abstractmethod
from typing import Dict, Any, List


class BaseSourceAdapter(ABC):
    @abstractmethod
    def get_source_id(self) -> str:
        """Unique source identifier."""
        pass

    @abstractmethod
    def is_enabled(self) -> bool:
        """Whether this adapter is configured and active."""
        pass

    @abstractmethod
    def fetch_raw_payload(self) -> Dict[str, Any]:
        """Fetch raw data payload from source endpoint or fixture."""
        pass

    @abstractmethod
    def parse_records(self, raw_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse raw payload into normalized staging records."""
        pass
