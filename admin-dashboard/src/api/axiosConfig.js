import axios from 'axios';
import { supabase } from '../supabaseClient'; // Importér din eksisterende supabase instans

const api = axios.create({
  baseURL: 'http://localhost:5172/api', // Erstat med din C# API URL
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
