import axios from 'axios';
import { supabase } from '../supabaseClient'; // Importér din eksisterende supabase instans

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5172/api',
});

// En "Interceptor" der kører før hvert eneste kald
api.interceptors.request.use(async (config) => {
  // Tjek om supabase eksisterer før vi kalder auth
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
