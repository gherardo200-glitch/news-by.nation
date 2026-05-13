import type { NewsArticle, CountryNewsMap } from "../data/mockNews";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import newsMeta from "../data/newsMeta.json";

/** Max age of Firestore data before we fall back to the bundled JSON (48 hours). */
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
const isStale = (isoTimestamp: string | undefined | null): boolean => {
  if (!isoTimestamp) return true;
  const ts = new Date(isoTimestamp).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_THRESHOLD_MS;
};

export async function fetchNewsWithMeta(countryId: string): Promise<NewsResult> {
  // 1. Firestore — refreshed every 30 min by GitHub Actions
  try {
    const countryDocRef = doc(db, "news_by_country", toFirestoreId(countryId));
    const countryDoc    = await getDoc(countryDocRef);

    if (countryDoc.exists()) {
      const data         = countryDoc.data();
      const articles     = (data.articles as NewsArticle[] | undefined) ?? [];
      const lastUpdated  = (data.last_updated as string | undefined) ?? null;

      if (articles.length > 0 && !isStale(lastUpdated)) {
        const sorted = [...articles].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return { articles: sorted, lastUpdated, fromFirestore: true };
      }
      // Stale or empty → fall through to local fallback
    }
  } catch {
    // Network/permission error → fall through to local fallback
  }

  // 2. Local fallback (bundled at build time, refreshed by the cron workflow)
  const realNewsData = (await import("../data/realNews.json")).default as unknown as CountryNewsMap;
  const news         = realNewsData[countryId];

  if (!news || news.length === 0) {
    return {
      articles:    [],
      lastUpdated: (newsMeta as { last_updated?: string }).last_updated ?? null,
      fromFirestore: false,
    };
  }

  const sorted = [...news].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return {
    articles:    sorted,
    lastUpdated: (newsMeta as { last_updated?: string }).last_updated ?? sorted[0]?.timestamp ?? null,
    fromFirestore: false,
  };
}
