import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function testConnection() {
  const { data, error } = await supabase
    .from('test_connection')
    .select('*')

  if (error) {
    console.error('Supabase connection check:', error.message)
    return { success: false, error: error.message }
  }

  console.log('Supabase connection successful:', data)
  return { success: true, data }
}
