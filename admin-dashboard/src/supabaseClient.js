import { createClient } from '@supabase/supabase-js';

// Hent værdierne
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Eksporter kun klienten hvis værdierne findes, ellers eksporter en "dummy" eller null
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.error("Kritisk fejl: Supabase variabler kunne ikke læses fra .env filen.");
}
