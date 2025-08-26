import axios from 'axios';
import api, { getIncomeEntries, getSavingsGoals, getLiteracyProgress, getUserProfileByEmail } from './api';
import { AI_CONFIG } from '../config/aiConfig';

// Function to gather user behavior data from backend
export async function gatherUserBehaviorData(userId, userEmail) {
  try {
    const [incomeData, goalsData, literacyData, profileData] = await Promise.all([
      getIncomeEntries(userId).catch(() => []),
      getSavingsGoals(userId).catch(() => []),
      getLiteracyProgress(userId).catch(() => ({ lessons: {} })),
      getUserProfileByEmail(userEmail).catch(() => null)
    ]);

    // Transform data to match the expected schema
    const userBehavior = {
      userId: userId,
      recent_transactions: [], // We don't have transaction data in the current backend
      recent_income: incomeData.map(income => ({
        id: income.id,
        userId: income.userId,
        amount: income.amount,
        source: income.source || 'Unknown',
        date: income.date
      })),
      user_profile: profileData ? {
        id: profileData.id,
        email: profileData.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        password: '', // Don't send password
        phoneNumber: profileData.phoneNumber || '',
        age: profileData.age || '',
        occupation: profileData.occupation || '',
        visaStatus: profileData.visaStatus || '',
        preferredLanguage: profileData.preferredLanguage || 'en',
        educationLevel: profileData.educationLevel || '',
        monthlyIncome: profileData.monthlyIncome || '',
        financialGoals: profileData.financialGoals || [],
        experience: profileData.experience || 'beginner'
      } : null,
      lesson_completions: literacyData ? {
        id: literacyData.id || userId,
        userId: userId,
        lessons: literacyData.lessons || {}
      } : null,
      savings_goals: goalsData.map(goal => ({
        id: goal.id,
        userId: goal.userId,
        goalName: goal.goalName,
        target: goal.target,
        saved: goal.saved,
        createdAt: goal.createdAt
      }))
    };

    return userBehavior;
  } catch (error) {
    console.error('Error gathering user behavior data:', error);
    throw error;
  }
}

// Call the Financial Coach API
export async function askFinancialCoach(userBehavior, question, fastApiEndpoint) {
  try {
    const response = await axios.post(`${fastApiEndpoint}/financial-coach`, {
      user: userBehavior,
      question: question
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: AI_CONFIG.TIMEOUT,
    });
    
    return response.data;
  } catch (error) {
    console.error('Financial Coach API Error:', error);
    if (error.response) {
      throw new Error(error.response.data?.detail || 'Failed to get financial advice');
    } else if (error.request) {
      throw new Error('Unable to connect to financial advisor service');
    } else {
      throw new Error('An error occurred while processing your request');
    }
  }
}
