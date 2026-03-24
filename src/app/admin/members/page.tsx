import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { isAdminUser } from '../../../lib/auth/admin'
import { MembersManagement } from './members-management'

type PageSearchParams = Record<string, string | string[] | undefined>

function readParam(sp: PageSearchParams, key: string) {
  const value = sp[key]
  return typeof value === 'string' ? value : undefined
}

export default async function AdminMembersPage({
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

  const { data: members } = await supabase
    .from('members')
    .select('id, name, phone, is_active, note')
    .order('id', { ascending: false })

  const message = readParam(sp, 'message')
  const error = readParam(sp, 'error')

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">إدارة الأعضاء</h1>
            <Link href="/admin" className="text-sm text-blue-600">
              رجوع للإدارة
            </Link>
          </div>
        </div>

        <details className="group rounded-2xl bg-white p-5 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-gray-900">
            <span>إضافة عضو</span>
            <span className="text-sm text-gray-500 transition group-open:rotate-180">⌄</span>
          </summary>
          <form action="/api/admin/members" method="post" className="mt-4 space-y-4">
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
            <button className="w-full rounded-xl bg-blue-600 p-3 font-medium text-white shadow-sm transition hover:bg-blue-700">
              إضافة عضو
            </button>
          </form>
        </details>

        <MembersManagement
          members={members ?? []}
          initialMessage={message}
          initialError={error}
        />
      </div>
    </main>
  )
}
