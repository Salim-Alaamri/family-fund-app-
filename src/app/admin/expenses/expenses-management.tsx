'use client'

import { useMemo, useState } from 'react'

type Expense = {
  id: number
  title: string
  amount: number
  expense_date: string
  note: string | null
}

type Props = {
  expenses: Expense[]
  initialMessage?: string
  initialError?: string
}

type ModalState = {
  expenseId: number
  title: string
  amount: string
  expenseDate: string
  note: string
}

function parseResponseUrl(url: string) {
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

function EditExpenseModal({
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
          <h3 className="text-lg font-semibold text-gray-900">تعديل المصروف</h3>
          <button onClick={onClose} type="button" className="rounded-lg px-2 py-1 text-sm text-gray-500">
            إغلاق
          </button>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          <input
            value={state.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
            required
          />
          <input
            value={state.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            type="number"
            step="0.01"
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
            required
          />
          <input
            value={state.expenseDate}
            onChange={(e) => onChange({ expenseDate: e.target.value })}
            type="date"
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
            required
          />
          <textarea
            value={state.note}
            onChange={(e) => onChange({ note: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
          />
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <button className="w-full rounded-xl bg-blue-600 p-3 text-base font-medium text-white">
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function ExpensesManagement({ expenses, initialMessage, initialError }: Props) {
  const [items, setItems] = useState(expenses)
  const [topMessage, setTopMessage] = useState(initialMessage || '')
  const [topError, setTopError] = useState(initialError || '')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [modalError, setModalError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const openModal = (id: number) => {
    const expense = byId.get(id)
    if (!expense) return
    setModalError('')
    setModal({
      expenseId: id,
      title: expense.title,
      amount: String(expense.amount),
      expenseDate: expense.expense_date,
      note: expense.note || '',
    })
  }

  const deleteExpense = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف المصروف؟')) return
    setBusyId(id)
    setTopError('')
    setTopMessage('')
    const body = new FormData()
    body.append('_action', 'delete')
    try {
      const response = await fetch(`/api/admin/expenses/${id}`, { method: 'POST', body, credentials: 'include' })
      const { message, error } = parseResponseUrl(response.url)
      if (error) {
        setTopError(error)
        return
      }
      setItems((prev) => prev.filter((e) => e.id !== id))
      if (message) setTopMessage(message)
    } catch {
      setTopError('حدث خطأ غير متوقع. حاول مرة أخرى.')
    } finally {
      setBusyId(null)
    }
  }

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!modal) return
    setIsSaving(true)
    setModalError('')
    const body = new FormData()
    body.append('_action', 'update')
    body.append('title', modal.title)
    body.append('amount', modal.amount)
    body.append('expense_date', modal.expenseDate)
    body.append('note', modal.note)
    try {
      const response = await fetch(`/api/admin/expenses/${modal.expenseId}`, {
        method: 'POST',
        body,
        credentials: 'include',
      })
      const { message, error } = parseResponseUrl(response.url)
      if (error) {
        setModalError(error)
        return
      }
      setItems((prev) =>
        prev.map((e) =>
          e.id === modal.expenseId
            ? {
                ...e,
                title: modal.title,
                amount: Number(modal.amount),
                expense_date: modal.expenseDate,
                note: modal.note || null,
              }
            : e
        )
      )
      if (message) setTopMessage(message)
      setModal(null)
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
        {items.map((expense) => (
          <div key={expense.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-base font-semibold text-gray-900">{expense.title}</p>
            <p className="mt-1 text-sm text-gray-600">
              {Number(expense.amount).toLocaleString('en-US')} OMR - {expense.expense_date}
            </p>
            <p className="mt-1 text-xs text-gray-500">{expense.note?.trim() || '-'}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openModal(expense.id)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-blue-600"
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={() => deleteExpense(expense.id)}
                disabled={busyId === expense.id}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 disabled:opacity-70"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal ? (
        <EditExpenseModal
          state={modal}
          isSaving={isSaving}
          errorMessage={modalError}
          onClose={() => setModal(null)}
          onChange={(next) => setModal((prev) => (prev ? { ...prev, ...next } : prev))}
          onSave={saveEdit}
        />
      ) : null}
    </>
  )
}
