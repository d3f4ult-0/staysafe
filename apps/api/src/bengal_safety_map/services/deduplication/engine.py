"""Staged Entity Resolution and Conservative Deduplication Engine."""
from typing import Dict, Any, List, Optional, Tuple


class DeduplicationEngine:
    """
    Conservative deduplication:
    False merges are dangerous and distort civic transparency.
    Exact matches are resolved; ambiguous candidates are routed to operator review.
    """

    @staticmethod
    def evaluate_candidate_match(
        new_record: Dict[str, Any],
        existing_record: Dict[str, Any],
    ) -> Tuple[float, List[str], str]:
        """
        Calculates match score between two incident records.
        Returns: (confidence_score, match_reasons, recommended_status)
        """
        reasons = []
        score = 0.0

        # Exact source ID match
        if new_record.get("source_record_id") and new_record.get("source_record_id") == existing_record.get("source_record_id"):
            reasons.append("exact_source_record_id")
            score += 0.95

        # Exact category match
        if new_record.get("category_code") == existing_record.get("category_code"):
            reasons.append("same_category")
            score += 0.25

        # Same administrative area / ward
        if new_record.get("administrative_area_id") == existing_record.get("administrative_area_id"):
            reasons.append("same_administrative_ward")
            score += 0.25

        # Date proximity (within same calendar date)
        new_date = str(new_record.get("occurred_at", ""))[:10]
        exist_date = str(existing_record.get("occurred_at", ""))[:10]
        if new_date and exist_date and new_date == exist_date:
            reasons.append("same_occurrence_date")
            score += 0.25

        confidence = min(score, 1.0)

        # Recommendation routing:
        # Only true exact source matches reach >= 0.95.
        # Attribute matches (category + ward + date) reach 0.75, which triggers operator review.
        if confidence >= 0.95:
            status = "exact_match_merged"
        elif confidence >= 0.70:
            status = "pending_operator_review"
        else:
            status = "distinct_record"

        return round(confidence, 2), reasons, status
