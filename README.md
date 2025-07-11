# Finance-AI

A Wealth Management App for immigrants and gig workers, built with React Native (Expo) and Azure backend (Functions, Cosmos DB, Notification Hubs).

## Prerequisites

Before you begin, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing)

## Features
- User profile & customization (income, visa, goals, region, language)
- Secure authentication (Azure AD B2C)
- Income tracker (manual, voice, gig platform integration)
- Goal-based savings (with AI suggestions)
- Financial literacy hub (lessons, quizzes, gamification)
- Support & community (resource map, peer threads, referrals)
- Push notifications (Azure Notification Hubs)

## Project Structure
```
Finance-AI/
  frontend/            # React Native (Expo) frontend
    assets/            # Images, fonts, and other static assets
    context/          # React Context for state management
    localization/     # i18n translations
    navigation/       # Navigation configuration
    screens/          # Application screens/pages
    services/         # API and other services
  backend/            # Azure Functions backend
    api/             # API endpoints
    shared/          # Shared types and utilities
```

## Setup

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd Finance-AI
```

### 2. Install dependencies

#### Frontend (React Native/Expo)
```bash
cd frontend
npm install
```

#### Backend (Azure Functions)
```bash
cd backend
npm install
```

### 3. Configure environment variables
- Copy `.env.example` to `.env` in both frontend and backend directories
- Fill in your Azure/Firebase/OpenAI keys in the respective .env files

### 4. Run the application

#### Frontend (Expo)
```bash
cd frontend
npx expo start
```
After starting the frontend:
- Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
- Or press 'w' to open in web browser

#### Backend (Azure Functions)
```bash
cd backend
npm start
```

## Development Tips
- The frontend runs on Expo, which provides hot-reloading for faster development
- Use the Expo Go app on your mobile device to test the app in a real environment
- Azure Functions can be tested locally using the Azure Functions Core Tools
- Check console logs in Expo and Azure Functions for debugging

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
- For detailed API documentation, check the backend README
- For UI components and screens documentation, see the frontend README
- Make sure to replace all placeholder values in `.env` files before deploying