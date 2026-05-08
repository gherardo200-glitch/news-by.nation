import os
import json
import time
import urllib.parse
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from firebase_functions import scheduler_fn, options
import firebase_admin
from firebase_admin import firestore

# Initialize app once at module level (no credentials call here)
if not firebase_admin._apps:
    firebase_admin.initialize_app()

# Load supported countries at module level (no network/credentials needed)
dir_path = os.path.dirname(os.path.realpath(__file__))
with open(os.path.join(dir_path, "countries.json"), "r") as f:
    _data = json.load(f)
SUPPORTED_COUNTRIES = list(_data.keys())

# Financial assets to also fetch news for
FINANCIAL_ASSETS = {
    "XAU/USD": 'Gold "Spot Gold" (market OR price OR mining OR "central bank")',
    "WTI/USD": 'Oil "Crude Oil" (WTI OR price OR production OR OPEC)',
    "SPX":     'S&P500 "Stock Market" (economy OR index OR outlook OR earnings)',
    "IXIC":    'Nasdaq "Tech Stocks" (market OR AI OR semiconductors OR earnings)',
    "BTC/USD": 'Bitcoin "Crypto Market" (regulation OR institutional OR price)',
    "EUR/USD": 'Euro Dollar "Forex" (ECB OR Fed OR currency OR inflation)',
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}


def clean_html(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(separator=" ", strip=True)


def fetch_rss_articles(query: str, limit: int = 6) -> list:
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-US&gl=US&ceid=US:en"
    articles = []
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return []

        root = ET.fromstring(response.content)
        channel = root.find("channel")
        if not channel:
            return []

        for item in channel.findall("item")[:limit]:
            title   = item.findtext("title", "").strip()
            link    = item.findtext("link", "").strip()
            desc    = item.findtext("description", "")
            pubDate = item.findtext("pubDate", "")
            source  = item.findtext("source", "Google News")

            if not title or not link:
                continue

            # Parse pubDate → ISO 8601
            try:
                parsed_date = datetime.strptime(pubDate, "%a, %d %b %Y %H:%M:%S %Z")
                iso_date = parsed_date.isoformat() + "Z"
            except Exception:
                iso_date = datetime.utcnow().isoformat() + "Z"

            articles.append({
                "id":        link.split("/")[-1] if "/" in link else str(int(time.time())),
                "title":     title,
                "excerpt":   clean_html(desc)[:300],
                "source":    source,
                "url":       link,
                "timestamp": iso_date,
            })
    except Exception as e:
        print(f"RSS fetch error: {e}")

    return articles


# ── Scheduled Cloud Function ─────────────────────────────────────────────────
@scheduler_fn.on_schedule(
    schedule="*/15 * * * *",
    timeout_sec=540,
    memory=options.MemoryOption.MB_512,
)
def fetch_financial_news(event: scheduler_fn.ScheduledEvent) -> None:
    # Lazy-init Firestore client inside the handler (safe for cold starts)
    db = firestore.client()

    total = len(SUPPORTED_COUNTRIES) + len(FINANCIAL_ASSETS)
    print(f"Starting news sync for {len(SUPPORTED_COUNTRIES)} countries + {len(FINANCIAL_ASSETS)} financial assets ({total} total)...")

    # ── Country news ────────────────────────────────────────────────────────
    for country in SUPPORTED_COUNTRIES:
        query = f'"{country}" AND (economy OR finance OR geopolitics OR macroeconomics OR "central bank" OR politics)'
        articles = fetch_rss_articles(query, limit=6)

        if articles:
            doc_id = country.replace("/", "_")   # Firestore IDs cannot contain "/"
            db.collection("news_by_country").document(doc_id).set({
                "articles":     articles,
                "last_updated": datetime.utcnow().isoformat() + "Z",
            })
            print(f"  ✅ {country}: {len(articles)} articles written")
        else:
            print(f"  ⚠️  {country}: no articles found")

        time.sleep(1.0)   # courtesy delay — avoids Google News rate-limit

    # ── Financial asset news ─────────────────────────────────────────────────
    for symbol, query in FINANCIAL_ASSETS.items():
        articles = fetch_rss_articles(query, limit=8)

        if articles:
            doc_id = symbol.replace("/", "_")   # Firestore IDs cannot contain "/"
            db.collection("news_by_country").document(doc_id).set({
                "articles":     articles,
                "last_updated": datetime.utcnow().isoformat() + "Z",
            })
            print(f"  ✅ {symbol}: {len(articles)} articles written")
        else:
            print(f"  ⚠️  {symbol}: no articles found")

        time.sleep(1.0)

    print("Cloud Function sync completed successfully.")
