import os
import firebase_admin
from firebase_admin import credentials, firestore

def list_collections():
    try:
        SERVICE_ACCOUNT_PATH = os.path.join(os.getcwd(), 'backend', 'serviceAccountKey.json')
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        collections = db.collections()
        
        print("--- COLLEZIONI TROVATE ---")
        for coll in collections:
            print(f"- {coll.id}")
        print("--------------------------")
        
    except Exception as e:
        print(f"Errore: {e}")

if __name__ == "__main__":
    list_collections()
