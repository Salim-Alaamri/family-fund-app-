import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentMonthKey, getMonthOptionsAr } from '../../lib/month'
import { createClient } from '../../lib/supabase/server'
import { isAdminUser } from '../../lib/auth/admin'

type PageSearchParams = Record<string, string | string[] | undefined>

function isSearchParamsPromise(
  value: PageSearchParams | Promise<PageSearchParams> | undefined
): value is Promise<PageSearchParams> {
  return Boolean(value) && typeof value === 'object' && 'then' in value
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: PageSearchParams | Promise<PageSearchParams>
}) {
  const supabase = await createClient()
  const sp = isSearchParamsPromise(searchParams)
    ? await searchParams
    : (searchParams ?? {})

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  if (!(await isAdminUser(user.id))) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-6" dir="rtl">
        <div className="mx-auto max-w-md space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">غير مصرح</h1>
            <p className="mt-2 text-sm text-gray-600">
              هذا الحساب لا يملك صلاحية الوصول إلى لوحة الإدارة.
            </p>
            <form action="/api/auth/logout" method="post" className="mt-4">
              <button className="w-full rounded-xl bg-gray-900 p-3 text-white">
                تسجيل الخروج
              </button>
            </form>
          </section>
        </div>
      </main>
    )
  }

  const currentMonth = getCurrentMonthKey()
  const monthOptions = getMonthOptionsAr(currentMonth)

  const { data: members } = await supabase
    .from('members')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const successMessage = typeof sp?.success === 'string' ? sp?.success : undefined
  const errorMessage = typeof sp?.error === 'string' ? sp?.error : undefined

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-2xl bg-white px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            >
              رجوع
            </Link>
          </div>
          <form action="/api/auth/logout" method="post" className="mt-3">
            <button className="w-full rounded-xl border border-gray-200 p-2 text-sm text-gray-700 transition hover:bg-gray-50">
              تسجيل الخروج
            </button>
          </form>
        </div>

        {successMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            {errorMessage}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">إضافة عضو</h2>
          <form action="/api/admin/members" method="post" className="space-y-4">
            <input
              name="name"
              placeholder="اسم العضو"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              required
            />
            <input
              name="phone"
              placeholder="رقم الهاتف (اختياري)"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            />
            <textarea
              name="note"
              placeholder="ملاحظة"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              rows={3}
            />
            <button className="w-full rounded-xl bg-blue-600 p-3 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              إضافة عضو
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">إضافة دفعة</h2>
          <form
            action="/api/admin/payments"
            method="post"
            encType="multipart/form-data"
            className="space-y-4"
          >
            <select
              name="member_id"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              required
              defaultValue=""
            >
              <option value="" disabled>
                اختر العضو
              </option>
              {members?.map((member) => (
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
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              required
            />
            <select
              name="month_key"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              required
              defaultValue={currentMonth}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                رفع إيصال (اختياري)
              </label>
              <input
                name="invoice"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 file:ml-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
            <textarea
              name="note"
              placeholder="ملاحظة"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              rows={3}
            />
            <button className="w-full rounded-xl bg-blue-600 p-3 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              إضافة دفعة
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">إضافة مصروف</h2>
          <form action="/api/admin/expenses" method="post" className="space-y-4">
            <input
              name="title"
              placeholder="اسم المصروف"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              required
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="المبلغ"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              required
            />
            <input
              name="expense_date"
              type="date"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              required
            />
            <textarea
              name="note"
              placeholder="ملاحظة"
              className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              rows={3}
            />
            <button className="w-full rounded-xl bg-blue-600 p-3 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              إضافة مصروف
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}