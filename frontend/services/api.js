import axios from 'axios';
import { AZURE_FUNCTIONS_BASE_URL } from '@env';

const api = axios.create({
  baseURL: AZURE_FUNCTIONS_BASE_URL,
});

export default api; 