import type { NewsArticle, CountryNewsMap } from "../data/mockNews";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Service to fetch news by country.
 * Currently uses mock data, but is architected to be easily swappable with Firebase.
 */
export async function fetchNewsByCountryId(countryId: string): Promise<NewsArticle[]> {
  // Simulate network latency (500ms - 1s)
  const delay = Math.floor(Math.random() * 500) + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // // TODO: Integrare fetch da Firebase Firestore qui
  // // Esempio futuro (pseudocodice):
  try {
    // 1. Tentativo di fetch da Firebase Firestore
    // Cerca il documento che ha come ID il nome della nazione (es. "Italy")
    const countryDocRef = doc(db, "news_by_country", countryId);
    const countryDoc = await getDoc(countryDocRef);

    if (countryDoc.exists() && countryDoc.data().articles) {
      const articles = countryDoc.data().articles as NewsArticle[];
      // Ordina dalla più recente alla più vecchia
      return articles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (err) {
    console.warn(`Firebase non disponibile per ${countryId}. Carico dati di fallback locali.`);
  }

  // 2. FALLBACK LOCALE: Se Firebase fallisce (es. chiavi non inserite), usiamo il file generato da Python
  const realNewsData = (await import("../data/realNews.json")).default as unknown as CountryNewsMap;
  const news = realNewsData[countryId];
  
  if (!news || news.length === 0) {
    return [];
  }
  
  // Ordina dalla più recente alla più vecchia
  return [...news].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
