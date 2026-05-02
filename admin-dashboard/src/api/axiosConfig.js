import axios from 'axios';
import { supabase } from '../supabaseClient'; // Importér din eksisterende supabase instans
import { notifyError, notifySuccess } from '../components/toast/toastBus';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5172/api',
});

const CRUD_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const getOperationLabel = (method) => {
  const normalized = (method || '').toLowerCase();

  if (normalized === 'post') return 'oprettet';
  if (normalized === 'put' || normalized === 'patch') return 'opdateret';
  if (normalized === 'delete') return 'slettet';
  return 'gemt';
};

const getResourceLabel = (url = '') => {
  const path = url.split('?')[0] || '';

  if (path.includes('/employees')) return 'Medarbejder';
  if (path.includes('/roles')) return 'Rolle';
  if (path.includes('/shifts')) return 'Vagt';
  if (path.includes('/contacts')) return 'Kontakt';
  if (path.includes('/associations')) return 'Forening';
  if (path.includes('/events')) return 'Aktivitet';
  if (path.includes('/locations')) return 'Lokation';
  return 'Data';
};

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

api.interceptors.response.use((response) => {
  const method = response?.config?.method?.toLowerCase();
  const skipToast = Boolean(response?.config?.skipCrudToast);

  if (CRUD_METHODS.has(method) && !skipToast) {
    const resource = getResourceLabel(response?.config?.url || '');
    const operation = getOperationLabel(method);
    notifySuccess(`${resource} blev ${operation}.`);
  }

  return response;
}, (error) => {
  const method = error?.config?.method?.toLowerCase();
  const skipToast = Boolean(error?.config?.skipCrudToast);

  if (CRUD_METHODS.has(method) && !skipToast) {
    const apiMessage = error?.response?.data?.message
      || error?.response?.data?.title
      || (typeof error?.response?.data === 'string' ? error.response.data : '');
    const fallback = method === 'delete' ? 'Kunne ikke slette.' : 'Handlingen mislykkedes.';
    notifyError(apiMessage || fallback);
  }

  return Promise.reject(error);
});

export default api;
