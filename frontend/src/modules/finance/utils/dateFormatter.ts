import dayjs from 'dayjs'

export function formatDate(date: string | Date, format = 'DD MMM YYYY'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD MMM YYYY, hh:mm A')
}

export function daysFromNow(date: string | Date): number {
  return dayjs(date).diff(dayjs(), 'day')
}

export function daysAgo(date: string | Date): number {
  return dayjs().diff(dayjs(date), 'day')
}

export function isOverdue(dueDate: string | Date): boolean {
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

export function currentFinancialYear(): string {
  const now = dayjs()
  const year = now.month() >= 3 ? now.year() : now.year() - 1
  return `${year}-${String(year + 1).slice(2)}`
}
