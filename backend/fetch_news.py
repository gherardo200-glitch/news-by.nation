import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import os
import re
import time
from datetime import datetime

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

# Percorsi dei file
PUBLIC_MAP_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'world-110m.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'realNews.json')

def clean_html(raw_html) -> str:
    """Rimuove i tag HTML dalla descrizione dell'articolo."""
    cleanr = re.compile('<.*?>')
    cleantext = str(re.sub(cleanr, '', str(raw_html)))
    return cleantext.strip()

def fetch_rss_news(country_name, url, limit=5):
    print(f"Recupero notizie per {country_name}...")
    articles = []
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        
        for idx, item in enumerate(root.findall('./channel/item')):
            if idx >= limit:
                break
                
            title = item.find('title').text if item.find('title') is not None else "No Title"
            source = "Google News"
            if " - " in title:
                parts = title.rsplit(" - ", 1)
                title = parts[0]
                source = parts[1]
                
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else datetime.now().isoformat()
            article_url = item.find('link').text if item.find('link') is not None else "#"
            
            desc_element = item.find('description')
            raw_desc = desc_element.text if desc_element is not None and desc_element.text else "Nessun estratto disponibile."
            
            articles.append({
                "id": f"{country_name.lower().replace(' ', '')[:4]}-{idx+1}",
                "source": source,
                "title": title,
                "excerpt": str(clean_html(raw_desc))[:150] + "...",
                "timestamp": pub_date,
                "url": article_url
            })
    except Exception as e:
        print(f" ❌ Errore per {country_name}: {e}")
        
    return articles

def generate_global_news_database():
    news_database = {}
    
    # 1. Carica tutti i nomi delle nazioni supportati fisicamente dalla mappa
    print(f"Lettura delle nazioni da {PUBLIC_MAP_FILE}...")
    with open(PUBLIC_MAP_FILE, 'r', encoding='utf-8') as f:
        map_data = json.load(f)
        
    # Estrae la lista dei nomi dei paesi dai metadati della mappa (TopoJSON)
    geometries = map_data.get('objects', {}).get('countries', {}).get('geometries', [])
    country_names = [g['properties']['name'] for g in geometries if 'properties' in g and 'name' in g['properties']]
    
    print(f"Trovate {len(country_names)} nazioni. Inizio scraping globale (ci vorrà un minuto o due pe non saturare le API)...\n")
    
    # 2. Per ciascuna nazione, pesca le news in tempo reale!
    for count, country in enumerate(country_names):
        # Query di ricerca: es. "Italy News" (usiamo News come suffisso universale per l'archivio globale inglese per affidabilità)
        query = urllib.parse.quote(f"{country} News")
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
        
        articles = fetch_rss_news(country, url, limit=6)
        
        if articles:
            news_database[country] = articles
            print(f" ✅ {country}: scaricate {len(articles)} notizie.")
        
        # Per evitare un Rate Limit (Troppe Richieste) di Google News!
        time.sleep(1)
        
    # 3. Salva tutto nel JSON utilizzato da React (come Fallback e Test in locale)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(news_database, f, ensure_ascii=False, indent=2)
        
    print(f"\n🌍 JSON LOCALE COMPLETATO in: {OUTPUT_FILE}")

    # 4. Sincronizzazione con Firebase Firestore (se configurato)
    SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
    
    if FIREBASE_AVAILABLE and os.path.exists(SERVICE_ACCOUNT_PATH):
        print("\n🚀 Inizializzando connessione a Firebase Firestore...")
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
                firebase_admin.initialize_app(cred)
            
            db = firestore.client()
            batch_size = 0
            batch = db.batch()
            
            print("Caricamento documenti nel cloud...")
            for country, articles in news_database.items():
                doc_ref = db.collection(u'news_by_country').document(country)
                batch.set(doc_ref, {u'articles': articles, u'last_updated': datetime.now().isoformat()})
                batch_size += 1
                
                # Firestore batch limit is 500
                if batch_size >= 400:
                    batch.commit()
                    batch = db.batch()
                    batch_size = 0
                    
            if batch_size > 0:
                batch.commit()
                
            print("✅ Sincronizzazione Firebase Cloud completata con successo! Le notizie sono ora online.")
        except Exception as e:
            print(f"❌ Errore durante il caricamento su Firebase: {e}")
    else:
        print("\n⚠️ Firebase non sincronizzato: File 'serviceAccountKey.json' mancante o libreria 'firebase-admin' non installata.")
        print("Per attivare il database cloud, segui i passaggi forniti dall'AI per scaricare la chiave di Firebase.")

if __name__ == "__main__":
    generate_global_news_database()
