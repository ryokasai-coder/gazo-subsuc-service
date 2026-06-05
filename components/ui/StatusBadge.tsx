type Status = 'pending' | 'in_progress' | 'delivered' | 'cancelled' | 'paid' | 'unpaid' | 'overdue'

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending:     { label: '依頼中',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  in_progress: { label: '制作中',   className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  delivered:   { label: '納品済み', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  cancelled:   { label: 'キャンセル', className: 'bg-[#F1EFEF] text-[#767676]' },
  paid:        { label: '支払済',   className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  unpaid:      { label: '未払い',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  overdue:     { label: '滞納',     className: 'bg-[#FFE8EC] text-[#E60023] ring-1 ring-red-200' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? { label: status, className: 'bg-[#F1EFEF] text-[#767676]' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
