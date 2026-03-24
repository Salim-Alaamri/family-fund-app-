import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../../lib/supabase/admin'
import { requireAdminAuth } from '../../../../../../lib/auth/admin'

type RouteContext = { params: Promise<{ id: string }> }

function redirectToMembers(request: Request, type: 'message' | 'error', value: string) {
  return NextResponse.redirect(
    new URL(`/admin/members?${type}=${encodeURIComponent(value)}`, request.url),
    { status: 303 }
  )
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }

  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return redirectToMembers(request, 'error', 'معرّف العضو غير صالح')

  const supabase = createAdminClient()
  const { data: member } = await supabase.from('members').select('is_active').eq('id', id).maybeSingle()
  if (!member) return redirectToMembers(request, 'error', 'العضو غير موجود')

  const { error } = await supabase.from('members').update({ is_active: !member.is_active }).eq('id', id)
  if (error) return redirectToMembers(request, 'error', 'تعذر تغيير حالة العضو')

  return redirectToMembers(request, 'message', 'تم تحديث حالة العضو')
}
