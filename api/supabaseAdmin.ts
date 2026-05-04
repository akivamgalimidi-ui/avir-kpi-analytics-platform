import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Persistence will be disabled.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function getOrCreateOrg(name: string = "Default Organization") {
  const { data: existing } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from('organizations')
    .insert({ name })
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}
