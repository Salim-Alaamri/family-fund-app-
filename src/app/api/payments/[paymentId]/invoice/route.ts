import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

type RouteContext = {
  params: Promise<{ paymentId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { paymentId } = await context.params
  const id = Number(paymentId)

  if (!id) {
    return NextResponse.json({ error: 'معرّف الدفعة غير صالح' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const invoiceBucket = 'invoices'

  const { data: payment, error } = await supabase
    .from('payments')
    .select('invoice_path')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  if (!payment.invoice_path) {
    return NextResponse.json({ error: 'لا يوجد إيصال لهذه الدفعة' }, { status: 404 })
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(invoiceBucket)
    .createSignedUrl(payment.invoice_path, 60 * 5)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json({ error: signedUrlError?.message || 'تعذر فتح الإيصال' }, { status: 400 })
  }

  return NextResponse.redirect(signedUrlData.signedUrl)
}
