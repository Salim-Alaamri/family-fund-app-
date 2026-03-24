import Link from 'next/link'
import { formatMonthKeyAr } from '../../../lib/month'
import { createClient } from '../../../lib/supabase/server'

type PageProps = {
  params: Promise<{ id: string }>
}

function formatAmount(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export default async function MemberDetailsPage({ params }: PageProps) {
  const { id } = await params
  const memberId = Number(id)

  if (!memberId) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
        <div className="mx-auto max-w-md space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">العضو غير موجود</h1>
            <p className="mt-2 text-sm text-gray-600">تعذر العثور على بيانات هذا العضو.</p>
            <Link href="/members" className="mt-4 inline-flex text-sm font-medium text-blue-600">
              الرجوع إلى الأعضاء
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const supabase = await createClient()

  const [{ data: member, error: memberError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from('members')
        .select('id, name, is_active')
        .eq('id', memberId)
        .maybeSingle(),
      supabase
        .from('payments')
        .select('id, month_key, amount, invoice_path, note')
        .eq('member_id', memberId)
        .order('month_key', { ascending: false }),
    ])

  if (memberError || !member) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
        <div className="mx-auto max-w-md space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">العضو غير موجود</h1>
            <p className="mt-2 text-sm text-gray-600">تعذر العثور على بيانات هذا العضو.</p>
            <Link href="/members" className="mt-4 inline-flex text-sm font-medium text-blue-600">
              الرجوع إلى الأعضاء
            </Link>
          </section>
        </div>
      </main>
    )
  }

  if (paymentsError) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
        <div className="mx-auto max-w-md space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">حدث خطأ</h1>
            <p className="mt-2 text-sm text-gray-600">تعذر تحميل سجل الدفعات لهذا العضو.</p>
            <Link href="/members" className="mt-4 inline-flex text-sm font-medium text-blue-600">
              الرجوع إلى الأعضاء
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const paymentRows = payments ?? []
  const paymentsCount = paymentRows.length
  const totalPaid = paymentRows.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const latestPaidMonth = paymentRows[0]?.month_key

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-white px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
            <Link href="/members" className="text-sm font-medium text-blue-600">
              رجوع
            </Link>
          </div>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {member.is_active ? 'نشط' : 'معطل'}
            </span>
          </div>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-2 sm:px-3">
              <p className="text-xs font-semibold text-gray-500">إجمالي ما دفعه العضو</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{formatAmount(totalPaid)} OMR</p>
            </div>
            <div className="py-2 sm:px-3">
              <p className="text-xs font-semibold text-gray-500">عدد الدفعات</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{paymentsCount}</p>
            </div>
            <div className="py-2 sm:px-3">
              <p className="text-xs font-semibold text-gray-500">آخر شهر دفع فيه</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {latestPaidMonth ? formatMonthKeyAr(latestPaidMonth) : '-'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">سجل الدفعات</h2>

          {paymentRows.length === 0 ? (
            <p className="text-sm text-gray-600">لا توجد دفعات لهذا العضو حتى الآن</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-right text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-3 py-2">الشهر</th>
                    <th className="px-3 py-2">المبلغ</th>
                    <th className="px-3 py-2">الحالة</th>
                    <th className="px-3 py-2">الإيصال</th>
                    <th className="px-3 py-2">الملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((payment) => (
                    <tr key={payment.id} className="border-t border-gray-200">
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                        {formatMonthKeyAr(payment.month_key)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-900">
                        {formatAmount(Number(payment.amount || 0))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          تم الدفع
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {payment.invoice_path ? (
                          <Link
                            href={`/api/payments/${payment.id}/invoice`}
                            target="_blank"
                            className="text-sm font-medium text-blue-600"
                          >
                            عرض الإيصال
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">لا يوجد إيصال</span>
                        )}
                      </td>
                      <td className="min-w-[140px] px-3 py-2 text-gray-700">
                        {payment.note?.trim() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
