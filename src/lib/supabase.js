import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
// For local testing without real backend, you still need valid-looking URL/KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.mock';

export const supabase = createClient(supabaseUrl, supabaseKey);
