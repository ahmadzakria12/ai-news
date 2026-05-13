"""
In-memory session context for multi-turn continuity (SRS session management).
Not persisted; suitable for demos and single-server deployments.
"""
from typing import Dict, List, Optional
import time
from collections import deque

_MAX_TURNS = 8
_SESSION_TTL_SEC = 30 * 60


class InMemorySessionStore:
    def __init__(self):
        # session_id -> deque of {"role": "user"|"assistant", "content": str}
        self._sessions: Dict[str, deque] = {}
        self._last_seen: Dict[str, float] = {}

    def _gc(self, now: float) -> None:
        expired = [sid for sid, t in self._last_seen.items() if now - t > _SESSION_TTL_SEC]
        for sid in expired:
            self._sessions.pop(sid, None)
            self._last_seen.pop(sid, None)

    def get_history_messages(self, session_id: Optional[str]) -> List[dict]:
        """OpenAI chat message dicts (user/assistant only), newest last, capped."""
        if not session_id or session_id not in self._sessions:
            return []
        now = time.time()
        self._gc(now)
        if session_id not in self._sessions:
            return []
        items = list(self._sessions[session_id])
        return [{"role": m["role"], "content": m["content"]} for m in items]

    def append_turn(self, session_id: str, user_text: str, assistant_text: str) -> None:
        now = time.time()
        self._gc(now)
        dq = self._sessions.setdefault(session_id, deque(maxlen=_MAX_TURNS * 2))
        dq.append({"role": "user", "content": user_text[:12000]})
        dq.append({"role": "assistant", "content": assistant_text[:12000]})
        self._last_seen[session_id] = now
