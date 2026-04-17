export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return `NT$ ${amount.toLocaleString()}`
}
