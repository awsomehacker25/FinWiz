import axios from 'axios';
import { AZURE_FUNCTIONS_BASE_URL } from '@env';
console.log('AZURE_FUNCTIONS_BASE_URL', AZURE_FUNCTIONS_BASE_URL);

const api = axios.create({
  baseURL: AZURE_FUNCTIONS_BASE_URL,
});

export default api;

export async function upsertUserProfile(profile) {
  try {
    const response = await api.post('/userProfile', profile);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upsert user profile');
  }
}

export const getUserProfileByEmail = async (email) => {
  try {
    const res = await api.get(`/userProfile`, { params: { id: email } });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export async function getLiteracyProgress(userId) {
  try {
    const response = await api.get('/literacy', { params: { userId } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch literacy progress');
  }
}

export async function upsertLiteracyProgress(userId, lessons) {
  try {
    const response = await api.post('/literacy', { userId, lessons });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update literacy progress');
  }
}

// Edit a reply
export async function editReply({ threadId, replyId, userId, body }) {
  try {
    const res = await api.put('/community', { threadId, replyId, userId, body });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Failed to edit reply');
  }
}

// Delete a reply
export async function deleteReply({ threadId, replyId, userId }) {
  try {
    const res = await api.delete('/community', { data: { threadId, replyId, userId } });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Failed to delete reply');
  }
}

// Get all income entries for a user
export async function getIncomeEntries(userId) {
  try {
    const response = await api.get('/income', { params: { userId } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch income entries');
  }
}

// Get all savings goals for a user
export async function getSavingsGoals(userId) {
  try {
    const response = await api.get('/goals', { params: { userId } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch savings goals');
  }
}

// Get all spending entries for a user
export async function getSpendingEntries(userId) {
  try {
    const response = await api.get('/spending', { params: { userId } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch spending entries');
  }
} 