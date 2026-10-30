import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local');
  process.exit(1);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('test_connection').select('*');

  if (error) {
    if (error.code === 'PGRST205') {
      console.log('⚠️  Connected to Supabase project successfully!');
      console.log('   Notice: The table `public.test_connection` has not been created yet.');
      console.log('   Please run Step 4 (the SQL script) in your Supabase SQL Editor.');
    } else {
      console.error('❌ Supabase error:', error.message);
    }
    return;
  }

  console.log('✅ Supabase connected successfully!');
  console.log('Data returned from `test_connection`:', data);
}

test();

