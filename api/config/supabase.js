const { createClient } = require('@supabase/supabase-js');

const assertSupabaseEnv = () => {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`);
  }
};

const createSupabaseClient = () => {
  assertSupabaseEnv();

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'penta-minds-api'
      }
    }
  });
};

const supabase = createSupabaseClient();

const testSupabaseConnection = async () => {
  const { error } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Supabase connection test failed: ${error.message}`);
  }

  return true;
};

module.exports = {
  supabase,
  assertSupabaseEnv,
  testSupabaseConnection
};
