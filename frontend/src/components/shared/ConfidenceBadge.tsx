import { Cpu, BookOpen } from 'lucide-react'

interface ConfidenceBadgeProps {
  confidence: number
  source: string | null
}

export default function ConfidenceBadge({ confidence, source }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100)

  let colorClass: string
  if (confidence >= 0.8) {
    colorClass = 'bg-green-100 text-green-800'
  } else if (confidence >= 0.5) {
    colorClass = 'bg-yellow-100 text-yellow-800'
  } else {
    colorClass = 'bg-red-100 text-red-800'
  }

  const Icon = source === 'rule' ? BookOpen : Cpu

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      <Icon size={11} />
      {pct}%
    </span>
  )
}
