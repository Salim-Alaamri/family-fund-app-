'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatMonthKeyAr } from '../../../lib/month'

type Member = { id: number; name: string }
type Payment = {
  id: number
  member_id: number
  month_key: string
  amount: number
  invoice_path: string | null
  note: string | null
}

type Props = {
  members: Member[]
  payments: Payment[]
  initialMessage?: string
  initialError?: string
}

type ModalState = {
  paymentId: number
  memberId: string
  amount: string
  monthKey: string
  note: string
  invoice: File | null
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

function EditPaymentModal({
  state,
  members,
  isSaving,
  errorMessage,
  onClose,
  onChange,
  onSave,
}: {
  state: ModalState
  members: Member[]
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
          <h3 className="text-lg font-semibold text-gray-900">تعديل الدفعة</h3>
          <button onClick={onClose} type="button" className="rounded-lg px-2 py-1 text-sm text-gray-500">
            إغلاق
          </button>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          <select
            value={state.memberId}
            onChange={(e) => onChange({ memberId: e.target.value })}
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
            required
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <input
            value={state.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            type="number"
            step="0.01"
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
            required
          />
          <input
            value={state.monthKey}
            onChange={(e) => onChange({ monthKey: e.target.value })}
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
            required
          />
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => onChange({ invoice: e.target.files?.[0] || null })}
            className="w-full rounded-xl border border-gray-200 p-3 text-base"
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

export function PaymentsManagement({ members, payments, initialMessage, initialError }: Props) {
  const [items, setItems] = useState(payments)
  const [monthFilter, setMonthFilter] = useState('all')
  const [memberFilter, setMemberFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [topMessage, setTopMessage] = useState(initialMessage || '')
  const [topError, setTopError] = useState(initialError || '')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [modalError, setModalError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const memberNameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members])
  const paymentById = useMemo(() => new Map(items.map((p) => [p.id, p])), [items])
  const monthOptions = useMemo(
    () =>
      [...new Set(items.map((item) => item.month_key))]
        .sort((a, b) => b.localeCompare(a))
        .map((value) => ({ value, label: formatMonthKeyAr(value) })),
    [items]
  )

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return items.filter((item) => {
      if (monthFilter !== 'all' && item.month_key !== monthFilter) return false
      if (memberFilter !== 'all' && String(item.member_id) !== memberFilter) return false
      if (!normalizedSearch) return true

      const memberName = (memberNameById.get(item.member_id) || '').toLowerCase()
      const monthLabel = formatMonthKeyAr(item.month_key).toLowerCase()
      const note = (item.note || '').toLowerCase()
      const amount = String(item.amount)

      return (
        memberName.includes(normalizedSearch) ||
        monthLabel.includes(normalizedSearch) ||
        note.includes(normalizedSearch) ||
        amount.includes(normalizedSearch)
      )
    })
  }, [items, monthFilter, memberFilter, search, memberNameById])

  const filteredTotalAmount = useMemo(
    () => filteredItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [filteredItems]
  )

  const openModal = (id: number) => {
    const payment = paymentById.get(id)
    if (!payment) return
    setModalError('')
    setModal({
      paymentId: id,
      memberId: String(payment.member_id),
      amount: String(payment.amount),
      monthKey: payment.month_key,
      note: payment.note || '',
      invoice: null,
    })
  }

  const deletePayment = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف الدفعة؟')) return
    setBusyId(id)
    setTopError('')
    setTopMessage('')
    const body = new FormData()
    body.append('_action', 'delete')
    try {
      const response = await fetch(`/api/admin/payments/${id}`, { method: 'POST', body, credentials: 'include' })
      const { message, error } = parseResponseUrl(response.url)
      if (error) {
        setTopError(error)
        return
      }
      setItems((prev) => prev.filter((p) => p.id !== id))
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
    body.append('member_id', modal.memberId)
    body.append('amount', modal.amount)
    body.append('month_key', modal.monthKey)
    body.append('note', modal.note)
    if (modal.invoice) body.append('invoice', modal.invoice)

    try {
      const response = await fetch(`/api/admin/payments/${modal.paymentId}`, {
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
        prev.map((p) =>
          p.id === modal.paymentId
            ? {
                ...p,
                member_id: Number(modal.memberId),
                amount: Number(modal.amount),
                month_key: modal.monthKey,
                note: modal.note || null,
              }
            : p
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

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="rounded-xl border border-gray-200 p-2.5 text-sm text-gray-900"
          >
            <option value="all">كل الشهور</option>
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
            className="rounded-xl border border-gray-200 p-2.5 text-sm text-gray-900"
          >
            <option value="all">كل الأعضاء</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="بحث بالعضو/الشهر/المبلغ"
            className="rounded-xl border border-gray-200 p-2.5 text-sm text-gray-900 sm:col-span-1"
          />

        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">عدد الدفعات المعروضة</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{filteredItems.length}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">إجمالي المبلغ المعروض</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {filteredTotalAmount.toLocaleString('en-US')} OMR
            </p>
          </div>
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-right text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-3 py-2">العضو</th>
                <th className="px-3 py-2">الشهر</th>
                <th className="px-3 py-2">المبلغ</th>
                <th className="px-3 py-2">الإيصال</th>
                <th className="px-3 py-2">الملاحظة</th>
                <th className="px-3 py-2">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((payment) => (
                <tr key={payment.id} className="border-t border-gray-200 align-top">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                    {memberNameById.get(payment.member_id) || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                    {formatMonthKeyAr(payment.month_key)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                    {Number(payment.amount).toLocaleString('en-US')} OMR
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {payment.invoice_path ? (
                      <Link
                        href={`/api/payments/${payment.id}/invoice`}
                        target="_blank"
                        className="text-xs text-blue-600"
                      >
                        عرض الإيصال
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">لا يوجد إيصال</span>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-gray-700">{payment.note?.trim() || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openModal(payment.id)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-blue-600"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePayment(payment.id)}
                        disabled={busyId === payment.id}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 disabled:opacity-70"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="space-y-2 md:hidden">
        {filteredItems.map((payment) => (
          <div key={payment.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {memberNameById.get(payment.member_id) || '-'}
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {Number(payment.amount).toLocaleString('en-US')} OMR
              </p>
            </div>
            <p className="mt-1 text-xs text-gray-600">{formatMonthKeyAr(payment.month_key)}</p>
            {payment.note?.trim() ? (
              <p className="mt-1 text-xs text-gray-500 line-clamp-1">{payment.note.trim()}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openModal(payment.id)}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-blue-600"
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={() => deletePayment(payment.id)}
                disabled={busyId === payment.id}
                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 disabled:opacity-70"
              >
                حذف
              </button>
              {payment.invoice_path ? (
                <Link
                  href={`/api/payments/${payment.id}/invoice`}
                  target="_blank"
                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-blue-600"
                >
                  عرض الإيصال
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-400">
                  لا يوجد إيصال
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal ? (
        <EditPaymentModal
          state={modal}
          members={members}
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
