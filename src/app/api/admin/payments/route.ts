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

    const memberId = Number(formData.get('member_id'))
    const amount = Number(formData.get('amount'))
    const monthKey = String(formData.get('month_key') || '').trim()
    const note = String(formData.get('note') || '').trim()
    const invoiceFile = formData.get('invoice')

    if (!memberId || !amount || !monthKey) {
      return NextResponse.redirect(
        new URL('/admin?error=' + encodeURIComponent('البيانات المطلوبة ناقصة'), request.url), 
        { status: 303 }
      )
    }

    const supabase = createAdminClient()
    const invoiceBucket = 'invoices'

    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        member_id: memberId,
        amount,
        month_key: monthKey,
        note: note || null,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.redirect(
        new URL('/admin?error=' + encodeURIComponent(insertError.message), request.url), 
        { status: 303 }
      )
    }

    if (invoiceFile instanceof File && invoiceFile.size > 0) {
      const extension = invoiceFile.name.includes('.')
        ? invoiceFile.name.split('.').pop()?.toLowerCase()
        : 'bin'
      const storagePath = `${memberId}/${monthKey}.${extension || 'bin'}`

      const fileBuffer = await invoiceFile.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from(invoiceBucket)
        .upload(storagePath, fileBuffer, {
          contentType: invoiceFile.type || undefined,
          upsert: true,
        })

      if (uploadError) {
        console.error('Invoice upload failed', {
          memberId,
          monthKey,
          storagePath,
          message: uploadError.message,
        })
        return NextResponse.redirect(
          new URL('/admin?error=' + encodeURIComponent(uploadError.message), request.url), 
          { status: 303 }
        )
      }

      const { error: updateError } = await supabase
        .from('payments')
        .update({ invoice_path: storagePath })
        .eq('id', payment.id)

      if (updateError) {
        console.error('Payment invoice_path update failed', {
          paymentId: payment.id,
          storagePath,
          message: updateError.message,
        })
        return NextResponse.redirect(
          new URL('/admin?error=' + encodeURIComponent(updateError.message), request.url), 
          { status: 303 }
        )
      }
    }

    return NextResponse.redirect(
      new URL('/admin?success=' + encodeURIComponent('تم إضافة الدفعة'), request.url), 
      { status: 303 }
    )
  } catch {
    return NextResponse.redirect(
      new URL('/admin?error=' + encodeURIComponent('حدث خطأ غير متوقع'), request.url), 
      { status: 303 }
    )
  }
}