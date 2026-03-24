'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Member = {
  id: number
  name: string
  phone: string | null
  is_active: boolean
  note: string | null
}

type Props = {
  members: Member[]
  initialMessage?: string
  initialError?: string
}

type ModalState = {
  memberId: number
  name: string
  phone: string
  note: string
  isActive: 'true' | 'false'
}

function extractMessageFromResponseUrl(url: string) {
  try {
    const parsed = new URL(url)
    return {
      message: parsed.searchParams.get('message') || '',
      error: parsed.searchParams.get('error') || '',
    }
  } catch {
    return { message: '', error: '' }
  }
}

function EditMemberModal({
  state,
  isSaving,
  errorMessage,
  onClose,
  onChange,
  onSave,
}: {
  state: ModalState
  isSaving: boolean
  errorMessage: string
  onClose: () => void
  onChange: (next: Partial<ModalState>) => void
  onSave: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="w-full rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl" dir="rtl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">تعديل العضو</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            إغلاق
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <input
            value={state.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="اسم العضو"
            className="w-full rounded-xl border border-gray-200 p-3 text-base text-gray-900"
            required
          />
          <input
            value={state.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            placeholder="رقم الهاتف (اختياري)"
            className="w-full rounded-xl border border-gray-200 p-3 text-base text-gray-900"
          />
          <textarea
            value={state.note}
            onChange={(event) => onChange({ note: event.target.value })}
            rows={4}
            placeholder="ملاحظة"
            className="w-full rounded-xl border border-gray-200 p-3 text-base text-gray-900"
          />
          <select
            value={state.isActive}
            onChange={(event) => onChange({ isActive: event.target.value as 'true' | 'false' })}
            className="w-full rounded-xl border border-gray-200 p-3 text-base text-gray-900"
          >
            <option value="true">نشط</option>
            <option value="false">معطل</option>
          </select>

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-blue-600 p-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70"
          >
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function MembersManagement({ members, initialMessage, initialError }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(members)
  const [isBusy, setIsBusy] = useState<number | null>(null)
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [modalError, setModalError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [topMessage, setTopMessage] = useState(initialMessage || '')
  const [topError, setTopError] = useState(initialError || '')

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const openEditModal = (memberId: number) => {
    const member = byId.get(memberId)
    if (!member) return
    setModalError('')
    setModalState({
      memberId: member.id,
      name: member.name,
      phone: member.phone || '',
      note: member.note || '',
      isActive: member.is_active ? 'true' : 'false',
    })
  }

  const doAction = async (memberId: number, formData: FormData, actionUrl: string) => {
    setTopError('')
    setTopMessage('')
    setIsBusy(memberId)
    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const { message, error } = extractMessageFromResponseUrl(response.url)
      if (error) {
        setTopError(error)
        return false
      }
      if (message) {
        setTopMessage(message)
      }
      return true
    } catch {
      setTopError('حدث خطأ غير متوقع. حاول مرة أخرى.')
      return false
    } finally {
      setIsBusy(null)
    }
  }

  const onToggle = async (memberId: number) => {
    const ok = await doAction(memberId, new FormData(), `/api/admin/members/${memberId}/toggle`)
    if (!ok) return

    setItems((prev) =>
      prev.map((item) => (item.id === memberId ? { ...item, is_active: !item.is_active } : item))
    )
  }

  const onDelete = async (memberId: number) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف العضو؟')
    if (!confirmed) return

    const formData = new FormData()
    formData.append('_action', 'delete')
    const ok = await doAction(memberId, formData, `/api/admin/members/${memberId}`)
    if (!ok) return

    setItems((prev) => prev.filter((item) => item.id !== memberId))
  }

  const onSaveModal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!modalState) return

    setIsSaving(true)
    setModalError('')

    const formData = new FormData()
    formData.append('_action', 'update')
    formData.append('name', modalState.name)
    formData.append('phone', modalState.phone)
    formData.append('note', modalState.note)
    formData.append('is_active', modalState.isActive)

    try {
      const response = await fetch(`/api/admin/members/${modalState.memberId}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const { message, error } = extractMessageFromResponseUrl(response.url)
      if (error) {
        setModalError(error)
        return
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === modalState.memberId
            ? {
                ...item,
                name: modalState.name,
                phone: modalState.phone || null,
                note: modalState.note || null,
                is_active: modalState.isActive === 'true',
              }
            : item
        )
      )

      if (message) setTopMessage(message)
      setModalState(null)
      router.refresh()
    } catch {
      setModalError('تعذر حفظ التعديل. حاول مرة أخرى.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {topMessage ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {topMessage}
        </div>
      ) : null}
      {topError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {topError}
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((member) => (
          <div key={member.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-gray-900">{member.name}</p>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {member.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(member.id)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-blue-600"
              >
                تعديل
              </button>
              <button
                type="button"
                disabled={isBusy === member.id}
                onClick={() => onToggle(member.id)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 disabled:opacity-70"
              >
                {member.is_active ? 'تعطيل' : 'تفعيل'}
              </button>
              <button
                type="button"
                disabled={isBusy === member.id}
                onClick={() => onDelete(member.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 disabled:opacity-70"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalState ? (
        <EditMemberModal
          state={modalState}
          isSaving={isSaving}
          errorMessage={modalError}
          onClose={() => setModalState(null)}
          onChange={(next) => setModalState((prev) => (prev ? { ...prev, ...next } : prev))}
          onSave={onSaveModal}
        />
      ) : null}
    </>
  )
}
