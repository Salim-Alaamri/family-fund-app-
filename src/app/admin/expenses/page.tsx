import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { isAdminUser } from '../../../lib/auth/admin'
import { ExpensesManagement } from './expenses-management'

type PageSearchParams = Record<string, string | string[] | undefined>

function readParam(sp: PageSearchParams, key: string) {
  const value = sp[key]
  return typeof value === 'string' ? value : undefined
}

export default async function AdminExpensesPage({
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

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, title, amount, expense_date, note')
    .order('expense_date', { ascending: false })

  const message = readParam(sp, 'message')
  const error = readParam(sp, 'error')

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">إدارة المصروفات</h1>
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
            <span>إضافة مصروف</span>
            <span className="text-sm text-gray-500 transition group-open:rotate-180">⌄</span>
          </summary>
          <form action="/api/admin/expenses" method="post" className="mt-4 space-y-4">
            <input
              name="title"
              placeholder="اسم المصروف"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              required
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="المبلغ"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              required
            />
            <input
              name="expense_date"
              type="date"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              required
            />
            <textarea
              name="note"
              placeholder="ملاحظة"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900"
              rows={3}
            />
            <button className="w-full rounded-xl bg-blue-600 p-3 font-medium text-white">
              إضافة مصروف
            </button>
          </form>
        </details>

        <ExpensesManagement
          expenses={expenses ?? []}
          initialMessage={message}
          initialError={error}
        />
      </div>
    </main>
  )
}
