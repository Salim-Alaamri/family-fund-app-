import Link from 'next/link'
import { formatMonthKeyAr, getCurrentMonthKey, getMonthOptionsAr } from '../../lib/month'
import { createClient } from '../../lib/supabase/server'

type PageSearchParams = Record<string, string | string[] | undefined>

function isSearchParamsPromise(
  value: PageSearchParams | Promise<PageSearchParams> | undefined
): value is Promise<PageSearchParams> {
  return Boolean(value) && typeof value === 'object' && 'then' in value
}

function getMonthNumberFromKey(monthKey: string) {
  const monthPart = monthKey.split('-')[1]
  const monthNumber = Number(monthPart)

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return ''
  }

  return String(monthNumber)
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: PageSearchParams | Promise<PageSearchParams>
}) {
  const supabase = await createClient()
  const sp = isSearchParamsPromise(searchParams)
    ? await searchParams
    : (searchParams ?? {})
  const selectedMonth =
    (typeof sp?.month === 'string' && sp?.month) || getCurrentMonthKey()
  const selectedMonthNumber = getMonthNumberFromKey(selectedMonth)
  const monthOptions = getMonthOptionsAr(selectedMonth)

  const { data: members, error } = await supabase
    .from('members')
    .select(`
      id,
      name,
      payments (
        id,
        month_key,
        amount,
        note,
        invoice_path
      )
    `)
    .eq('is_active', true)
    .order('id', { ascending: true })

  if (error) {
    return <div>خطأ: {error.message}</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">الأعضاء</h1>
          <Link href="/" className="text-sm text-blue-600">
            القائمة الرئيسية
          </Link>
        </div>

        <form className="rounded-2xl bg-white p-4 shadow-sm" method="get">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            اختر الشهر
          </label>
          <div className="flex items-center gap-2">
            <select
              name="month"
              defaultValue={selectedMonth}
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <button className="whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              تحديث
            </button>
          </div>
        </form>

        <section className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
          <div dir="rtl" className="grid grid-cols-5 border-b border-gray-300 bg-blue-100 px-4 py-3 text-center text-xs font-semibold text-gray-700">
            <div className="border-l border-gray-300 pr-2 text-right">الاسم</div>
            <div className="border-l border-gray-300 px-2">المبلغ</div>
            <div className="border-l border-gray-300 px-2 text-[11px]">الشهر</div>
            <div className="border-l border-gray-300 px-2">الحالة</div>
            <div className="px-2 text-[11px]">الإيصال</div>
          </div>

          {members?.map((member) => {
            const monthPayment = member.payments?.find(
              (payment: { month_key: string }) => payment.month_key === selectedMonth
            )
            const hasPaid = Boolean(monthPayment)
            const paymentNote =
              typeof monthPayment?.note === 'string' ? monthPayment.note.trim() : ''

            return (
              <div
                key={member.id}
                dir="rtl"
                className="relative grid grid-cols-5 items-center border-b border-gray-300 px-4 py-3 last:border-b-0 hover:bg-gray-50"
              >
                <Link
                  href={`/members/${member.id}`}
                  className="absolute inset-0"
                  aria-label={`عرض تفاصيل العضو ${member.name}`}
                />
                <div dir="rtl" className="whitespace-nowrap border-l border-gray-300 pr-2 text-right text-xs font-semibold text-gray-900 pointer-events-none">
                  {member.name}
                </div>
                <div className="border-l border-gray-300 px-2 text-center text-sm text-gray-700 pointer-events-none">
                  {monthPayment ? `${Number(monthPayment.amount).toLocaleString('en-US')} OMR` : '-'}
                </div>
                <div className="border-l border-gray-300 px-2 text-center text-xs text-gray-500 pointer-events-none">
                  {formatMonthKeyAr(selectedMonth)}
                  {selectedMonthNumber ? ` (${selectedMonthNumber})` : ''}
                </div>
                <div className="border-l border-gray-300 px-2 text-center space-y-1 pointer-events-none">
                  <span
                    className={`inline-flex rounded-full font-medium ${
                      hasPaid
                        ? 'bg-green-100 px-2 py-0.5 text-[10px] leading-4 text-green-700'
                        : 'bg-red-100 px-1.5 py-0 text-[9px] leading-4 text-red-700'
                    }`}
                  >
                    {hasPaid ? 'تم الدفع' : 'لم يتم الدفع'}
                  </span>
                  {paymentNote ? (
                    <p className="text-xs text-gray-600">{paymentNote}</p>
                  ) : null}
                </div>
                <div className="relative z-10 px-2 text-center">
                  {monthPayment?.invoice_path ? (
                    <Link
                      href={`/api/payments/${monthPayment.id}/invoice`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1 text-[10px] font-medium text-blue-600"
                      title="عرض الإيصال"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M6 2a2 2 0 00-2 2v16.586a1 1 0 001.707.707L8 19l2.293 2.293a1 1 0 001.414 0L14 19l2.293 2.293A1 1 0 0018 20.586V4a2 2 0 00-2-2H6z" />
                      </svg>
                      عرض الإيصال
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed text-[10px] text-gray-400">
                      لا يوجد إيصال
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}