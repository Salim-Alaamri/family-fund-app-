import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { requireAdminAuth } from '../../../../lib/auth/admin'

export async function POST(request: Request) {
  try {
    const auth = await requireAdminAuth()
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.status === 401 ? 'غير مصادق' : 'غير مصرح' },
        { status: auth.status }
      )
    }

    const formData = await request.formData()

    const title = String(formData.get('title') || '').trim()
    const amount = Number(formData.get('amount'))
    const expenseDate = String(formData.get('expense_date') || '').trim()
    const note = String(formData.get('note') || '').trim()

    if (!title || !amount || !expenseDate) {
      return NextResponse.redirect(
        new URL(
          '/admin/expenses?error=' + encodeURIComponent('البيانات المطلوبة ناقصة'),
          request.url
        ),
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
        new URL(
          '/admin/expenses?error=' + encodeURIComponent('تعذر إضافة المصروف. حاول مرة أخرى.'),
          request.url
        ),
        { status: 303 }
      )
    }

    return NextResponse.redirect(
      new URL(
        '/admin/success?type=expense&message=' +
          encodeURIComponent('تمت إضافة المصروف بنجاح') +
          '&redirectTo=' +
          encodeURIComponent('/admin/expenses'),
        request.url
      ),
      { status: 303 }
    )
  } catch {
    return NextResponse.redirect(
      new URL(
        '/admin/expenses?error=' + encodeURIComponent('حدث خطأ غير متوقع أثناء إضافة المصروف'),
        request.url
      ),
      { status: 303 }
    )
  }
}