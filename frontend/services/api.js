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