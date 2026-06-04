import feedparser
from typing import List

def get_stock_news(symbol: str, company_name: str = "") -> List[dict]:
    """
    Fetch news via free RSS feeds — no API key needed.
    Sources: Google News RSS (completely free, no limit for personal use)
    """
    clean  = symbol.replace(".NS","").replace(".BO","").strip()
    query  = company_name.strip() if company_name else clean
    
    feeds = [
        f"https://news.google.com/rss/search?q={query}+stock+NSE&hl=en-IN&gl=IN&ceid=IN:en",
        f"https://news.google.com/rss/search?q={clean}+share+price&hl=en-IN&gl=IN&ceid=IN:en",
        f"https://news.google.com/rss/search?q={query}+India&hl=en-IN&gl=IN&ceid=IN:en",
    ]

    seen, items = set(), []

    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:6]:
                title = (entry.get("title") or "").strip()
                if not title or title in seen:
                    continue
                seen.add(title)
                items.append({
                    "title":     title,
                    "link":      entry.get("link", ""),
                    "published": getattr(entry, "published", ""),
                    "source":    feed.feed.get("title", "Google News"),
                    "summary":   (entry.get("summary") or "")[:200],
                })
                if len(items) >= 8:
                    break
        except Exception:
            continue
        if len(items) >= 8:
            break

    return items
