interface TabItem {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex items-center gap-1 overflow-x-auto border-b border-border-hairline">
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`relative px-space-md py-space-sm text-label-help font-medium whitespace-nowrap transition-colors ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
            }`}
          >
            {item.label}
            {typeof item.count === 'number' && <span className="ml-1">({item.count})</span>}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        )
      })}
    </div>
  )
}
