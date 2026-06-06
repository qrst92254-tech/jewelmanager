const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || null;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || null;

let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
    supabase = null;
  }
}

if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase admin client:', err.message);
    supabaseAdmin = null;
  }
}

if (!supabase) {
  console.error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY/SUPABASE_KEY environment variables.');
}

if (!supabaseAdmin) {
  console.error('Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable.');
}

function ensureSupabaseConfigured() {
  if (!supabase || !supabaseAdmin) {
    throw new Error('Missing Supabase env vars. Ensure SUPABASE_URL, SUPABASE_ANON_KEY (or SUPABASE_KEY), and SUPABASE_SERVICE_ROLE_KEY are set.');
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  ensureSupabaseConfigured,
};
