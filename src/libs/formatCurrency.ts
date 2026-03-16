export const formatCash = (value: number | null): string => {
  if (value === null || value === undefined) return "--"

  // very small number e.g. 0.18937...
  if (value > 0 && value < 0.01) return "< $0.01"

  // large number e.g. 100000000
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`

  // normal range e.g. 20.50
  return `$${value.toFixed(2)}`
}

export const formatPortfolio = (value: number | null): string => {
  if (value === null || value === undefined || value === 0) return "$0.00"
  return formatCash(value)
}
