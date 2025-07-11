# Finance-AI

A Wealth Management App for immigrants and gig workers, built with React Native (Expo) and Azure backend (Functions, Cosmos DB, Notification Hubs).

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
  src/                  # React Native frontend
  azure-functions/      # Azure Functions backend
  shared/               # Shared types, validation, etc.
  .env.example
  README.md
```

## Setup

### 1. Clone the repo
```
git clone <your-repo-url>
cd Finance-AI
```

### 2. Install dependencies
#### Frontend
```
cd src
npm install
```
#### Backend
```
cd ../azure-functions
npm install
```

### 3. Configure environment variables
- Copy `.env.example` to `.env` and fill in your Azure/Firebase/OpenAI keys.

### 4. Run the app
#### Frontend (Expo)
```
cd src
npx expo start
```
#### Backend (Azure Functions)
```
cd ../azure-functions
npm start
```

## More
- See each folder for detailed README and code comments.
- Replace all placeholder values in `.env` before deploying. 