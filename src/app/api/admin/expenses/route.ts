import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { getAuthenticatedUserId, isAdminUser } from '../../../../lib/auth/admin'

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 })
    }

    if (!(await isAdminUser(userId))) {
      return NextResponse.redirect(
        new URL('/admin?error=' + encodeURIComponent('غير مصرح لك'), request.url),
        { status: 303 }
      )
    }

    const formData = await request.formData()

    const title = String(formData.get('title') || '').trim()
    const amount = Number(formData.get('amount'))
    const expenseDate = String(formData.get('expense_date') || '').trim()
    const note = String(formData.get('note') || '').trim()

    if (!title || !amount || !expenseDate) {
      return NextResponse.redirect(
        new URL('/admin?error=' + encodeURIComponent('البيانات المطلوبة ناقصة'), request.url), 
        { status: 303 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('expenses').insert({
      title,
      amount,
      expense_date: expenseDate,
      note: note || null,
    })

    if (error) {
      return NextResponse.redirect(
        new URL('/admin?error=' + encodeURIComponent(error.message), request.url), 
        { status: 303 }
      )
    }

    return NextResponse.redirect(
      new URL('/admin?success=' + encodeURIComponent('تم إضافة المصروف'), request.url), 
      { status: 303 }
    )
  } catch {
    return NextResponse.redirect(
      new URL('/admin?error=' + encodeURIComponent('حدث خطأ غير متوقع'), request.url), 
      { status: 303 }
    )
  }
}