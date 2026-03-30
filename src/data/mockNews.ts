export interface NewsArticle {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  timestamp: string;
  url?: string;
}

export type CountryNewsMap = Record<string, NewsArticle[]>;

export const MOCK_NEWS_DATA: CountryNewsMap = {
  // USA
  "United States of America": [
    {
      id: "us-1",
      source: "Bloomberg Demo",
      title: "Federal Reserve signals steady rates amid inflation concerns",
      excerpt: "The central bank remains cautious on rate cuts as recent economic data points suggest sticky inflation in the services sector.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "us-2",
      source: "TechCrunch Fake",
      title: "Major AI breakthrough announced by Silicon Valley startup",
      excerpt: "A new paradigm in machine learning models promises to reduce compute costs by 50% while maintaining state-of-the-art performance.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    }
  ],
  // ITA
  "Italy": [
    {
      id: "it-1",
      source: "Il Sole 24 Ore Mock",
      title: "BTP Valore: successo per le nuove emissioni",
      excerpt: "Forte domanda da parte degli investitori retail per la nuova tranche di titoli di stato dedicata alle famiglie.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      id: "it-2",
      source: "Corriere Demo",
      title: "Patto di stabilità: accordo raggiunto a Bruxelles",
      excerpt: "I ministri delle finanze europei hanno trovato l'intesa sulle nuove regole fiscali che entreranno in vigore dal prossimo anno.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    }
  ],
  // CHN
  "China": [
    {
      id: "cn-1",
      source: "SCMP Fake",
      title: "Tech sector regulatory easing signals growth push",
      excerpt: "Authorities indicate a more supportive stance towards major technology platforms to stimulate domestic demand.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    }
  ],
  // BRA
  "Brazil": [
    {
      id: "br-1",
      source: "Folha Demo",
      title: "Central Bank of Brazil announces new monetary policy",
      excerpt: "Copom decides to alter the pace of Selic rate cuts citing global economic uncertainties and domestic fiscal challenges.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    }
  ],
  // ZAF
  "South Africa": [
    {
      id: "za-1",
      source: "News24 Mock",
      title: "Mining sector reports moderate Q3 recovery",
      excerpt: "Despite ongoing logistical challenges, key commodities show resilient production volumes in the third quarter.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    }
  ]
};
