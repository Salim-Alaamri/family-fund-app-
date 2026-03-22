import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'
import { createClient } from '../../../lib/supabase/server'
import { isAdminUser } from '../../../lib/auth/admin'

export default async function AdminLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    if (await isAdminUser(user.id)) {
      redirect('/admin')
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">دخول الإدارة</h1>
          <LoginForm />
        </section>
      </div>
    </main>
  )
}
