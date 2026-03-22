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

  const currentMonthPaidCount =
    payments?.filter((item) => item.month_key === currentMonth).length ?? 0

  const balance = totalPayments - totalExpenses

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <header className="space-y-2 text-right">
          <h1 className="text-3xl font-bold">
            {settings?.association_name ?? 'صندوق العائلة'}
          </h1>
          <p className="text-sm text-gray-600">
            {settings?.description ?? 'نظام مبسط لإدارة صندوق العائلة'}
          </p>
          <div className="text-sm text-gray-500">
            الشهر الحالي: {formatMonthKeyAr(currentMonth)}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">إجمالي المدفوع</div>
            <div className="mt-1 text-2xl font-semibold">
              {totalPayments.toFixed(2)} {settings?.currency ?? 'OMR'}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">إجمالي المصروف</div>
            <div className="mt-1 text-2xl font-semibold">
              {totalExpenses.toFixed(2)} {settings?.currency ?? 'OMR'}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">الرصيد الحالي</div>
            <div className="mt-1 text-2xl font-semibold">
              {balance.toFixed(2)} {settings?.currency ?? 'OMR'}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <Link
            href="/members"
            className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:bg-gray-50"
          >
            <div className="text-sm text-gray-500">الأعضاء</div>
            <div className="mt-1 text-lg font-semibold">
              {members?.length ?? 0} عضو نشط
            </div>
            <div className="mt-1 text-sm text-gray-500">
              المدفوعون هذا الشهر: {currentMonthPaidCount}
            </div>
          </Link>

          <Link
            href="/expenses"
            className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:bg-gray-50"
          >
            <div className="text-sm text-gray-500">المصروفات</div>
            <div className="mt-1 text-lg font-semibold">
              {settings?.currency ?? 'OMR'} {totalExpenses.toFixed(2)}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              عرض جميع المصروفات
            </div>
          </Link>
        </section>
      </div>
    </main>
  )
}