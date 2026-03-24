import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

function formatAmount(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export default async function ExpensesPage() {
  const supabase = await createClient()

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('id, title, amount, expense_date, note')
    .order('expense_date', { ascending: false })

  if (error) {
    return <div>خطأ: {error.message}</div>
  }

  const expenseRows = expenses ?? []
  const expensesCount = expenseRows.length
  const totalExpenses = expenseRows.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  )

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">المصروفات</h1>
          <Link href="/" className="text-sm text-blue-600">
            القائمة الرئيسية
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm text-gray-500">ملخص المصروفات</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-700">إجمالي المصروفات</p>
              <p className="mt-1 text-lg font-semibold text-amber-800">
                {formatAmount(totalExpenses)} OMR
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-600">عدد مرات الصرف</p>
              <p className="mt-1 text-lg font-semibold text-gray-800">{expensesCount}</p>
            </div>
          </div>
        </section>

        {expenseRows.length ? (
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-right text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">البند</th>
                    <th className="px-4 py-3">التاريخ</th>
                    <th className="px-4 py-3">المبلغ</th>
                    <th className="px-4 py-3">الملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.map((expense) => (
                    <tr key={expense.id} className="border-t border-gray-200 hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {expense.title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {expense.expense_date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-rose-700">
                        {formatAmount(Number(expense.amount || 0))} OMR
                      </td>
                      <td className="min-w-[140px] px-4 py-3 text-gray-600">
                        {expense.note?.trim() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border bg-white p-4 text-sm text-gray-500">
            لا توجد مصروفات
          </div>
        )}
      </div>
    </main>
  )
}