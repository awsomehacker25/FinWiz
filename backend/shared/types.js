// User profile type
export const UserProfile = {
  id: '',
  email: '',
  incomeType: '',
  visaStatus: '',
  goals: [],
  region: '',
  language: '',
  createdAt: '',
};

// Income entry type
export const IncomeEntry = {
  id: '',
  userId: '',
  amount: 0,
  source: '',
  date: '',
};

// Savings goal type
export const SavingsGoal = {
  id: '',
  userId: '',
  goalName: '',
  target: 0,
  saved: 0,
  createdAt: '',
};

// Literacy lesson type
export const LiteracyLesson = {
  id: '',
  title: '',
  content: '',
  language: '',
};

// Community thread type
export const CommunityThread = {
  id: '',
  userId: '',
  title: '',
  body: '',
  createdAt: '',
  replies: [],
}; 