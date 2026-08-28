# StyleME

StyleME is an AI-powered personal wardrobe and outfit styling web app.
Users upload clothing photos, get tags and outfit suggestions, save looks, and (on premium) unlock extra styling features.

## Tech stack

- **Frontend:** React (Vite) + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite via Prisma ORM (local file, no cloud account)
- **Images:** stored on the server in `backend/uploads`
- **Auth:** email/password, bcrypt hashing, express-session cookies

## Folder structure

```
StyleMe/
  frontend/     React app (Vite)
  backend/      Express API + Prisma + uploads
  docs/         Schema and other project docs
```

## Install

You need [Node.js](https://nodejs.org/) installed (version 18 or newer is fine).

Open a terminal in the project root (`StyleMe`), then install each part:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Database setup (first time only)

From the `backend` folder:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

This creates `backend/prisma/dev.db` and the four tables documented in `docs/SCHEMA.md`.

If the migration was already applied on this machine, you can skip this step.

## Run commands

Use **two terminals**. Leave both running.

**Terminal 1 — backend** (http://localhost:3001)

```bash
cd backend
npm run dev
```

Health check: open http://localhost:3001/api/health — you should see `{ "status": "ok", ... }`.

**Terminal 2 — frontend** (http://localhost:5173)

```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser (use `localhost`, not `127.0.0.1`, so the session cookie works).

## Functional requirements (FR-01 to FR-12)

| FR number | Feature | Status |
| --- | --- | --- |
| FR-01 | User Registration | Fully working |
| FR-02 | User Login & Session | Fully working |
| FR-03 | Clothing Upload & AI Tagging | Fully working (AI tags are working) |
| FR-04 | AI Outfit Recommendation | Fully working |
| FR-05 | Weather-Based Filtering | Fully working |
| FR-06 | Style Me (Generative AI Prompt) | Fully working (Google Gemini ) |
| FR-07 | Wardrobe Dashboard | Fully working |
| FR-08 | Premium Subscription | Fully working (checkout workng with stripe test) |
| FR-09 | Outfit History | Fully working |
| FR-10 | Profile & Preferences | Fully working |
| FR-11 | Wardrobe Analytics | Fully working |
| FR-12 | Manual Outfit Builder | Fully working |

Every source file includes a comment header with the FR it implements.

**Working now:** Register, Login, session + Sign Out, Wardrobe upload/grid/edit/favourite/delete, Recommendations + weather banner, StyleMe (free gate until upgrade), mock Subscription checkout, Save Outfit, Outfit History (wear / rename / delete), Profile settings, Wardrobe Analytics, Manual Outfit Builder.

To skip the mock checkout and mark an account premium from the `backend` folder:

```bash
node scripts/set-premium.js you@example.com
```

Then refresh the browser. The in-app path is **Subscription → Upgrade to Premium**.

## Known bugs and demo caveats

- **Use `http://localhost:5173`**, not `127.0.0.1`. The API cookie is scoped to `localhost`, so login will look like it failed if you mix the two.
- **Restarting the backend logs everyone out.** Sessions live in memory, not the database.
- **AI is mocked.** Clothing tags, outfit picks, and StyleMe tips are random/keyword rules, not a real vision or LLM API. Files are marked `// MOCK AI — replace with real recommendation/API logic later`.
- **StyleMe is premium-only.** New accounts are `free`. Use **Subscription** (mock checkout) or `scripts/set-premium.js`. Nothing is charged; see `backend/src/mockPayment.js`.
- **City is edited on Profile.** Weather on Recommendations uses the saved city. Leave it blank at register if you want; Profile save requires a city.
- **Recommendations need variety.** You need at least 2 wardrobe items in **different categories** (for example Top + Shoes). Two tops alone cannot build an outfit.
- **Hot-weather filter only drops Outerwear at 25°C+.** In a cool city the coat may still appear. That is expected.
- **Cancelling Add Item after upload** can leave an unused file in `backend/uploads` until you delete the item (or remove the file by hand).
- **Deleting a wardrobe item** does not clean old rows in Outfit History. Saved outfits may show fewer thumbnails if an item was removed.
- **Analytics needs 3+ items.** With fewer than 3 wardrobe items the page shows “Add more items to see your wardrobe analytics”.
- **Style preferences are not a database column.** The users table has no preferences field (schema is locked). Checkboxes are stored in `backend/data/stylePreferences.json` by user id.
- **Mock payment.** Tick “Simulate declined card” (or use `4000000000000002`) to demo “Your card was declined”. Any other fake card number succeeds.
