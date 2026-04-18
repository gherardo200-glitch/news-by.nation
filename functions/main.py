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

firebase_admin.initialize_app()
db = firestore.client()

# Load supported countries dynamically
dir_path = os.path.dirname(os.path.realpath(__file__))
with open(os.path.join(dir_path, "countries.json"), "r") as f:
    data = json.load(f)
SUPPORTED_COUNTRIES = list(data.keys())

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def clean_html(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(separator=" ", strip=True)

# Scheduled function: runs every 15 minutes, maximum 9 minutes timeout
@scheduler_fn.on_schedule(
    schedule="*/15 * * * *", 
    timeout_sec=540, 
    memory=options.MemoryOption.MB_512
)
def fetch_financial_news(event: scheduler_fn.ScheduledEvent) -> None:
    print(f"Scraping financial/geopolitical news for {len(SUPPORTED_COUNTRIES)} countries...")
    
    for country in SUPPORTED_COUNTRIES:
        # Refined query for Pro-Tier Financial/Geopolitical Dashboard
        query = f'"{country}" AND (economy OR finance OR geopolitics OR macroeconomics OR "central bank" OR politics)'
        url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-US&gl=US&ceid=US:en"
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"Failed to fetch {country}: {response.status_code}")
                time.sleep(1)
                continue
                
            root = ET.fromstring(response.content)
            channel = root.find("channel")
            if not channel:
                continue
                
            items = channel.findall("item")[:6]
            articles = []
            for item in items:
                title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                desc = item.find("description").text if item.find("description") is not None else ""
                pubDate = item.find("pubDate").text if item.find("pubDate") is not None else ""
                source = item.find("source").text if item.find("source") is not None else "Google News"
                
                try:
                    parsed_date = datetime.strptime(pubDate, "%a, %d %b %Y %H:%M:%S %Z")
                    iso_date = parsed_date.isoformat() + "Z"
                except:
                    iso_date = datetime.utcnow().isoformat() + "Z"
                
                if not title or not link:
                    continue
                    
                articles.append({
                    "id": link.split("/")[-1] if "/" in link else str(int(time.time())),
                    "title": title,
                    "excerpt": clean_html(desc),
                    "source": source,
                    "url": link,
                    "timestamp": iso_date
                })
            
            if articles:
                # Write to the same collection the frontend reads from (newsService.ts)
                db.collection("news_by_country").document(country).set({
                    "articles": articles,
                    "last_updated": datetime.utcnow().isoformat() + "Z"
                })
                
        except Exception as e:
            print(f"Error processing {country}: {e}")
            
        # Courtesy delay to avoid IP Ban
        time.sleep(1.2)
        
    print("Cloud Function sync completed successfully.")
