import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { isAdminUser } from '../../lib/auth/admin'

export default async function AdminPage() {
  const supabase = await createClient()

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
              القائمة الرئيسية
            </Link>
          </div>
          <form action="/api/auth/logout" method="post" className="mt-3">
            <button className="w-full rounded-xl border border-gray-200 p-2 text-sm text-gray-700 transition hover:bg-gray-50">
              تسجيل الخروج
            </button>
          </form>
        </div>

        <Link
          href="/admin/members"
          className="block rounded-2xl bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <p className="text-lg font-semibold text-gray-900">إدارة الأعضاء</p>
          <p className="mt-1 text-sm text-gray-600">إضافة، تعديل، تفعيل/تعطيل، وحذف الأعضاء</p>
        </Link>

        <Link
          href="/admin/payments"
          className="block rounded-2xl bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <p className="text-lg font-semibold text-gray-900">إدارة الدفعات</p>
          <p className="mt-1 text-sm text-gray-600">إضافة، تعديل، حذف، وعرض الإيصالات</p>
        </Link>

        <Link
          href="/admin/expenses"
          className="block rounded-2xl bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <p className="text-lg font-semibold text-gray-900">إدارة المصروفات</p>
          <p className="mt-1 text-sm text-gray-600">إضافة، تعديل، وحذف المصروفات</p>
        </Link>
      </div>
    </main>
  )
}