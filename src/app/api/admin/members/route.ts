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

    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const note = String(formData.get('note') || '').trim()

    if (!name) {
      return NextResponse.redirect(
        new URL('/admin?error=' + encodeURIComponent('الاسم مطلوب'), request.url), 
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
        new URL('/admin?error=' + encodeURIComponent(error.message), request.url), 
        { status: 303 }
      )
    }

    return NextResponse.redirect(
      new URL('/admin?success=' + encodeURIComponent('تم إضافة العضو'), request.url), 
      { status: 303 }
    )
  } catch {
    return NextResponse.redirect(
      new URL('/admin?error=' + encodeURIComponent('حدث خطأ غير متوقع'), request.url), 
      { status: 303 }
    )
  }
}