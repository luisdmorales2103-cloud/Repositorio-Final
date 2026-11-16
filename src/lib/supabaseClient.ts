import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://ihsimnqprmfihwxjztlc.supabase.co';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.SUPABASE_PUBLISHABLE_KEY) ||
  'sb_publishable_c9280ZabG63_vTGxHc-Okg_RIRTzMQM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
