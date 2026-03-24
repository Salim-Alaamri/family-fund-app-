import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireAdminAuth } from '../../../../../lib/auth/admin'

type RouteContext = { params: Promise<{ id: string }> }

function adminPaymentsRedirect(request: Request, type: 'message' | 'error', value: string) {
  return NextResponse.redirect(
    new URL(`/admin/payments?${type}=${encodeURIComponent(value)}`, request.url),
    { status: 303 }
  )
}

function mapPaymentError(request: Request, message = 'تعذر تعديل الدفعة') {
  return adminPaymentsRedirect(request, 'error', message)
}

async function updatePayment(request: Request, id: number, formData?: FormData) {
  const payload = formData ?? (await request.formData())
  const memberId = Number(payload.get('member_id'))
  const amount = Number(payload.get('amount'))
  const monthKey = String(payload.get('month_key') || '').trim()
  const note = String(payload.get('note') || '').trim()
  const invoiceFile = payload.get('invoice')

  if (!memberId || !amount || !monthKey) {
    return mapPaymentError(request, 'البيانات المطلوبة ناقصة')
  }

  const supabase = createAdminClient()

  let invoicePath: string | null | undefined
  if (invoiceFile instanceof File && invoiceFile.size > 0) {
    const extension = invoiceFile.name.includes('.')
      ? invoiceFile.name.split('.').pop()?.toLowerCase()
      : 'bin'
    invoicePath = `${memberId}/${monthKey}.${extension || 'bin'}`

    const fileBuffer = await invoiceFile.arrayBuffer()
    const { error: uploadError } = await supabase.storage.from('invoices').upload(invoicePath, fileBuffer, {
      contentType: invoiceFile.type || undefined,
      upsert: true,
    })

    if (uploadError) {
      return mapPaymentError(request, 'تعذر رفع الإيصال')
    }
  }

  const { error } = await supabase
    .from('payments')
    .update({
      member_id: memberId,
      amount,
      month_key: monthKey,
      note: note || null,
      ...(invoicePath ? { invoice_path: invoicePath } : {}),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return mapPaymentError(request, 'هذه الدفعة موجودة مسبقًا لنفس العضو والشهر')
    }
    return mapPaymentError(request)
  }

  return adminPaymentsRedirect(request, 'message', 'تم تعديل الدفعة بنجاح')
}

async function deletePayment(request: Request, id: number) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) return adminPaymentsRedirect(request, 'error', 'تعذر حذف الدفعة')
  return adminPaymentsRedirect(request, 'message', 'تم حذف الدفعة بنجاح')
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }

  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return adminPaymentsRedirect(request, 'error', 'معرّف الدفعة غير صالح')

  const formData = await request.formData()
  const action = String(formData.get('_action') || '')

  if (action === 'update') return updatePayment(request, id, formData)
  if (action === 'delete') return deletePayment(request, id)

  return adminPaymentsRedirect(request, 'error', 'إجراء غير صالح')
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return NextResponse.json({ error: 'معرّف الدفعة غير صالح' }, { status: 400 })
  return updatePayment(request, id)
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return NextResponse.json({ error: 'معرّف الدفعة غير صالح' }, { status: 400 })
  return deletePayment(request, id)
}
