"""
Lightweight input/output safety checks (SRS content safety).
Does not replace OpenAI Moderation API for production at scale.
"""
import re
from typing import Tuple

_MAX_QUERY_LEN = 8000
_MAX_OUTPUT_CHECK_LEN = 32000

# Disallowed patterns: obvious prompt-injection / harmful request cues (minimal list)
_BLOCKED_SUBSTRINGS = (
    "ignore all previous",
    "ignore previous instructions",
    "system override",
    "you are now",
    "bypass safety",
    "jailbreak",
    "dan mode",
    "kill yourself",
    "how to make a bomb",
    "how to synthesize",
)

_OUTPUT_BLOCKED = (
    "ignore all previous",
    "bypass safety",
)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def check_input(text: str) -> Tuple[bool, str]:
    """Returns (ok, reason_if_not_ok)."""
    if not text or not text.strip():
        return False, "Query must not be empty."
    if len(text) > _MAX_QUERY_LEN:
        return False, f"Query exceeds maximum length ({_MAX_QUERY_LEN} characters)."
    low = _normalize(text)
    for b in _BLOCKED_SUBSTRINGS:
        if b in low:
            return False, "Content safety: request blocked by guardrail policy."
    return True, ""


def check_output(text: str) -> Tuple[bool, str]:
    """Screen model output before returning to client."""
    if text is None:
        return True, ""
    sample = text[:_MAX_OUTPUT_CHECK_LEN]
    low = _normalize(sample)
    for b in _OUTPUT_BLOCKED:
        if b in low:
            return False, "Content safety: output blocked by guardrail policy."
    return True, ""
