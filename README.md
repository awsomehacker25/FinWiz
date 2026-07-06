# FinWiz

A Wealth Management App for immigrants and gig workers, built with React Native (Expo) and Firebase (Authentication, Firestore, Cloud Storage). The app talks to Firebase directly from the client — there is no custom backend.

## Prerequisites

Before you begin, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing)

## Features
- User profile & customization (income, visa, goals, region, language)
- Secure authentication (Firebase Authentication)
- Income tracker (manual, voice, gig platform integration)
- Goal-based savings (with AI suggestions)
- Financial literacy hub (lessons, quizzes, gamification)
- Support & community (resource map, peer threads, referrals)
- Receipt image storage (Firebase Cloud Storage)

## Project Structure
```
Finance-AI/
  frontend/            # React Native (Expo) frontend — talks to Firebase directly
    assets/            # Images, fonts, and other static assets
    config/            # firebaseConfig.js, OCR/AI endpoint config
    context/           # React Context for state management (Firebase auth session)
    localization/      # i18n translations
    navigation/         # Navigation configuration
    screens/            # Application screens/pages
    services/           # Firestore data layer, OCR/AI/storage services
  ai-model/            # Standalone FastAPI service (Azure OpenAI) for the AI coach
  firestore.rules       # Firestore security rules (source of truth for authorization)
  storage.rules         # Cloud Storage security rules
```

## Setup

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd Finance-AI
```

### 2. Install dependencies
```bash
cd frontend
npm install
```

### 3. Create a Firebase project
- Console → Authentication → enable Email/Password sign-in.
- Console → Firestore Database → create database → deploy `firestore.rules` (Firestore → Rules → paste the file's contents).
- Console → Storage → create default bucket → deploy `storage.rules` the same way.
- Console → Project settings → Your apps → register a Web app to get your `firebaseConfig` values.

### 4. Configure environment variables
Copy `frontend/.env.example` to `frontend/.env` and fill in:
- Your Firebase web app config (`FIREBASE_*` — from step 3)
- Azure Cognitive Services OCR/Speech keys (`AZURE_VISION_*`, `AZURE_SPEECH_*` — unrelated to Firebase, used for bill scanning and voice input)
- `FASTAPI_ENDPOINT` pointing at the `ai-model` service

For the `ai-model` service, fill in `ai-model/.env` with your Azure OpenAI keys.

### 5. Run the application
```bash
cd frontend
npx expo start
```
After starting:
- Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
- Or press 'w' to open in web browser

If you want the AI Financial Coach / bill-scan features, also run the AI model service:
```bash
cd ai-model
uvicorn main:app --reload --port 8000
```

## Development Tips
- The frontend runs on Expo, which provides hot-reloading for faster development
- Use the Expo Go app on your mobile device to test the app in a real environment
- Check the Firestore/Storage tabs in the Firebase Console to inspect data directly while developing
- If a write silently fails, check `firestore.rules`/`storage.rules` first — the client SDK surfaces permission errors, but they're easy to miss in a `.catch(() => [])` fallback

## Troubleshooting
- If you encounter "port already in use" errors, make sure no other instances are running
- For Expo connection issues, ensure your mobile device is on the same network as your development machine
- Clear npm cache and node_modules if you encounter dependency issues:
  ```bash
  npm cache clean --force
  rm -rf node_modules
  npm install
  ```

## More Information
- Make sure to replace all placeholder values in `.env` files before deploying
