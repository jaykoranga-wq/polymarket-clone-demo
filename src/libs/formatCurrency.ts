const clean = (n: number) => parseFloat(n.toFixed(2)).toString()

export const formatCash = (value: number | null): string => {
  if (value === null || value === undefined) return "--"
  if (value > 0 && value < 0.01) return "< $0.01"
  if (value >= 1_000_000) return `$${clean(value / 1_000_000)}M`
  if (value >= 1_000) return `$${clean(value / 1_000)}K`
  return `$${clean(value)}`
}

export const formatPortfolio = (value: number | null): string => {
  if (value === null || value === undefined || value === 0) return "$0.00"
  return formatCash(value)
}
