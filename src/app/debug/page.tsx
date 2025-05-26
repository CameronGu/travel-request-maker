// src/app/debug/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function Debug() {
  const supabase = await createClient() // await needed!
  const { data, error } = await supabase.from('test').select()
  if (error) throw error
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
