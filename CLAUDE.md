# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FinWiz is a wealth management app for immigrants and gig workers. It has two independently-run parts:

- `frontend/` — React Native (Expo) mobile app. Talks to **Firebase directly** (Authentication, Cloud Firestore, Cloud Storage) via the client SDK — there is no custom backend/API layer.
- `ai-model/` — a separate FastAPI (Python) service that calls Azure OpenAI. This is the "AI Financial Coach" / bill-parsing brain, deployed/run independently and unrelated to Firebase.

The frontend calls Firestore/Auth/Storage directly for all data CRUD, and calls the FastAPI service (`FASTAPI_ENDPOINT`) for AI features (financial coach chat, merchant-name extraction, bill-entry generation). A prior iteration of this app had an Azure Functions + Cosmos DB backend sitting between the frontend and the database; it has been removed entirely — Firestore Security Rules (`firestore.rules`, `storage.rules` at repo root) are now the only authorization boundary, since there's no server to check tokens.

## Commands

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npx expo start        # or: npm start
```
Press `w` for web, or scan the QR code with Expo Go. No lint/test scripts are defined in `frontend/package.json`.

### AI model service (`ai-model/`)
```bash
cd ai-model
pip install fastapi uvicorn pydantic python-dotenv openai pandas numpy scipy
uvicorn main:app --reload --port 8000
```
There's no `requirements.txt` — infer dependencies from the imports in `main.py` if setting up fresh. Needs `ai-model/.env` with `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`.

## Architecture

### Data layer: Firestore accessed directly from the client, secured by rules
`frontend/services/api.js` is the entire data-access layer — one function per operation (`getIncomeEntries`, `addIncomeEntry`, `updateSpendingEntry`, `deleteSavingsGoal`, `getUserProfileByEmail`, `upsertUserProfile`, `getLiteracyProgress`/`upsertLiteracyProgress`, `getCommunityThreads`/`createThread`/`updateThread`/`deleteThread`/`addReply`/`editReply`/`deleteReply`), built directly on the `firebase/firestore` client SDK (`collection`, `doc`, `getDoc(s)`, `setDoc`, `updateDoc`, `deleteDoc`, `query`/`where`/`orderBy`). There is no server in front of Firestore, so **`firestore.rules` (repo root) is the real authorization boundary** — every collection's rule requires `request.auth.token.email` to match the document's `userId` field (or the doc ID itself, for `userProfiles`/`lessonCompletions` which are keyed by email). The ownership checks inside `api.js` (e.g. `editReply` throwing if `snap.data().userId !== userId`) are a UX nicety for a fast, clear client-side error — they are not the security boundary and would do nothing against a modified client, so don't reason about auth safety from that code; reason from `firestore.rules`.

Collection names carry over from an earlier Cosmos DB-backed design: `userProfiles` (doc ID = email), `incomeEntries`, `spendingEntries` (composite index on `userId` asc + `date` desc — see setup below), `savingsGoals`, `lessonCompletions` (doc ID = email), `communityThreads`. **Community replies are a `replies` subcollection** under each thread (`communityThreads/{id}/replies/{replyId}`), not an array field — this is deliberate so Firestore rules can enforce "only the reply's author can edit/delete it" per-document; an array-field design can't express that in rules without a Cloud Function.

`services/fileStorage.js` (`uploadReceiptImage`/`deleteReceiptImage`) uploads scanned receipts to Cloud Storage at `receipts/{userId}/{timestamp}.jpg`; `storage.rules` restricts each path to its owning user by email.

Firestore/Storage rules must be deployed by hand via the Firebase Console (Firestore → Rules / Storage → Rules → paste file contents) — there's no `firebase.json` / Firebase CLI wiring in this repo, so editing `firestore.rules` or `storage.rules` locally does nothing until it's pasted into the console.

### Auth model: Firebase Authentication, keyed by email
Firebase Auth (email/password) issues the session; the frontend identifies a user by their **email** everywhere (`user.id === user.email`), which is also the Firestore document ID/filter value for every collection — this predates the current architecture (a Cosmos-backed version did the same) and was preserved rather than switched to Firebase's `uid`, to avoid re-keying every collection. `user.uid` is tracked in `AuthContext` alongside `user.id`/`user.email` but isn't used as a lookup key anywhere. `AuthContext` (`context/AuthContext.js`) wraps real Firebase session state: `onAuthStateChanged` drives `user`/`loading` (session persistence is handled by the Firebase SDK itself via `getReactNativePersistence(AsyncStorage)` in `config/firebaseConfig.js`), while `login()`/`logout()` merge extra profile fields (name, `isNewUser`, etc.) on top of the live Firebase session and cache them in SecureStore for fast hydration on restart. Actual sign-in/sign-up happens in `LoginScreen`/`SignUpScreen` via `signInWithEmailAndPassword`/`createUserWithEmailAndPassword` before `login()` is ever called — `login()` itself never touches Firebase Auth, it only updates local/context state.

### AI model service: single-file FastAPI app
All of `ai-model/main.py` lives in one file. `call_llm()` is the single wrapper around the Azure OpenAI chat completion call; every endpoint builds a prompt string (often assembling a lot of user context — income, spending, goals, lesson completions — into a natural-language paragraph) and passes it through this one function. Several early endpoints (`/tips`, `/income-analysis`, `/savings-monitor`, `/spending-review`, `/literacy-recommender`) are commented out but left in place — treat them as historical/reference code, not dead code to silently delete, unless asked. Active endpoints: `/financial-coach`, `/extract-merchant`, `/generate-bill-entry`. Endpoints that expect structured JSON back from the LLM use `safe_parse_json()` to tolerate the model wrapping JSON in prose, and fall back to defaults/errors if parsing fails. This service, and the Azure Cognitive Services (Custom Vision OCR, Speech-to-text) used by `services/billScanService.js`/`services/speechToTextService.js`, are unrelated to the Firebase migration and untouched by it.

### Frontend: Expo app, screen-per-feature
`App.js` is the single navigation root — one `createStackNavigator` with all screens registered inline (Login/SignUp/ProfileSetup are chromeless; the rest share a header style). There is no separate router config in active use (`navigation/index.js` is an empty placeholder). `config/firebaseConfig.js` initializes the Firebase app once and exports `auth`/`db`/`storage` — every other module imports from here rather than re-initializing. i18n is `i18next` + `react-i18next` with translations inlined directly in `localization/i18n.js` (currently `en`/`es`); language choice is persisted to SecureStore separately from auth.

`services/financialCoach.js` builds the AI request payload from scratch on each call: `gatherUserBehaviorData()` fan-out-fetches income/goals/literacy/profile/spending via `services/api.js` (tolerating individual failures), reshapes it to match the FastAPI `UserBehavior` schema, then `askFinancialCoach()` posts it plus the user's question to `/financial-coach`. `services/billScanService.js` is the receipt-scanning pipeline: Azure Custom Vision OCR (`config/ocrConfig.js`) → regex-based total/merchant extraction with a priority-ordered pattern list (`findBestTotal`) → AI-enhanced merchant name via `/extract-merchant` (falls back to the regex-derived name if AI confidence < 0.5) → `/generate-bill-entry` for a human-readable title/description/category (falls back to local `inferCategory()` keyword matching if the AI call fails). `SpendingTrackerScreen` uploads the scanned receipt image via `fileStorage.uploadReceiptImage` right after a successful scan and stores the resulting download URL as `receiptImageUrl` on the spending entry (best-effort — a failed upload doesn't block adding the expense).

### Environment variables
`frontend/.env` (loaded via `react-native-dotenv`, imported as `from '@env'`) carries: `FIREBASE_API_KEY`/`FIREBASE_AUTH_DOMAIN`/`FIREBASE_PROJECT_ID`/`FIREBASE_STORAGE_BUCKET`/`FIREBASE_MESSAGING_SENDER_ID`/`FIREBASE_APP_ID` (Firebase web app config), `FASTAPI_ENDPOINT` (ai-model service), and `AZURE_VISION_*`/`AZURE_SPEECH_*` (Cognitive Services, unrelated to Firebase). See `frontend/.env.example`. `ai-model/.env` (via `python-dotenv`) is separate and untouched. Both are gitignored.

**Historical note:** an earlier Cosmos DB-backed version of this repo had `backend/api/local.settings.json` committed to git with a live Cosmos DB key. That backend has since been deleted entirely, but **the old key is still present in git history** and should be treated as compromised (rotate/revoke in Azure) and the history scrubbed if this repo is or will be shared.
