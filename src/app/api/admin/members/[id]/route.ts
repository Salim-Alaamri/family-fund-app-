import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireAdminAuth } from '../../../../../lib/auth/admin'

type RouteContext = { params: Promise<{ id: string }> }

function adminMembersRedirect(request: Request, type: 'message' | 'error', value: string) {
  return NextResponse.redirect(
    new URL(`/admin/members?${type}=${encodeURIComponent(value)}`, request.url),
    { status: 303 }
  )
}

async function updateMember(request: Request, id: number, formData?: FormData) {
  const payload = formData ?? (await request.formData())
  const name = String(payload.get('name') || '').trim()
  const phone = String(payload.get('phone') || '').trim()
  const note = String(payload.get('note') || '').trim()
  const isActive = String(payload.get('is_active') || 'true') === 'true'

  if (!name) {
    return adminMembersRedirect(request, 'error', 'الاسم مطلوب')
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('members')
    .update({
      name,
      phone: phone || null,
      note: note || null,
      is_active: isActive,
    })
    .eq('id', id)

  if (error) {
    return adminMembersRedirect(request, 'error', 'تعذر تعديل بيانات العضو')
  }

  return adminMembersRedirect(request, 'message', 'تم تعديل العضو بنجاح')
}

async function toggleMember(request: Request, id: number) {
  const supabase = createAdminClient()
  const { data: member } = await supabase.from('members').select('is_active').eq('id', id).maybeSingle()

  if (!member) {
    return adminMembersRedirect(request, 'error', 'العضو غير موجود')
  }

  const { error } = await supabase.from('members').update({ is_active: !member.is_active }).eq('id', id)

  if (error) {
    return adminMembersRedirect(request, 'error', 'تعذر تغيير حالة العضو')
  }

  return adminMembersRedirect(request, 'message', 'تم تحديث حالة العضو')
}

async function deleteMember(request: Request, id: number) {
  const supabase = createAdminClient()
  const { data: paymentRef } = await supabase
    .from('payments')
    .select('id')
    .eq('member_id', id)
    .limit(1)
    .maybeSingle()

  if (paymentRef) {
    return adminMembersRedirect(
      request,
      'error',
      'لا يمكن حذف العضو لأنه مرتبط بدفعات، يمكن تعطيله بدلًا من ذلك'
    )
  }

  const { error } = await supabase.from('members').delete().eq('id', id)

  if (error) {
    return adminMembersRedirect(request, 'error', 'تعذر حذف العضو')
  }

  return adminMembersRedirect(request, 'message', 'تم حذف العضو بنجاح')
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }

  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) {
    return adminMembersRedirect(request, 'error', 'معرّف العضو غير صالح')
  }

  const formData = await request.formData()
  const action = String(formData.get('_action') || '')

  if (action === 'update') return updateMember(request, id, formData)
  if (action === 'toggle') return toggleMember(request, id)
  if (action === 'delete') return deleteMember(request, id)

  return adminMembersRedirect(request, 'error', 'إجراء غير صالح')
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return NextResponse.json({ error: 'معرّف العضو غير صالح' }, { status: 400 })
  return updateMember(request, id)
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return NextResponse.json({ error: 'معرّف العضو غير صالح' }, { status: 400 })
  return deleteMember(request, id)
}
