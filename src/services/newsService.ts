import type { NewsArticle, CountryNewsMap } from "../data/mockNews";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/** Max age of Firestore data before we fall back to local realNews.json (48 hours) */
const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000;

export interface NewsResult {
  articles:      NewsArticle[];
  lastUpdated:   string | null;  // ISO string or null
  fromFirestore: boolean;
}

export async function fetchNewsByCountryId(countryId: string): Promise<NewsArticle[]> {
  const result = await fetchNewsWithMeta(countryId);
  return result.articles;
}

/** Firestore doc IDs cannot contain "/" — replace with "_" for financial symbols */
const toFirestoreId = (id: string) => id.replace(/\//g, "_");

/** Returns true if the ISO timestamp is older than STALE_THRESHOLD_MS */
const isStale = (isoTimestamp: string | undefined): boolean => {
  if (!isoTimestamp) return true;
  return Date.now() - new Date(isoTimestamp).getTime() > STALE_THRESHOLD_MS;
};

export async function fetchNewsWithMeta(countryId: string): Promise<NewsResult> {
  try {
    // 1. Firestore — live data updated every 15 min by Cloud Function
    const countryDocRef = doc(db, "news_by_country", toFirestoreId(countryId));
    const countryDoc    = await getDoc(countryDocRef);

    if (countryDoc.exists() && countryDoc.data().articles) {
      const data       = countryDoc.data();
      const lastUpdated: string | undefined = data.last_updated;

      // Staleness guard: if Firestore data is older than 48h fall through to local
      if (isStale(lastUpdated)) {
        console.warn(
          `Firestore data for "${countryId}" is stale (${lastUpdated}). Using local fallback.`
        );
        throw new Error("stale");
      }

      const articles = (data.articles as NewsArticle[]).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return { articles, lastUpdated: lastUpdated ?? null, fromFirestore: true };
    }
  } catch (err) {
    if ((err as Error).message !== "stale") {
      console.warn(`Firestore non disponibile per "${countryId}". Fallback locale.`);
    }
  }

  // 2. Local fallback (realNews.json bundled at build time — refreshed on each deploy)
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
