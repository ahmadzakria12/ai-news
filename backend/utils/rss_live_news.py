"""
Fetch real headlines + image URLs from RSS feeds and optionally NewsAPI.org
(``urlToImage``). No AI-generated images.
"""
from __future__ import annotations

import html
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urlparse

import feedparser

from utils.newsapi_live_news import fetch_newsapi_items_for_categories

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    if not text:
        return ""
    plain = _TAG_RE.sub(" ", text)
    plain = html.unescape(plain)
    return re.sub(r"\s+", " ", plain).strip()


def _entry_image_url(entry: Any) -> Optional[str]:
    """Best-effort image from RSS/Atom (publisher thumbnails, media tags, enclosures)."""
    thumbs = getattr(entry, "media_thumbnail", None) or []
    if thumbs and isinstance(thumbs, (list, tuple)) and thumbs[0].get("url"):
        return str(thumbs[0]["url"]).strip()

    media = getattr(entry, "media_content", None) or []
    for m in media:
        if not isinstance(m, dict):
            continue
        t = (m.get("type") or "").lower()
        if t.startswith("image/") or m.get("medium") == "image":
            u = m.get("url")
            if u:
                return str(u).strip()

    for link in getattr(entry, "links", None) or []:
        if not isinstance(link, dict):
            continue
        t = (link.get("type") or "").lower()
        if t.startswith("image/") and link.get("href"):
            return str(link["href"]).strip()

    for enc in getattr(entry, "enclosures", None) or []:
        if not isinstance(enc, dict):
            continue
        t = (enc.get("type") or "").lower()
        if t.startswith("image/") and enc.get("href"):
            return str(enc["href"]).strip()

    return None


def _entry_time(entry: Any) -> str:
    parsed = getattr(entry, "published_parsed", None) or getattr(entry, "updated_parsed", None)
    if parsed:
        try:
            return datetime(*parsed[:6]).strftime("%Y-%m-%d %H:%M UTC")
        except (TypeError, ValueError):
            pass
    return (getattr(entry, "published", None) or getattr(entry, "updated", None) or "Recent").strip()


def _entry_source(feed_title: str, entry: Any) -> str:
    author = getattr(entry, "author", None) or ""
    if author and len(author) < 80:
        return f"{feed_title} · {author}"
    return feed_title


def _fetch_feed(url: str, max_items: int) -> List[Dict[str, Any]]:
    parsed = feedparser.parse(
        url,
        agent="AI-News-Desk/1.0 (+https://github.com/)",
    )
    if getattr(parsed, "bozo", False) and not parsed.entries:
        return []

    feed_title = (parsed.feed.get("title") or urlparse(url).netloc or "News").strip()
    out: List[Dict[str, Any]] = []
    for entry in parsed.entries[: max_items * 2]:
        title = (getattr(entry, "title", None) or "").strip()
        link = (getattr(entry, "link", None) or "").strip()
        if not title or not link or len(title) < 8:
            continue
        summary_raw = (
            getattr(entry, "summary", None)
            or getattr(entry, "description", None)
            or ""
        )
        summary = _strip_html(str(summary_raw))[: 400]
        img = _entry_image_url(entry)
        out.append(
            {
                "title": title[: 200],
                "summary": summary or title[: 200],
                "url": link,
                "image_url": img,
                "source": _entry_source(feed_title, entry),
                "time": _entry_time(entry),
            }
        )
        if len(out) >= max_items:
            break
    return out


# Category -> list of RSS feed URLs (reputable sources; images when publishers embed them)
CATEGORY_FEEDS: Dict[str, List[str]] = {
    "all": [
        "https://feeds.bbci.co.uk/news/technology/rss.xml",
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://feeds.bbci.co.uk/news/business/rss.xml",
    ],
    "ai_tech": [
        "https://feeds.bbci.co.uk/news/technology/rss.xml",
        "https://www.theverge.com/rss/index.xml",
    ],
    "crypto": [
        "https://www.coindesk.com/arc/outboundfeeds/rss/",
        "https://feeds.bbci.co.uk/news/business/rss.xml",
    ],
    "politics": [
        "https://feeds.bbci.co.uk/news/politics/rss.xml",
    ],
    "health": [
        "https://feeds.bbci.co.uk/news/health/rss.xml",
    ],
    "pakistan": [
        "https://www.dawn.com/feeds/pakistan",
        "https://feeds.bbci.co.uk/news/world/asia/rss.xml",
    ],
    "sports": [
        "https://feeds.bbci.co.uk/sport/rss.xml",
    ],
    "world": [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
    ],
}


def _merge_news_lists(
    primary: List[Dict[str, Any]],
    secondary: List[Dict[str, Any]],
    max_total: int,
) -> List[Dict[str, Any]]:
    """Deduplicate by URL; prefer rows that include ``image_url`` when URLs collide."""
    dedup: Dict[str, Dict[str, Any]] = {}
    order: List[str] = []

    def add_row(row: Dict[str, Any]) -> None:
        u = row["url"]
        if u not in dedup:
            dedup[u] = row
            order.append(u)
            return
        cur = dedup[u]
        new_img = row.get("image_url")
        old_img = cur.get("image_url")
        if new_img and not old_img:
            dedup[u] = row

    for row in primary:
        add_row(row)
    for row in secondary:
        add_row(row)
    return [dedup[u] for u in order][:max_total]


def fetch_live_news_with_meta(
    categories: List[str],
    per_feed: int = 10,
    max_total: int = 28,
) -> tuple[List[Dict[str, Any]], str]:
    """
    Live headlines: **NewsAPI.org first** when ``NEWS_API_KEY`` is set (title, description,
    ``urlToImage``). If the key is missing or NewsAPI returns nothing, falls back to RSS only.
    Never calls OpenAI.

    Returns ``(items, provider)`` where ``provider`` is ``\"newsapi\"``, ``\"rss\"``, or
    ``\"rss_fallback\"`` (NewsAPI key set but empty/error, then RSS).
    """
    keys = [c.strip().lower().replace("-", "_") for c in categories if c and str(c).strip()]
    api_cats = ["all"] if (not keys or "all" in keys) else keys

    api_key = os.environ.get("NEWS_API_KEY", "").strip()
    if api_key:
        rows = fetch_newsapi_items_for_categories(api_cats, page_size=max_total)
        if rows:
            return rows[:max_total], "newsapi"

    rss_items = _fetch_rss_only(keys, per_feed, max_total)
    if not rss_items:
        return [], "empty"
    return rss_items, "rss_fallback" if api_key else "rss"


def _fetch_rss_only(keys: List[str], per_feed: int, max_total: int) -> List[Dict[str, Any]]:
    if not keys or "all" in keys:
        feed_urls = list(CATEGORY_FEEDS["all"])
    else:
        seen_u: Set[str] = set()
        feed_urls = []
        for k in keys:
            for u in CATEGORY_FEEDS.get(k, CATEGORY_FEEDS["all"]):
                if u not in seen_u:
                    seen_u.add(u)
                    feed_urls.append(u)

    all_rows: List[Dict[str, Any]] = []
    for url in feed_urls:
        try:
            all_rows.extend(_fetch_feed(url, per_feed))
        except Exception:
            continue
    return _merge_news_lists([], all_rows, max_total)


def fetch_live_news_items(categories: List[str], per_feed: int = 10, max_total: int = 28) -> List[Dict[str, Any]]:
    """Backward-compatible: same as ``fetch_live_news_with_meta`` but returns only the list."""
    items, _ = fetch_live_news_with_meta(categories, per_feed, max_total)
    return items
