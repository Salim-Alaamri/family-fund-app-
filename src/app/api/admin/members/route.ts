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

    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const note = String(formData.get('note') || '').trim()

    if (!name) {
      return NextResponse.redirect(
        new URL('/admin?member_error=' + encodeURIComponent('الاسم مطلوب'), request.url),
        { status: 303 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('members').insert({
      name,
      phone: phone || null,
      note: note || null,
      is_active: true,
    })

    if (error) {
      return NextResponse.redirect(
        new URL(
          '/admin?member_error=' + encodeURIComponent('تعذر إضافة العضو. حاول مرة أخرى.'),
          request.url
        ),
        { status: 303 }
      )
    }

    return NextResponse.redirect(
      new URL(
        '/admin/success?type=member&message=' +
          encodeURIComponent('تمت إضافة العضو بنجاح') +
          '&redirectTo=' +
          encodeURIComponent('/admin'),
        request.url
      ),
      { status: 303 }
    )
  } catch {
    return NextResponse.redirect(
      new URL(
        '/admin?member_error=' + encodeURIComponent('حدث خطأ غير متوقع أثناء إضافة العضو'),
        request.url
      ),
      { status: 303 }
    )
  }
}