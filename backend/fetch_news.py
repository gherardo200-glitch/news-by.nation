"""
Fetch news from Google News RSS for every supported country + financial asset.
Writes:
  - src/data/realNews.json     → bundled fallback (Record<countryName, NewsArticle[]>)
  - src/data/newsMeta.json     → { last_updated, total_articles, total_keys, failed_keys }
  - Firestore news_by_country/<docId> → { articles, last_updated } (only when Firebase available)

Safety:
  - Hard exit(1) if zero articles total (don't overwrite local JSON with garbage)
  - Hard exit(1) if CI provided FIREBASE_SERVICE_ACCOUNT but init failed
  - Per-fetch retry with exponential backoff on transient errors
  - All country keys are preserved in the JSON (empty arrays for failed fetches)
    so the frontend's country list stays stable
"""
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

FINANCIAL_ASSETS = {
    "XAU/USD": 'Gold "Spot Gold" (market OR price OR mining OR "central bank")',
    "WTI/USD": 'Oil "Crude Oil" (WTI OR price OR production OR OPEC)',
    "SPX":     'S&P500 "Stock Market" (economy OR index OR outlook OR earnings)',
    "IXIC":    'Nasdaq "Tech Stocks" (market OR AI OR semiconductors OR earnings)',
    "BTC/USD": 'Bitcoin "Crypto Market" (regulation OR institutional OR price)',
    "EUR/USD": 'Euro Dollar "Forex Market" (ECB OR Fed OR currency OR inflation)',
}

BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
PUBLIC_MAP_FILE = os.path.join(BASE_DIR, '..', 'public', 'world-110m.json')
OUTPUT_FILE     = os.path.join(BASE_DIR, '..', 'src', 'data', 'realNews.json')
META_FILE       = os.path.join(BASE_DIR, '..', 'src', 'data', 'newsMeta.json')

MAX_WORKERS  = 3        # Google News rate-limits aggressively above 3 concurrent
MAX_RETRIES  = 3        # per-fetch retry budget
BASE_BACKOFF = 1.5      # seconds; multiplied by 2^attempt + jitter
REQUEST_TIMEOUT = 12    # seconds for each RSS request

_TAG_RE = re.compile(r'<.*?>')


def clean_html(raw_html: str) -> str:
    return _TAG_RE.sub('', str(raw_html)).strip()


def _slug(s: str) -> str:
    return re.sub(r'[^a-z0-9]', '', s.lower())[:8] or 'k'


def fetch_rss_articles(key: str, query_str: str, limit: int = 6) -> list:
    """Fetch up to `limit` articles for a query, retrying on transient errors."""
    query = urllib.parse.quote(query_str)
    url   = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                xml_data = resp.read()
            break
        except urllib.error.HTTPError as e:
            last_err = e
            # 429 / 5xx → retry; 4xx other → give up
            if e.code != 429 and e.code < 500:
                return []
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last_err = e
        except Exception as e:
            last_err = e
            return []

        # backoff with jitter
        sleep_s = BASE_BACKOFF * (2 ** attempt) + random.uniform(0, 0.5)
        time.sleep(sleep_s)
    else:
        print(f"  ⚠️  {key}: max retries exceeded ({last_err})")
        return []

    # Parse XML
    try:
        root    = ET.fromstring(xml_data)
        channel = root.find("channel")
        if channel is None:
            return []
    except ET.ParseError as e:
        print(f"  ⚠️  {key}: XML parse error ({e})")
        return []

    articles = []
    for idx, item in enumerate(channel.findall("item")):
        if idx >= limit:
            break
        title   = (item.findtext("title")   or "").strip()
        link    = (item.findtext("link")    or "").strip()
        desc    = item.findtext("description", "")
        pubDate = item.findtext("pubDate", "")
        source  = item.findtext("source", "Google News")

        if not title or not link:
            continue

        # Security: only accept http(s) URLs. Blocks javascript:/data:/etc. that could
        # XSS via <a href> rendered in the React panel (React doesn't block these).
        if not (link.startswith("http://") or link.startswith("https://")):
            continue

        # Strip "Title - Source" suffix (Google News style)
        if " - " in title:
            parts  = title.rsplit(" - ", 1)
            title  = parts[0].strip()
            source = parts[1].strip()

        # Normalize timestamp to ISO-8601 UTC
        try:
            dt       = datetime.strptime(pubDate, "%a, %d %b %Y %H:%M:%S %Z")
            iso_date = dt.replace(tzinfo=timezone.utc).isoformat()
        except Exception:
            iso_date = datetime.now(timezone.utc).isoformat()

        articles.append({
            "id":        f"{_slug(key)}-{idx + 1}",
            "source":    source,
            "title":     title,
            "excerpt":   clean_html(desc)[:300],
            "timestamp": iso_date,
            "url":       link,
        })

    return articles


def _fetch_one(key: str, query_str: str, limit: int) -> tuple[str, list]:
    articles = fetch_rss_articles(key, query_str, limit)
    status = f"✅ {key}: {len(articles)} articoli" if articles else f"⚠️  {key}: 0 articoli"
    print(f"  {status}")
    return key, articles


def init_firebase() -> tuple[object | None, bool]:
    """
    Returns (db, ci_init_required).
    `ci_init_required=True` means the env var was set but init failed → caller must fail hard.
    """
    if not FIREBASE_AVAILABLE:
        print("⚠️  firebase-admin non installato.")
        return None, False

    if firebase_admin._apps:
        return firestore.client(), False

    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if sa_json:
        try:
            sa_dict = json.loads(sa_json)
            cred    = credentials.Certificate(sa_dict)
            firebase_admin.initialize_app(cred)
            print("🔑 Firebase inizializzato da variabile d'ambiente.")
            return firestore.client(), False
        except Exception as e:
            print(f"❌ Errore inizializzazione Firebase (env): {e}")
            return None, True   # CI was expected to write — caller must exit(1)

    sa_path = os.path.join(BASE_DIR, 'serviceAccountKey.json')
    if os.path.exists(sa_path):
        try:
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
            print("🔑 Firebase inizializzato da file locale.")
            return firestore.client(), False
        except Exception as e:
            print(f"❌ Errore inizializzazione Firebase (file): {e}")
            return None, False  # local dev — non-fatal

    print("ℹ️  Nessuna credenziale Firebase trovata. Solo export JSON locale.")
    return None, False


def load_country_list() -> list[str]:
    with open(PUBLIC_MAP_FILE, 'r', encoding='utf-8') as f:
        map_data = json.load(f)
    geometries = map_data.get('objects', {}).get('countries', {}).get('geometries', [])
    return [
        g['properties']['name']
        for g in geometries
        if 'properties' in g and 'name' in g['properties']
    ]


def write_local_files(news_database: dict, country_names: list[str], failed_keys: list[str]) -> None:
    """Persist JSON fallback + metadata. Keeps every country key (empty list if no articles)."""
    now_iso = datetime.now(timezone.utc).isoformat()

    # Ensure every country/asset key exists in the JSON so the frontend's
    # country list and "supported" check remain stable across fetch failures.
    full_db = {name: news_database.get(name, []) for name in country_names}
    for symbol in FINANCIAL_ASSETS:
        full_db[symbol] = news_database.get(symbol, [])

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(full_db, f, ensure_ascii=False, indent=2)

    total_articles = sum(len(v) for v in full_db.values())
    meta = {
        "last_updated":   now_iso,
        "total_articles": total_articles,
        "total_keys":     len(full_db),
        "filled_keys":    sum(1 for v in full_db.values() if v),
        "failed_keys":    sorted(failed_keys),
    }
    with open(META_FILE, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"💾 realNews.json: {meta['filled_keys']}/{meta['total_keys']} chiavi popolate, "
          f"{total_articles} articoli totali.")


def sync_firestore(db, news_database: dict) -> int:
    """Batch-write only filled keys. Returns number of docs written."""
    print("\n🚀 Sync Firestore...")
    now_iso  = datetime.now(timezone.utc).isoformat()
    batch    = db.batch()
    written  = 0

    for key, articles in news_database.items():
        if not articles:
            continue
        doc_id  = key.replace("/", "_")
        doc_ref = db.collection("news_by_country").document(doc_id)
        batch.set(doc_ref, {"articles": articles, "last_updated": now_iso})
        written += 1

        if written % 400 == 0:   # Firestore batch limit = 500
            batch.commit()
            batch = db.batch()

    if written % 400 != 0:
        batch.commit()

    print(f"✅ Firestore aggiornato: {written} documenti scritti.")
    return written


def main() -> int:
    print("Lettura nazioni da mappa...")
    country_names = load_country_list()
    print(f"  → {len(country_names)} nazioni trovate.")

    tasks: list[tuple[str, str, int]] = []
    for country in country_names:
        q = f'"{country}" AND (economy OR finance OR geopolitics OR macroeconomics OR "central bank" OR politics)'
        tasks.append((country, q, 6))
    for symbol, q in FINANCIAL_ASSETS.items():
        tasks.append((symbol, q, 8))

    print(f"Avvio fetch parallelo: {len(tasks)} item ({MAX_WORKERS} worker, retry={MAX_RETRIES})...\n")

    news_database: dict[str, list] = {}
    failed_keys: list[str] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(_fetch_one, key, q, lim): key for key, q, lim in tasks}
        for future in as_completed(futures):
            try:
                key, articles = future.result()
            except Exception as e:
                # Should not happen — _fetch_one catches everything internally
                key = futures[future]
                articles = []
                print(f"  ⚠️  {key}: future failed ({e})")
            if articles:
                news_database[key] = articles
            else:
                failed_keys.append(key)

    total_articles = sum(len(v) for v in news_database.values())
    filled         = len(news_database)
    print(f"\n📦 {filled}/{len(tasks)} chiavi popolate · {total_articles} articoli totali.")
    if failed_keys:
        print(f"   ⚠️  {len(failed_keys)} chiavi senza articoli (es: {failed_keys[:5]})")

    # Safety: refuse to overwrite local JSON with junk
    MIN_REQUIRED_FILLED = max(20, len(tasks) // 10)   # at least 10% success or 20 keys
    if filled < MIN_REQUIRED_FILLED:
        print(f"\n❌ ABORT: only {filled} chiavi popolate (min={MIN_REQUIRED_FILLED}). "
              "Probabile rate-limit/network failure. Local JSON NON sovrascritto.")
        return 1

    write_local_files(news_database, country_names, failed_keys)

    db, ci_init_required = init_firebase()
    if ci_init_required:
        # CI provided FIREBASE_SERVICE_ACCOUNT but init failed — surface this loudly.
        print("\n❌ ABORT: FIREBASE_SERVICE_ACCOUNT presente ma init fallito. Workflow MUST fail.")
        return 1
    if db is not None:
        sync_firestore(db, news_database)

    print("\n✅ Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
