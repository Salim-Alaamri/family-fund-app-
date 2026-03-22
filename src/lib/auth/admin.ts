import { createAdminClient } from '../supabase/admin'
import { createClient } from '../supabase/server'

export async function getAuthenticatedUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id || null
}

export async function isAdminUser(userId: string) {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  return Boolean(data)
}
