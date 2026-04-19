import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('--- Checking org_members table ---');
  // Try to query with a Clerk-like ID (string) to see if it causes a type error (UUID mismatch)
  const { data, error } = await supabase
    .from('org_members')
    .select('*')
    .eq('user_id', 'user_2nOnvPQx6mNBh6pDqZf6pXWp3v1') // Example Clerk ID
    .limit(1);

  if (error) {
    console.error('Error fetching org_members:', error);
    if (error.message.includes('invalid input syntax for type uuid')) {
      console.log('CORRECTED DIAGNOSIS: The user_id column is still a UUID type.');
    }
  } else {
    console.log('Fetch successful (or no results). user_id column might be a string.');
  }
}

checkSchema();
