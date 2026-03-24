import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { isAdminUser } from '../../../lib/auth/admin'

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

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-right text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-3 py-2">العنوان</th>
                  <th className="px-3 py-2">المبلغ</th>
                  <th className="px-3 py-2">التاريخ</th>
                  <th className="px-3 py-2">الملاحظة</th>
                  <th className="px-3 py-2">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {(expenses ?? []).map((expense) => (
                  <tr key={expense.id} className="border-t border-gray-200 align-top">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                      {expense.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                      {Number(expense.amount).toLocaleString('en-US')} OMR
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                      {expense.expense_date}
                    </td>
                    <td className="min-w-[140px] px-3 py-2 text-gray-700">
                      {expense.note?.trim() || '-'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <details className="rounded-xl border border-gray-200 px-2 py-1">
                          <summary className="cursor-pointer text-xs font-medium text-blue-600">
                            تعديل
                          </summary>
                          <form
                            action={`/api/admin/expenses/${expense.id}`}
                            method="post"
                            className="mt-2 w-52 space-y-2"
                          >
                            <input type="hidden" name="_action" value="update" />
                            <input
                              name="title"
                              defaultValue={expense.title}
                              className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                              required
                            />
                            <input
                              name="amount"
                              type="number"
                              step="0.01"
                              defaultValue={String(expense.amount)}
                              className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                              required
                            />
                            <input
                              name="expense_date"
                              type="date"
                              defaultValue={expense.expense_date}
                              className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                              required
                            />
                            <textarea
                              name="note"
                              defaultValue={expense.note || ''}
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                            />
                            <button className="w-full rounded-lg bg-blue-600 p-2 text-xs text-white">
                              حفظ التعديل
                            </button>
                          </form>
                        </details>

                        <details className="rounded-xl border border-red-200 px-2 py-1">
                          <summary className="cursor-pointer text-xs font-medium text-red-700">
                            حذف
                          </summary>
                          <form
                            action={`/api/admin/expenses/${expense.id}`}
                            method="post"
                            className="mt-2 w-32"
                          >
                            <input type="hidden" name="_action" value="delete" />
                            <button className="w-full rounded-lg bg-red-600 p-2 text-xs text-white">
                              تأكيد الحذف
                            </button>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
