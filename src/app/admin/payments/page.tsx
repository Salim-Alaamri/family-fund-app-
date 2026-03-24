import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentMonthKey, getMonthOptionsAr } from '../../../lib/month'
import { createClient } from '../../../lib/supabase/server'
import { isAdminUser } from '../../../lib/auth/admin'
import { PaymentsManagement } from './payments-management'

type PageSearchParams = Record<string, string | string[] | undefined>

function readParam(sp: PageSearchParams, key: string) {
  const value = sp[key]
  return typeof value === 'string' ? value : undefined
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}) {
  const sp =
    searchParams && typeof searchParams === 'object' && 'then' in searchParams
      ? await searchParams
      : (searchParams ?? {})

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (!(await isAdminUser(user.id))) redirect('/admin/login')

  const currentMonth = getCurrentMonthKey()
  const monthOptions = getMonthOptionsAr(currentMonth)

  const [{ data: members }, { data: payments }] = await Promise.all([
    supabase.from('members').select('id, name').order('name', { ascending: true }),
    supabase
      .from('payments')
      .select('id, member_id, month_key, amount, invoice_path, note')
      .order('month_key', { ascending: false }),
  ])
  const message = readParam(sp, 'message')
  const error = readParam(sp, 'error')

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">إدارة الدفعات</h1>
            <Link href="/admin" className="text-sm text-blue-600">
              رجوع للإدارة
            </Link>
          </div>
        </div>

        {message ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <details className="group rounded-2xl bg-white p-5 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-gray-900">
            <span>إضافة دفعة</span>
            <span className="text-sm text-gray-500 transition group-open:rotate-180">⌄</span>
          </summary>
          <form
            action="/api/admin/payments"
            method="post"
            encType="multipart/form-data"
            className="mt-4 space-y-4"
          >
            <select
              name="member_id"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              required
              defaultValue=""
            >
              <option value="" disabled>
                اختر العضو
              </option>
              {(members ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="المبلغ"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              required
            />
            <select
              name="month_key"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              required
              defaultValue={currentMonth}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <input
              name="invoice"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
            />
            <textarea
              name="note"
              placeholder="ملاحظة"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              rows={3}
            />
            <button className="w-full rounded-xl bg-blue-600 p-3 font-medium text-white">
              إضافة دفعة
            </button>
          </form>
        </details>

        <PaymentsManagement
          members={members ?? []}
          payments={payments ?? []}
          initialMessage={message}
          initialError={error}
        />
      </div>
    </main>
  )
}
