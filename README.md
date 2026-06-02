# CryptoWatch — Application de suivi des crypto-monnaies

> Projet Fin de Module — Développement Front-End et Frameworks  
> Prof. N. El Bahri — Année Universitaire 2025-2026  
> Groupe G3

---

## Vue d'ensemble

CryptoWatch est une application web full-stack permettant aux utilisateurs de suivre l'évolution des crypto-monnaies en temps réel, consulter les tendances du marché, gérer leur portefeuille personnel et recevoir des alertes personnalisées sur leurs actifs favoris.

---

## Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, routing, API backend |
| UI | React 18 + Tailwind CSS | Composants, interface utilisateur |
| État global | Redux Toolkit | Watchlist, alertes, préférences |
| Base de données | MongoDB Atlas | Persistance des données utilisateur |
| ODM | Mongoose | Modélisation et requêtes MongoDB |
| Auth | NextAuth.js | Authentification sécurisée |
| Graphiques | Recharts | Visualisation des cours |
| API externe | CoinGecko API | Prix et données crypto en temps réel |
| Langage | TypeScript | Typage statique |

---

## Fonctionnalités

### Authentification et comptes
- Inscription et connexion sécurisées (email + mot de passe)
- Gestion du profil utilisateur
- Sessions persistantes avec NextAuth.js
- Protection des routes privées (middleware Next.js)

### Tableau de bord
- Vue globale du marché (top 100 cryptos)
- Statistiques clés : capitalisation totale, volume 24h, dominance BTC
- Graphiques d'évolution des prix (7j, 30j, 90j, 1an)
- Indicateurs de performance : variation en % sur 24h

### Watchlist personnelle
- Ajout et suppression de cryptos favoris
- Tri par prix, variation, capitalisation
- Synchronisée en base de données (persistante)

### Alertes de prix
- Création d'alertes (au-dessus / en-dessous d'un seuil)
- Notifications en temps réel (WebSocket ou polling)
- Historique des alertes déclenchées

### Recherche et filtrage
- Recherche par nom ou symbole
- Filtres : catégorie, variation 24h, capitalisation
- Résultats instantanés (debounce)

---

## Architecture du projet

```
cryptowatch/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Tableau de bord principal
│   │   ├── watchlist/
│   │   │   └── page.tsx
│   │   ├── alerts/
│   │   │   └── page.tsx
│   │   └── crypto/
│   │       └── [id]/
│   │           └── page.tsx      # Détail d'une crypto
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── watchlist/
│   │   │   └── route.ts
│   │   ├── alerts/
│   │   │   └── route.ts
│   │   └── crypto/
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                       # Composants réutilisables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Badge.tsx
│   ├── crypto/
│   │   ├── CryptoCard.tsx
│   │   ├── CryptoTable.tsx
│   │   ├── PriceChart.tsx
│   │   └── MarketStats.tsx
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx
│   │   ├── WatchlistWidget.tsx
│   │   └── AlertsWidget.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
│
├── lib/
│   ├── mongodb.ts                # Connexion MongoDB
│   ├── auth.ts                   # Configuration NextAuth
│   └── coingecko.ts              # Client API CoinGecko
│
├── models/
│   ├── User.ts                   # Modèle Mongoose
│   ├── Watchlist.ts
│   └── Alert.ts
│
├── redux/
│   ├── store.ts
│   ├── slices/
│   │   ├── watchlistSlice.ts
│   │   ├── alertsSlice.ts
│   │   └── userSlice.ts
│   └── Provider.tsx
│
├── hooks/
│   ├── useCryptoData.ts
│   ├── useWatchlist.ts
│   └── useAlerts.ts
│
├── types/
│   └── index.ts                  # Types TypeScript globaux
│
├── .env.local                    # Variables d'environnement
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Modèles MongoDB (Mongoose)

### User
```typescript
{
  _id: ObjectId,
  nom: String,
  email: String (unique),
  password: String (hashé),
  createdAt: Date
}
```

### Watchlist
```typescript
{
  userId: ObjectId (ref: User),
  cryptos: [String],   // ex: ["bitcoin", "ethereum"]
  updatedAt: Date
}
```

### Alert
```typescript
{
  userId: ObjectId (ref: User),
  cryptoId: String,
  cryptoSymbol: String,
  targetPrice: Number,
  condition: "above" | "below",
  active: Boolean,
  triggeredAt: Date | null,
  createdAt: Date
}
```

---

## Installation et démarrage

### Prérequis
- Node.js >= 18
- Compte MongoDB Atlas (gratuit)
- Clé API CoinGecko (optionnelle pour le plan Pro)

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/votre-groupe/cryptowatch.git
cd cryptowatch

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir les variables dans .env.local

# 4. Lancer en développement
npm run dev

# 5. Build de production
npm run build
npm start
```

### Variables d'environnement (.env.local)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cryptowatch
NEXTAUTH_SECRET=votre-secret-32-caracteres
NEXTAUTH_URL=http://localhost:3000
COINGECKO_API_KEY=votre-cle-api   # optionnel
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=votre-email-smtp
EMAIL_SERVER_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM="CryptoWatch <votre-email-smtp>"
CRON_SECRET=votre-secret-cron
```

---

## Vérification automatique des alertes

Les alertes email sont envoyées par l'endpoint protégé :

```text
GET /api/alerts/check
```

En production, cet endpoint refuse les requêtes sans `CRON_SECRET`. Un appel direct vers
`https://votre-domaine.vercel.app/api/alerts/check` retourne donc `401 Unauthorized`.

Pour un service cron externe comme cron-job.org, configurez l'une de ces options :

```text
https://votre-domaine.vercel.app/api/alerts/check?secret=VOTRE_CRON_SECRET
```

ou ajoutez un header HTTP :

```text
Authorization: Bearer VOTRE_CRON_SECRET
```

Si vous utilisez Vercel Cron Jobs, ajoutez `CRON_SECRET` dans les variables
d'environnement Vercel. Vercel l'envoie automatiquement dans le header
`Authorization: Bearer ...` pendant l'exécution du cron.

Important : une alerte déclenchée devient inactive après l'envoi de l'email. Pour
tester plusieurs fois, créez une nouvelle alerte active ou réactivez l'alerte en base.

---

## Concepts du cours appliqués

| Concept (cours) | Application dans le projet |
|---|---|
| `let` / `const` (ES6) | Utilisés partout — jamais `var` |
| Arrow functions | Composants React, callbacks, hooks |
| Destructuring | Props, réponses API, state Redux |
| Async / Await | Appels CoinGecko API, requêtes MongoDB |
| Modules ES6 | Import/Export de composants et utils |
| Composants React | CryptoCard, PriceChart, Navbar... |
| Hooks React | useState, useEffect, useSelector, useDispatch |
| Redux Toolkit | `createSlice`, `configureStore` pour watchlist et alertes |
| Next.js SSR | Pages rendues côté serveur pour le SEO |
| File-Based Routing | `app/watchlist/page.tsx` → `/watchlist` |
| API Routes Next.js | `app/api/watchlist/route.ts` → backend |

---

## API externe — CoinGecko

Base URL : `https://api.coingecko.com/api/v3`

| Endpoint | Usage |
|---|---|
| `/coins/markets` | Liste des cryptos avec prix |
| `/coins/{id}` | Détail d'une crypto |
| `/coins/{id}/market_chart` | Historique des prix |
| `/search` | Recherche de cryptos |
| `/global` | Statistiques globales du marché |

---

## Guide de contribution (groupe G3)

```
feature/auth          → Authentification (inscription, connexion)
feature/dashboard     → Tableau de bord et statistiques
feature/watchlist     → Gestion de la watchlist
feature/alerts        → Système d'alertes
feature/charts        → Graphiques et visualisations
feature/search        → Recherche et filtrage
```

Chaque membre travaille sur sa branche. Pull Request obligatoire avant merge sur `main`.

---

## Critères d'évaluation couverts

- Intégration d'API externes (CoinGecko)
- Gestion des appels asynchrones (async/await, fetch)
- Graphiques interactifs (Recharts)
- SSR avec Next.js (Server Side Rendering)
- Gestion d'état global avec Redux Toolkit
- Composants React réutilisables et dynamiques
- Base de données MongoDB avec Mongoose
- Authentification sécurisée

---

*CryptoWatch — Groupe G3 — 2025-2026*
