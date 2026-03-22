import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

export default async function ExpensesPage() {
  const supabase = await createClient()

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('id, title, amount, expense_date, note')
    .order('expense_date', { ascending: false })

  if (error) {
    return <div>خطأ: {error.message}</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">المصروفات</h1>
          <Link href="/" className="text-sm text-blue-600">
            رجوع
          </Link>
        </div>

        {expenses?.length ? (
          expenses.map((expense) => (
            <div key={expense.id} className="rounded-2xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{expense.title}</div>
                  <div className="text-sm text-gray-500">
                    {expense.expense_date}
                  </div>
                </div>

                <div className="font-semibold">
                  OMR {Number(expense.amount).toFixed(2)}
                </div>
              </div>

              {expense.note ? (
                <div className="mt-2 text-sm text-gray-600">{expense.note}</div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border bg-white p-4 text-sm text-gray-500">
            لا توجد مصروفات
          </div>
        )}
      </div>
    </main>
  )
}