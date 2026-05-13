"""
Optional NewsAPI.org integration: articles include ``urlToImage`` when the publisher provides one.

Set ``NEWS_API_KEY`` in the backend environment (https://newsapi.org/register).
Free developer tier has daily request limits; results are merged with RSS in ``rss_live_news``.
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

BASE = "https://newsapi.org/v2"


def _fmt_published(published_at: Optional[str]) -> str:
    if not published_at:
        return "Recent"
    try:
        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except (TypeError, ValueError):
        return str(published_at)[:19]


def _articles_to_rows(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for a in articles or []:
        url = (a.get("url") or "").strip()
        title = (a.get("title") or "").strip()
        if not url or not title or len(title) < 8:
            continue
        if "removed" in url.lower() or title.lower().startswith("[removed]"):
            continue
        desc = (a.get("description") or a.get("content") or "") or ""
        desc = desc.replace("\n", " ").strip()[:400]
        src = a.get("source") or {}
        src_name = src.get("name") if isinstance(src, dict) else str(src)
        img = (a.get("urlToImage") or "").strip() or None
        out.append(
            {
                "title": title[:200],
                "summary": desc or title[:200],
                "url": url,
                "image_url": img,
                "source": (src_name or "NewsAPI").strip(),
                "time": _fmt_published(a.get("publishedAt")),
            }
        )
    return out


def _get_json(path: str, params: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    q = {k: v for k, v in params.items() if v is not None}
    q["apiKey"] = api_key
    with httpx.Client(timeout=20.0, follow_redirects=True) as client:
        r = client.get(f"{BASE}/{path}", params=q)
        if r.status_code != 200:
            return {"status": "error", "message": r.text[:200]}
        return r.json()


def fetch_newsapi_items_for_categories(
    categories: List[str],
    page_size: int = 24,
) -> List[Dict[str, Any]]:
    """
    Map UI categories to NewsAPI ``top-headlines`` or ``everything`` calls.
    Returns [] if ``NEWS_API_KEY`` is unset or the API returns an error.
    """
    api_key = os.environ.get("NEWS_API_KEY", "").strip()
    if not api_key:
        return []

    keys = [c.strip().lower().replace("-", "_") for c in categories if c and str(c).strip()]
    if not keys or "all" in keys:
        # Default "all" = tech-heavy headlines (matches AI News Desk focus)
        data = _get_json(
            "top-headlines",
            {"category": "technology", "language": "en", "pageSize": min(page_size, 30)},
            api_key,
        )
    else:
        k = keys[0]
        if k == "ai_tech":
            data = _get_json(
                "top-headlines",
                {"category": "technology", "language": "en", "pageSize": page_size},
                api_key,
            )
        elif k == "health":
            data = _get_json(
                "top-headlines",
                {"category": "health", "country": "us", "pageSize": page_size},
                api_key,
            )
        elif k == "sports":
            data = _get_json(
                "top-headlines",
                {"category": "sports", "country": "us", "pageSize": page_size},
                api_key,
            )
        elif k == "crypto":
            data = _get_json(
                "everything",
                {
                    "q": "cryptocurrency OR bitcoin OR ethereum",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": min(page_size, 20),
                },
                api_key,
            )
        elif k == "politics":
            data = _get_json(
                "everything",
                {
                    "q": "politics",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": min(page_size, 20),
                },
                api_key,
            )
        elif k == "pakistan":
            data = _get_json(
                "everything",
                {
                    "q": "Pakistan",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": min(page_size, 20),
                },
                api_key,
            )
        elif k == "world":
            data = _get_json(
                "everything",
                {
                    "q": "international news OR world affairs",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": min(page_size, 20),
                },
                api_key,
            )
        else:
            data = _get_json(
                "top-headlines",
                {"country": "us", "pageSize": min(page_size, 25)},
                api_key,
            )

    if data.get("status") != "ok":
        return []

    return _articles_to_rows(data.get("articles") or [])
