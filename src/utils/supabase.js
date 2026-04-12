import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uggacoqlkiskdmqqdpyt.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WLWm_vGkQ0b1Fh4UVf5ICw_PmUHh0b3';

export const supabase = createClient(supabaseUrl, supabaseKey);
