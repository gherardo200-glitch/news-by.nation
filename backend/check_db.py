import os
import firebase_admin
from firebase_admin import credentials, firestore

try:
    SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    docs = db.collection(u'news_by_country').stream()
    
    count = 0
    sample_country = ""
    sample_article_count = 0
    
    for doc in docs:
        count += 1
        if count == 1:
            sample_country = doc.id
            sample_article_count = len(doc.to_dict().get("articles", []))
            
    print(f"✅ VERIFICA CLOUD SUPERATA: Il database contiene {count} nazioni attive!")
    print(f"🔎 Esempio: '{sample_country}' ha {sample_article_count} notizie salvate con successo.")
except Exception as e:
    print(f"❌ ERRORE VERIFICA: {e}")
