import type { NewsArticle, CountryNewsMap } from "../data/mockNews";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Service to fetch news by country.
 * Currently uses mock data, but is architected to be easily swappable with Firebase.
 */
export interface NewsResult {
  articles:     NewsArticle[];
  lastUpdated:  string | null;   // ISO string or null if unknown
  fromFirestore: boolean;
}

export async function fetchNewsByCountryId(countryId: string): Promise<NewsArticle[]> {
  const result = await fetchNewsWithMeta(countryId);
  return result.articles;
}

/** Firestore doc IDs cannot contain "/" — replace with "_" for financial symbols */
const toFirestoreId = (id: string) => id.replace(/\//g, "_");

export async function fetchNewsWithMeta(countryId: string): Promise<NewsResult> {
  try {
    // 1. Firestore (primary — live data updated every 15 min by Cloud Function)
    const countryDocRef = doc(db, "news_by_country", toFirestoreId(countryId));
    const countryDoc    = await getDoc(countryDocRef);

    if (countryDoc.exists() && countryDoc.data().articles) {
      const data         = countryDoc.data();
      const articles     = (data.articles as NewsArticle[]).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return {
        articles,
        lastUpdated:   data.last_updated ?? null,
        fromFirestore: true,
      };
    }
  } catch (err) {
    console.warn(`Firestore non disponibile per ${countryId}. Fallback locale.`);
  }

  // 2. Fallback locale (realNews.json bundled at build time)
  const realNewsData = (await import("../data/realNews.json")).default as unknown as CountryNewsMap;
  const news         = realNewsData[countryId];

  if (!news || news.length === 0) {
    return { articles: [], lastUpdated: null, fromFirestore: false };
  }

  const sorted = [...news].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return {
    articles:      sorted,
    lastUpdated:   sorted[0]?.timestamp ?? null,
    fromFirestore: false,
  };
}
