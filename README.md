# NewsByNation PRO

Terminale di intelligence finanziaria e geopolitica globale. Esplora 177 nazioni su una mappa interattiva, segui in tempo reale prezzi di mercato, calendario macro e notizie economiche filtrate per paese.

🌍 **Live:** https://newsbynation.web.app

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4
- **Mappe:** `react-simple-maps` + `react-globe.gl` / three.js
- **Backend:** Firebase (Firestore + Auth + Hosting + Cloud Functions)
- **Dati finanziari:** CoinGecko · Yahoo Finance · open.er-api · Twelve Data (fallback chain)
- **Dati news:** Google News RSS, scrapato da Cloud Function schedulata
- **Calendario macro:** widget TradingView embed

## Setup locale

```bash
git clone https://github.com/gherardo200-glitch/news-by.nation.git
cd news-by.nation
npm install

# Copia .env.example e riempi con la tua Firebase config
cp .env.example .env.local

npm run dev      # dev server (http://localhost:5173)
npm run build    # production build (./dist)
```

La `VITE_FIREBASE_*` config si trova in **Firebase Console → Project Settings → Your apps → SDK setup and configuration**.

## Deploy

```bash
firebase deploy --only hosting,firestore:rules
firebase deploy --only functions   # richiede piano Blaze
```

## Architettura

```
Google News RSS ──▶ Cloud Function (schedule) ──▶ Firestore (news_by_country)
                                                        │
                                                        ▼
                                              React SPA on Firebase Hosting
```

- [`functions/main.py`](functions/main.py) → scraper schedulato (177 paesi + asset finanziari)
- [`backend/fetch_news.py`](backend/fetch_news.py) → versione legacy via GitHub Actions (backup)
- [`firestore.rules`](firestore.rules) → read autenticato, write solo Admin SDK; documenti `users` isolati per UID
- [`src/services/`](src/services) → API layer (auth, news, finance, pixel, SEO)

## Struttura

```
src/
├── components/
│   ├── auth/             Login, signup, Google OAuth
│   ├── dashboard/        Mappa, pannello news, ticker finanziario
│   ├── layout/           Sidebar watchlist, calendario economico
│   └── marketing/        Landing, onboarding, cookie banner
├── contexts/             AuthContext (Firebase Auth state)
├── data/                 Mock news, country intel points
├── pages/                Privacy, cookie policy, public news hub (SEO)
└── services/             firebase, newsService, financeService, metaPixel, seo
```

## Licenza

MIT
