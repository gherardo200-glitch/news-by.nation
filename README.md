# NewsByNation PRO

Terminale di intelligence finanziaria e geopolitica globale. Esplora 177 nazioni su una mappa interattiva, segui in tempo reale prezzi di mercato, calendario macro e notizie economiche filtrate per paese.

🌍 **Live:** https://newsbynation.web.app

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4
- **Mappe:** `react-simple-maps` + `react-globe.gl` / three.js
- **Backend:** Firebase (Firestore + Auth + Hosting)
- **Dati finanziari:** CoinGecko · Yahoo Finance · open.er-api · Twelve Data (fallback chain)
- **Dati news:** Google News RSS, scrapato da GitHub Actions ogni 30 min
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
```

## Architettura

```
            ┌─ Firestore news_by_country (sorgente primaria)
GitHub Action (cron 30m) ─┤
backend/fetch_news.py     └─ commit realNews.json + newsMeta.json (fallback bundled)
                                                        │
                                                        ▼
                                              React SPA on Firebase Hosting
```

- [`backend/fetch_news.py`](backend/fetch_news.py) → scraper parallelo Google News RSS (177 paesi + asset finanziari) con retry/backoff e abort safety
- [`.github/workflows/fetch-news.yml`](.github/workflows/fetch-news.yml) → cron ogni 30 min: aggiorna Firestore + committa il fallback locale
- [`firestore.rules`](firestore.rules) → read pubblico su `news_by_country`, write solo Admin SDK; documenti `users` isolati per UID
- [`src/services/`](src/services) → API layer (auth, news, finance, pixel, SEO)

### Failure model

- Se Firestore ha dati > 48h vecchi per un paese → frontend usa `src/data/realNews.json` (rigenerato e committato a ogni run)
- Se < 10% delle fetch ha successo o se `FIREBASE_SERVICE_ACCOUNT` è invalido → workflow esce `1` (visibile rosso su GitHub)
- Il secret `FIREBASE_SERVICE_ACCOUNT` deve contenere il JSON **completo** del service account Admin SDK

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
