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

    const memberId = Number(formData.get('member_id'))
    const amount = Number(formData.get('amount'))
    const monthKey = String(formData.get('month_key') || '').trim()
    const note = String(formData.get('note') || '').trim()
    const invoiceFile = formData.get('invoice')

    if (!memberId || !amount || !monthKey) {
      return NextResponse.redirect(
        new URL(
          '/admin/payments?error=' + encodeURIComponent('البيانات المطلوبة ناقصة'),
          request.url
        ),
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
        new URL(
          '/admin/payments?error=' + encodeURIComponent('تعذر إضافة الدفعة. حاول مرة أخرى.'),
          request.url
        ),
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
          new URL(
            '/admin/payments?error=' +
              encodeURIComponent('تعذر رفع الإيصال. تم حفظ الدفعة بدون إيصال.'),
            request.url
          ),
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
          new URL(
            '/admin/payments?error=' +
              encodeURIComponent('تمت إضافة الدفعة ولكن تعذر ربط مسار الإيصال.'),
            request.url
          ),
          { status: 303 }
        )
      }
    }

    return NextResponse.redirect(
      new URL(
        '/admin/success?type=payment&message=' +
          encodeURIComponent('تمت إضافة الدفعة بنجاح') +
          '&redirectTo=' +
          encodeURIComponent('/admin/payments'),
        request.url
      ),
      { status: 303 }
    )
  } catch {
    return NextResponse.redirect(
      new URL(
        '/admin/payments?error=' + encodeURIComponent('حدث خطأ غير متوقع أثناء إضافة الدفعة'),
        request.url
      ),
      { status: 303 }
    )
  }
}