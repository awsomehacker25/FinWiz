# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FinWiz is a wealth management app for immigrants and gig workers. It has three independently-run parts that talk to each other over HTTP — there is no shared build/test tooling across them:

- `frontend/` — React Native (Expo) mobile app.
- `backend/api/` — Azure Functions (Node.js, HTTP-triggered) backed by Cosmos DB. This is the app's CRUD API.
- `ai-model/` — a separate FastAPI (Python) service that calls Azure OpenAI. This is the "AI Financial Coach" / bill-parsing brain; it is not part of the Azure Functions app and is deployed/run independently.

The frontend calls the Functions API (`AZURE_FUNCTIONS_BASE_URL`) for all data CRUD, and calls the FastAPI service (`FASTAPI_ENDPOINT`) directly for AI features (financial coach chat, merchant-name extraction, bill-entry generation).

## Commands

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npx expo start        # or: npm start
```
Press `w` for web, or scan the QR code with Expo Go. No lint/test scripts are defined in `frontend/package.json`.

### Backend (`backend/api/`)
```bash
cd backend/api
npm install
npm start              # runs `func start` (Azure Functions Core Tools required)
```
Requires `backend/api/local.settings.json` populated with Cosmos DB / Notification Hub values (see Configuration below). No test suite exists.

### AI model service (`ai-model/`)
```bash
cd ai-model
pip install fastapi uvicorn pydantic python-dotenv openai pandas numpy scipy
uvicorn main:app --reload --port 8000
```
There's no `requirements.txt` — infer dependencies from the imports in `main.py` if setting up fresh. Needs `ai-model/.env` with `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`.

## Architecture

### Backend: one Azure Function per resource, no shared handler
Each folder under `backend/api/` (`userProfile`, `income`, `goals`, `spending`, `literacy`, `community`) is a standalone HTTP-triggered function: `function.json` declares the binding (`authLevel: function`, methods GET/POST/PUT/DELETE all routed to the same handler), and `index.js` dispatches on `req.method` itself — there's no router/middleware layer or shared request validation. All functions get the Cosmos client the same way via `backend/shared/cosmosClient.js` (`getCosmosClient()`, a lazy singleton reading `COSMOS_DB_URI`/`COSMOS_DB_KEY` from env) and then do `client.database(process.env.COSMOS_DB_DATABASE).container(<containerId>)`. Container IDs are hardcoded per function (e.g. `incomeEntries`, `spendingEntries`, `userProfiles`, `lessonCompletions`, `communityThreads`) — Cosmos containers are keyed by document `id`, and most functions use `container.item(id, id)` (id doubles as partition key).
`backend/shared/types.js` documents the shape of each entity as plain JS object literals (not enforced types) — treat it as documentation of the Cosmos schema, not a runtime contract. `community/index.js` is the most complex handler (thread CRUD plus nested reply add/edit/delete with creator-only authorization checks) and is the best reference for the request-dispatch pattern used everywhere else.

There is no auth middleware — authorization (e.g. "only the reply's creator can edit it") is checked ad hoc inside each handler by comparing a `userId` field passed in the request body/query, not any hardened auth mechanism.

### AI model service: single-file FastAPI app
All of `ai-model/main.py` lives in one file. `call_llm()` is the single wrapper around the Azure OpenAI chat completion call; every endpoint builds a prompt string (often assembling a lot of user context — income, spending, goals, lesson completions — into a natural-language paragraph) and passes it through this one function. Several early endpoints (`/tips`, `/income-analysis`, `/savings-monitor`, `/spending-review`, `/literacy-recommender`) are commented out but left in place — treat them as historical/reference code, not dead code to silently delete, unless asked. Active endpoints: `/financial-coach`, `/extract-merchant`, `/generate-bill-entry`. Endpoints that expect structured JSON back from the LLM use `safe_parse_json()` to tolerate the model wrapping JSON in prose, and fall back to defaults/errors if parsing fails.

### Frontend: Expo app, screen-per-feature
`App.js` is the single navigation root — one `createStackNavigator` with all screens registered inline (Login/SignUp/ProfileSetup are chromeless; the rest share a header style). There is no separate router config in active use (`navigation/index.js` is an empty placeholder). Auth state is a custom `AuthContext` (`context/AuthContext.js`) backed by `expo-secure-store` — not a real auth provider, just a locally-persisted user object with `login`/`logout`. i18n is `i18next` + `react-i18next` with translations inlined directly in `localization/i18n.js` (currently `en`/`es`); language choice is also persisted to SecureStore.

`services/api.js` is the single axios client for the Functions backend (`AZURE_FUNCTIONS_BASE_URL` from `@env`), with one thin wrapper function per endpoint. `services/financialCoach.js` builds the AI request payload from scratch on each call: `gatherUserBehaviorData()` fan-out-fetches income/goals/literacy/profile/spending from the Functions API (tolerating individual failures), reshapes it to match the FastAPI `UserBehavior` schema, then `askFinancialCoach()` posts it plus the user's question to `/financial-coach`. `services/billScanService.js` is the receipt-scanning pipeline: Azure Custom Vision OCR (`config/ocrConfig.js`) → regex-based total/merchant extraction with a priority-ordered pattern list (`findBestTotal`) → AI-enhanced merchant name via `/extract-merchant` (falls back to the regex-derived name if AI confidence < 0.5) → `/generate-bill-entry` for a human-readable title/description/category (falls back to local `inferCategory()` keyword matching if the AI call fails). Both AI calls degrade gracefully rather than blocking the user flow on AI failure.

### Environment variables
Both `frontend/.env` (loaded via `react-native-dotenv`, imported as `from '@env'`) and `ai-model/.env` (via `python-dotenv`) hold live endpoint/key values and are gitignored. **`backend/api/local.settings.json` is not gitignored and is currently committed to the repo with a live Cosmos DB key** — treat this as sensitive; if you touch this file, don't add further secrets to it, and flag to the user that it should be rotated/removed from history rather than trying to fix it silently yourself.
