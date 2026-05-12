import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import os
import re
import time
import threading
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

BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
PUBLIC_MAP_FILE = os.path.join(BASE_DIR, '..', 'public', 'world-110m.json')
OUTPUT_FILE     = os.path.join(BASE_DIR, '..', 'src', 'data', 'realNews.json')

# Max concurrent Google News requests (be polite, avoid rate-limit)
_semaphore = threading.Semaphore(6)


def clean_html(raw_html: str) -> str:
    return re.sub(r'<.*?>', '', str(raw_html)).strip()


def fetch_rss_articles(key: str, query_str: str, limit: int = 6) -> list:
    query = urllib.parse.quote(query_str)
    url   = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    articles = []
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            xml_data = resp.read()

        root    = ET.fromstring(xml_data)
        channel = root.find("channel")
        if not channel:
            return []

        for idx, item in enumerate(channel.findall("item")):
            if idx >= limit:
                break
            title  = item.findtext("title", "").strip()
            link   = item.findtext("link",  "").strip()
            desc   = item.findtext("description", "")
            pubDate = item.findtext("pubDate", "")
            source = item.findtext("source", "Google News")

            if not title or not link:
                continue

            # Strip source suffix from title (Google News style: "Title - Source")
            if " - " in title:
                parts  = title.rsplit(" - ", 1)
                title  = parts[0].strip()
                source = parts[1].strip()

            # Normalize timestamp to ISO-8601
            try:
                dt       = datetime.strptime(pubDate, "%a, %d %b %Y %H:%M:%S %Z")
                iso_date = dt.replace(tzinfo=timezone.utc).isoformat()
            except Exception:
                iso_date = datetime.now(timezone.utc).isoformat()

            articles.append({
                "id":        f"{key.lower().replace(' ', '')[:6]}-{idx+1}",
                "source":    source,
                "title":     title,
                "excerpt":   clean_html(desc)[:300],
                "timestamp": iso_date,
                "url":       link,
            })
    except Exception as e:
        print(f"  ⚠️  {key}: {e}")

    return articles


def _fetch_one(key: str, query_str: str, limit: int) -> tuple[str, list]:
    with _semaphore:
        articles = fetch_rss_articles(key, query_str, limit)
    status = f"✅ {key}: {len(articles)} articoli" if articles else f"⚠️  {key}: nessun risultato"
    print(f"  {status}")
    return key, articles


def init_firebase() -> object | None:
    """Init Firebase from env var JSON (CI) or local file (dev). Returns db or None."""
    if not FIREBASE_AVAILABLE:
        print("⚠️  firebase-admin non installato.")
        return None

    if firebase_admin._apps:
        return firestore.client()

    # 1. Env var (GitHub Actions / CI)
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if sa_json:
        try:
            sa_dict = json.loads(sa_json)
            cred    = credentials.Certificate(sa_dict)
            firebase_admin.initialize_app(cred)
            print("🔑 Firebase inizializzato da variabile d'ambiente.")
            return firestore.client()
        except Exception as e:
            print(f"❌ Errore inizializzazione Firebase (env): {e}")
            return None

    # 2. Local file (sviluppo)
    sa_path = os.path.join(BASE_DIR, 'serviceAccountKey.json')
    if os.path.exists(sa_path):
        try:
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
            print("🔑 Firebase inizializzato da file locale.")
            return firestore.client()
        except Exception as e:
            print(f"❌ Errore inizializzazione Firebase (file): {e}")
            return None

    print("⚠️  Nessuna credenziale Firebase trovata. Solo export JSON locale.")
    return None


def generate_global_news_database():
    # ── Carica lista paesi dalla mappa ────────────────────────────────────────
    print(f"Lettura nazioni da mappa...")
    with open(PUBLIC_MAP_FILE, 'r', encoding='utf-8') as f:
        map_data = json.load(f)
    geometries    = map_data.get('objects', {}).get('countries', {}).get('geometries', [])
    country_names = [g['properties']['name'] for g in geometries
                     if 'properties' in g and 'name' in g['properties']]

    # ── Build task list ───────────────────────────────────────────────────────
    tasks: list[tuple[str, str, int]] = []
    for country in country_names:
        q = f'"{country}" AND (economy OR finance OR geopolitics OR macroeconomics OR "central bank" OR politics)'
        tasks.append((country, q, 6))
    for symbol, q in FINANCIAL_ASSETS.items():
        tasks.append((symbol, q, 8))

    print(f"Avvio fetch parallelo: {len(tasks)} item (6 worker)...\n")

    # ── Parallel fetch ────────────────────────────────────────────────────────
    news_database: dict[str, list] = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(_fetch_one, key, q, lim): key for key, q, lim in tasks}
        for future in as_completed(futures):
            key, articles = future.result()
            if articles:
                news_database[key] = articles

    print(f"\n📦 Totale: {len(news_database)} chiavi con articoli.")

    # ── Salva JSON locale (fallback bundled nel build React) ──────────────────
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(news_database, f, ensure_ascii=False, indent=2)
    print(f"💾 realNews.json aggiornato: {OUTPUT_FILE}")

    # ── Sync Firestore ────────────────────────────────────────────────────────
    db = init_firebase()
    if not db:
        return

    print("\n🚀 Sync Firestore...")
    now_iso  = datetime.now(timezone.utc).isoformat()
    batch    = db.batch()
    written  = 0

    for key, articles in news_database.items():
        doc_id  = key.replace("/", "_")
        doc_ref = db.collection("news_by_country").document(doc_id)
        batch.set(doc_ref, {"articles": articles, "last_updated": now_iso})
        written += 1

        if written % 400 == 0:      # Firestore batch limit = 500
            batch.commit()
            batch = db.batch()

    if written % 400 != 0:
        batch.commit()

    print(f"✅ Firestore aggiornato: {written} documenti scritti.")


if __name__ == "__main__":
    generate_global_news_database()
