# StyleME

StyleME is an AI-powered personal wardrobe management and outfit recommendation web application. Users can upload clothing items, receive AI-generated metadata tags, view weather-tailored outfit suggestions, build and track outfits, explore generative styling via natural language prompts, and manage subscriptions with premium tiers.

---

## Tech Stack

- **Frontend:** React 19 (Vite), React Router 7, Recharts, Stripe Elements (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- **Backend:** Node.js, Express 5, Prisma ORM
- **Database:** PostgreSQL (hosted on Supabase)
- **External Services & APIs:**
  - **Google Gemini API:** Vision-based clothing attribute tagging (FR-03) and generative outfit styling (FR-06)
  - **Stripe API:** Secure card checkout, PaymentIntents, and subscription management (FR-08)
  - **Open-Meteo API:** Real-time geocoding and weather forecasts (FR-05)
- **Authentication & Security:** Email & password authentication (with `bcrypt` password hashing) and Google OAuth login (via Passport.js, linked to existing users by matching email address), with `express-session` HTTP-only cookies
- **File Storage:** Local disk storage in `backend/uploads` with support for JPG, PNG, and WEBP formats (up to 10MB)

---

## Folder Structure

```text
StyleMe/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # PostgreSQL migration SQL files
│   │   ├── schema.prisma        # Prisma data models and PostgreSQL datasource
│   │   └── migration_lock.toml  # Provider lock (postgresql)
│   ├── src/
│   │   ├── middleware/          # Authentication & session guards
│   │   ├── routes/              # Express API route handlers (auth, wardrobe, outfits, etc.)
│   │   ├── db.js                # Shared Prisma client instance
│   │   ├── index.js             # Express app entry point, CORS & middleware config
│   │   ├── mockAi.js            # Fallback heuristic tagging simulator
│   │   ├── mockRecommend.js     # Rule-based outfit recommendation engine
│   │   ├── mockStyleMe.js       # Generative AI styling logic (Gemini + fallback)
│   │   ├── moderation.js        # Input moderation for natural language prompts
│   │   ├── notifications.js     # User notification dispatch helpers
│   │   ├── outfitHelpers.js     # Recommendation pairing heuristics and rationale generators
│   │   ├── tagOptions.js        # Canonical categories, colours, styles, formalities, seasons
│   │   ├── visionTag.js         # Google Gemini Vision integration for image auto-tagging
│   │   └── weather.js           # Open-Meteo API client with server caching
│   ├── uploads/                 # Uploaded clothing images
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components (Navbar, ItemDetailModal, WeatherBanner, etc.)
│   │   ├── pages/               # Application views (Dashboard, Wardrobe, Recommendations, StyleMe, etc.)
│   │   ├── api.js               # Centralized fetch client and image upload helpers
│   │   ├── AuthContext.jsx      # Global authentication and session state provider
│   │   ├── index.css            # Complete design system and styling
│   │   ├── main.jsx             # React entry point
│   │   └── tagOptions.js        # Frontend tag options matching backend schema
│   └── package.json
└── docs/
    └── SCHEMA.md                # Database schema reference and relations
```

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or newer recommended)
- A PostgreSQL database instance (e.g., [Supabase](https://supabase.com/))
- (Optional) [Google AI Studio API Key](https://aistudio.google.com/) for Gemini Vision & Generative AI
- (Optional) [Stripe Test API Keys](https://dashboard.stripe.com/apikeys) for card payment processing

---

### 1. Install Dependencies

Install packages in both the `backend` and `frontend` directories:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory (see `backend/.env.example`):

```env
# Database connection string (PostgreSQL / Supabase)
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<host>:5432/postgres?sslmode=require&connect_timeout=30"

# Session secret for cookie encryption
SESSION_SECRET="your-development-session-secret"

# Server configuration
PORT=3001
FRONTEND_URL="http://localhost:5173"

# Google Gemini API key (FR-03 & FR-06)
GEMINI_API_KEY="AIzaSy..."
GEMINI_VISION_MODEL="gemini-3.5-flash"

# Google OAuth (FR-02)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# Stripe Secret Key (FR-08)
STRIPE_SECRET_KEY="sk_test_..."
```

#### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory (see `frontend/.env.example`):

```env
# Stripe Publishable Key (FR-08)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

### 3. Database Initialization

From the `backend/` directory, generate the Prisma client and verify migration state:

```bash
cd backend
npx prisma generate
npx prisma migrate status
```

*Note: If connecting to a fresh database, run `npx prisma migrate deploy` to apply existing PostgreSQL migrations.*

---

### 4. Running the Application

Start both the backend and frontend development servers in separate terminal sessions.

**Terminal 1 — Backend API** (http://localhost:3001):
```bash
cd backend
npm run dev
```
*Health check endpoint:* http://localhost:3001/api/health

**Terminal 2 — Frontend Application** (http://localhost:5173):
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.  
*(Note: Always access via `localhost` rather than `127.0.0.1` to ensure session cookies are preserved).*

---

## Functional Requirements Status (FR-01 to FR-12)

| FR Number | Feature Name | Status | Implementation Type | AI Integration Status |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | **User Registration** | Fully Working | Live Logic | No AI |
| **FR-02** | **User Login & Session** | Fully Working | Live Logic | No AI |
| **FR-03** | **Clothing Upload & AI Tagging** | Fully Working | Live Logic | **Contains AI** (Live Gemini Vision API with simulated fallback) |
| **FR-04** | **AI Outfit Recommendation** | Fully Working | Live Logic (Heuristics) | **Uses Mocked AI** (Rule-based recommendation engine) |
| **FR-05** | **Weather-Based Filtering** | Fully Working | Live Logic | No AI (Live Open-Meteo REST API) |
| **FR-06** | **Style Me (Generative AI Prompt)** | Fully Working | Live Logic | **Contains AI** (Live Gemini REST API with simulated fallback) |
| **FR-07** | **Wardrobe Dashboard** | Fully Working | Live Logic | No AI |
| **FR-08** | **Premium Subscription** | Fully Working | Live Logic | No AI (Live Stripe Elements + PaymentIntent) |
| **FR-09** | **Outfit History** | Fully Working | Live Logic | No AI |
| **FR-10** | **Profile & Preferences** | Fully Working | Live Logic | No AI |
| **FR-11** | **Wardrobe Analytics** | Fully Working | Live Logic | No AI (Live client aggregation & Recharts) |
| **FR-12** | **Manual Outfit Builder** | Fully Working | Live Logic | No AI |

---

## AI Capabilities & Architecture

StyleME incorporates a hybrid architecture combining real cloud-based AI models with robust offline fallback simulators:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 StyleME AI Architecture                 │
                  └────────────────────────────┬────────────────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
  ┌─────────────────────────┐                                     ┌─────────────────────────┐
  │         Real AI         │                                     │     Simulated / Mock    │
  │  (Google Gemini Cloud)  │                                     │       (Heuristics)      │
  └────────────┬────────────┘                                     └────────────┬────────────┘
               │                                                               │
     ┌─────────┴─────────┐                                           ┌─────────┴─────────┐
     ▼                   ▼                                           ▼                   ▼
┌─────────────┐   ┌─────────────┐                             ┌─────────────┐   ┌─────────────┐
│    FR-03    │   │    FR-06    │                             │    FR-04    │   │  Fallbacks  │
│Gemini Vision│   │StyleMe LLM  │                             │Outfit Rules │   │Offline Modes│
│ Auto-Tagging│   │Generative AI│                             │ & Filtering │   │(FR-03/FR-06)│
└─────────────┘   └─────────────┘                             └─────────────┘   └─────────────┘
```

1. **Real AI Integrations (Google Gemini API):**
   - **FR-03 (Vision Auto-Tagging):** When a user uploads a garment (`.jpg`, `.png`, `.webp`), `backend/src/visionTag.js` encodes the image and transmits it to `gemini-3.5-flash`. The model classifies the item against standard project enums (Category, Colour, Style, Formality, Season).
   - **FR-06 (Style Me Natural Language Prompt):** When a premium user inputs a styling prompt, `backend/src/mockStyleMe.js` sends the prompt and the user's wardrobe inventory to Gemini. The model selects compatible wardrobe item IDs, provides a styling rationale, and generates actionable fashion tips.

2. **Heuristic & Rule-Based AI:**
   - **FR-04 (Outfit Recommendations):** Uses deterministic category-pairing algorithms, formality mapping, and temperature-band scoring (`backend/src/mockRecommend.js` and `backend/src/outfitHelpers.js`) to construct cohesive outfits without calling external LLMs.

3. **Resilient Fallback Design:**
   - If `GEMINI_API_KEY` is not present in `.env` or network requests to Google fail, both FR-03 and FR-06 automatically fall back to local heuristic engines (`mockAi.js` and `mockStyleMeLook`), ensuring full development and evaluation capability without requiring paid API credits.

---

## Source File Mapping

Every primary module includes an explicit comment header referencing its corresponding Functional Requirement:

| Requirement | Primary Backend File(s) | Primary Frontend File(s) | Key Comment Header |
| :--- | :--- | :--- | :--- |
| **FR-01** | `backend/src/routes/auth.js` | `frontend/src/pages/Register.jsx` | `// FR-01: User Registration` |
| **FR-02** | `backend/src/routes/auth.js`<br>`backend/src/config/passport.js`<br>`backend/src/middleware/requireAuth.js` | `frontend/src/pages/Login.jsx`<br>`frontend/src/AuthContext.jsx` | `// FR-02: User Login & Session` |
| **FR-03** | `backend/src/routes/wardrobe.js`<br>`backend/src/visionTag.js`<br>`backend/src/mockAi.js` | `frontend/src/components/AddItemPanel.jsx` | `// FR-03: Clothing Upload & AI Tagging` |
| **FR-04** | `backend/src/routes/recommendations.js`<br>`backend/src/mockRecommend.js`<br>`backend/src/outfitHelpers.js` | `frontend/src/pages/Recommendations.jsx`<br>`frontend/src/components/OutfitResultCard.jsx` | `// FR-04: AI Outfit Recommendation` |
| **FR-05** | `backend/src/weather.js`<br>`backend/src/routes/weather.js` | `frontend/src/components/WeatherBanner.jsx`<br>`frontend/src/weather.js` | `// FR-05: Weather-Based Filtering` |
| **FR-06** | `backend/src/routes/styleme.js`<br>`backend/src/mockStyleMe.js`<br>`backend/src/moderation.js` | `frontend/src/pages/StyleMe.jsx` | `// FR-06: Style Me (Generative AI Prompt)` |
| **FR-07** | `backend/src/routes/wardrobe.js` | `frontend/src/pages/Wardrobe.jsx`<br>`frontend/src/components/ItemDetailModal.jsx` | `// FR-07: Wardrobe Dashboard` |
| **FR-08** | `backend/src/routes/subscription.js` | `frontend/src/pages/Subscription.jsx` | `// FR-08: Premium Subscription` |
| **FR-09** | `backend/src/routes/outfits.js` | `frontend/src/pages/OutfitHistory.jsx` | `// FR-09: Outfit History` |
| **FR-10** | `backend/src/routes/profile.js`<br>`backend/src/stylePreferences.js` | `frontend/src/pages/Profile.jsx` | `// FR-10: Profile & Preferences` |
| **FR-11** | *Aggregated from Wardrobe API* | `frontend/src/pages/Analytics.jsx` | `// FR-11: Wardrobe Analytics` |
| **FR-12** | `backend/src/routes/outfits.js` | `frontend/src/pages/OutfitBuilder.jsx` | `// FR-12: Manual Outfit Builder` |

---

## Testing & Evaluation Notes

- **Authentication & Sign-in Options (FR-01 & FR-02):**
  - Users can create an account and sign in using email/password, or use **Continue with Google** as an alternative sign-in method (Google accounts automatically link to existing accounts with matching email addresses).
- **Test Card Details for Stripe (FR-08):**
  - Use `4242 4242 4242 4242` with any future expiry date and 3-digit CVC to simulate a successful payment.
  - Use `4000 0000 0000 0002` to simulate a card decline.
  - Alternatively, click **Start 5-day free trial** on the Subscription page or execute `node scripts/set-premium.js you@example.com` from `backend/` to unlock Premium capabilities instantly.
- **Free vs. Premium Tiers:**
  - Free users are restricted to a 20-item wardrobe limit and standard heuristic recommendations without weather annotations.
  - Premium unlocks unlimited wardrobe items, live weather badges on recommendations, and the Generative AI **StyleMe** prompt studio.
- **City & Weather Diagnostics:**
  - Weather on recommendations pulls the city saved in the user's Profile (`FR-10`). Ensure a valid city (e.g., "Sydney", "London", "Tokyo") is configured on the Profile page.
