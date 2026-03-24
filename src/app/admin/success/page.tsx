import Link from 'next/link'

type PageSearchParams = Record<string, string | string[] | undefined>

function pickString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined
}

function sanitizeRedirectPath(path: string | undefined) {
  if (!path) return '/admin'
  if (path === '/admin' || path === '/members' || path === '/expenses') {
    return path
  }
  return '/admin'
}

export default async function AdminSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}) {
  const sp =
    searchParams && typeof searchParams === 'object' && 'then' in searchParams
      ? await searchParams
      : (searchParams ?? {})

  const type = pickString(sp.type)
  const defaultMessage =
    type === 'member'
      ? 'تمت إضافة العضو بنجاح'
      : type === 'payment'
        ? 'تمت إضافة الدفعة بنجاح'
        : type === 'expense'
          ? 'تمت إضافة المصروف بنجاح'
          : 'تمت العملية بنجاح'

  const message = pickString(sp.message) || defaultMessage
  const redirectTo = sanitizeRedirectPath(pickString(sp.redirectTo))

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">تم بنجاح</h1>
          <p className="mt-3 text-sm text-gray-700">{message}</p>
          <Link
            href={redirectTo}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 p-3 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            موافق
          </Link>
        </section>
      </div>
    </main>
  )
}
