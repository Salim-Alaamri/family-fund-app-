import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireAdminAuth } from '../../../../../lib/auth/admin'

type RouteContext = { params: Promise<{ id: string }> }

function adminExpensesRedirect(request: Request, type: 'message' | 'error', value: string) {
  return NextResponse.redirect(
    new URL(`/admin/expenses?${type}=${encodeURIComponent(value)}`, request.url),
    { status: 303 }
  )
}

async function updateExpense(request: Request, id: number, formData?: FormData) {
  const payload = formData ?? (await request.formData())
  const title = String(payload.get('title') || '').trim()
  const amount = Number(payload.get('amount'))
  const expenseDate = String(payload.get('expense_date') || '').trim()
  const note = String(payload.get('note') || '').trim()

  if (!title || !amount || !expenseDate) {
    return adminExpensesRedirect(request, 'error', 'البيانات المطلوبة ناقصة')
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('expenses')
    .update({
      title,
      amount,
      expense_date: expenseDate,
      note: note || null,
    })
    .eq('id', id)

  if (error) return adminExpensesRedirect(request, 'error', 'تعذر تعديل المصروف')
  return adminExpensesRedirect(request, 'message', 'تم تعديل المصروف بنجاح')
}

async function deleteExpense(request: Request, id: number) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return adminExpensesRedirect(request, 'error', 'تعذر حذف المصروف')
  return adminExpensesRedirect(request, 'message', 'تم حذف المصروف بنجاح')
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return adminExpensesRedirect(request, 'error', 'معرّف المصروف غير صالح')

  const formData = await request.formData()
  const action = String(formData.get('_action') || '')
  if (action === 'update') return updateExpense(request, id, formData)
  if (action === 'delete') return deleteExpense(request, id)
  return adminExpensesRedirect(request, 'error', 'إجراء غير صالح')
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return NextResponse.json({ error: 'معرّف المصروف غير صالح' }, { status: 400 })
  return updateExpense(request, id)
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' }, { status: auth.status })
  }
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!id) return NextResponse.json({ error: 'معرّف المصروف غير صالح' }, { status: 400 })
  return deleteExpense(request, id)
}
