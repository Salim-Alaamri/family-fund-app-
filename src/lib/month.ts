const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export function getCurrentMonthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function formatMonthKeyAr(monthKey: string) {
  const [yearPart, monthPart] = monthKey.split('-')
  const year = Number(yearPart)
  const monthIndex = Number(monthPart) - 1

  if (!year || monthIndex < 0 || monthIndex > 11) {
    return monthKey
  }

  return `${ARABIC_MONTHS[monthIndex]} ${year}`
}

export function getMonthOptionsAr(centerMonthKey: string, range = 6) {
  const [yearPart, monthPart] = centerMonthKey.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)

  if (!year || month < 1 || month > 12) {
    return [{ value: centerMonthKey, label: centerMonthKey }]
  }

  const base = new Date(year, month - 1, 1)
  const options: Array<{ value: string; label: string }> = []

  for (let offset = -range; offset <= range; offset += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() + offset, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    options.push({ value, label: formatMonthKeyAr(value) })
  }

  return options
}
