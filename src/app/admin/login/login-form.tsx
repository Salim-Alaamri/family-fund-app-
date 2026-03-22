'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage('تعذر تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.')
      setIsSubmitting(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="البريد الإلكتروني"
        className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="كلمة المرور"
        className="w-full rounded-xl border border-gray-200 p-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        required
      />
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-blue-600 p-3 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  )
}
