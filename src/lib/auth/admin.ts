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
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('admin_users check failed:', error)
    return false
  }

  return Boolean(data?.id)
}

export type RequireAdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 }

export async function requireAdminAuth(): Promise<RequireAdminAuthResult> {
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return { ok: false, status: 401 }
  }

  const isAdmin = await isAdminUser(userId)

  if (!isAdmin) {
    return { ok: false, status: 403 }
  }

  return { ok: true, userId }
}