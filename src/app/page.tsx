import Link from 'next/link'
import { createClient } from '../lib/supabase/server'
import { formatMonthKeyAr, getCurrentMonthKey } from '../lib/month'

export default async function HomePage() {
  const supabase = await createClient()

  const currentMonth = getCurrentMonthKey()

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .single()

  const { data: members } = await supabase
    .from('members')
    .select('id')
    .eq('is_active', true)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount, month_key')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')

  const totalPayments =
    payments?.reduce((sum, item) => sum + Number(item.amount), 0) ?? 0

  const totalExpenses =
    expenses?.reduce((sum, item) => sum + Number(item.amount), 0) ?? 0
  const expensePaymentsCount = expenses?.length ?? 0

  const currentMonthPaidCount =
    payments?.filter((item) => item.month_key === currentMonth).length ?? 0

  const balance = totalPayments - totalExpenses

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
      <header className="-mx-4 mb-4 bg-white/80 px-4 py-4 shadow-sm">
        <h1 className="text-center text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          الصندوق الشبابي العائلي
        </h1>
      </header>

      <div className="mx-auto max-w-md space-y-4">
        <header className="space-y-2 text-right">
          <h2 className="sr-only">
            الصندوق الشبابي العائلي
          </h2>
          <div className="flex items-center justify-between gap-2 text-sm">
            <p className="text-gray-600">نظام مبسط لإدارة الصندوق</p>
            <span className="whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700">
              الشهر الحالي: {formatMonthKeyAr(currentMonth)}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-sm">
            <div className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              الرصيد الحالي
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-800">
              {balance.toFixed(2)} {settings?.currency ?? 'OMR'}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm text-gray-500">إجمالي الحركة المالية</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-50 p-3">
                <div className="text-xs font-medium text-green-700">إجمالي المدفوع</div>
                <div className="mt-1 text-lg font-semibold text-green-800">
                  {totalPayments.toFixed(2)} {settings?.currency ?? 'OMR'}
                </div>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <div className="text-xs font-medium text-rose-700">إجمالي المصروف</div>
                <div className="mt-1 text-lg font-semibold text-rose-800">
                  {totalExpenses.toFixed(2)} {settings?.currency ?? 'OMR'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">الأعضاء</div>
              <Link href="/members" className="text-xs text-blue-600 hover:text-blue-700">
                عرض
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-3">
                <div className="text-xs font-medium text-blue-700">عدد الأعضاء النشطين</div>
                <div className="mt-1 text-lg font-semibold text-blue-800">
                  {members?.length ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-indigo-50 p-3">
                <div className="text-xs font-medium text-indigo-700">تم الدفع هذا الشهر</div>
                <div className="mt-1 text-lg font-semibold text-indigo-800">
                  {currentMonthPaidCount}{' '}
                  {currentMonthPaidCount === 1 ? 'عضو' : 'أعضاء'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">المصروفات</div>
              <Link href="/expenses" className="text-xs text-blue-600 hover:text-blue-700">
                عرض
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-amber-50 p-3">
                <div className="text-xs font-medium text-amber-700">إجمالي المصروفات</div>
                <div className="mt-1 text-lg font-semibold text-amber-800">
                  {totalExpenses.toFixed(2)} {settings?.currency ?? 'OMR'}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-xs font-medium text-gray-600">دفعات الصرف</div>
                <div className="mt-1 text-sm font-semibold text-gray-800">
                  {expensePaymentsCount}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}