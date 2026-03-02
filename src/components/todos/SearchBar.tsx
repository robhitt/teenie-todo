import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value)
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 200)
    return () => clearTimeout(timer)
  }, [local, onChange])

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded])

  const handleClear = () => {
    setLocal('')
    onChange('')
    setIsExpanded(false)
  }

  const handleBlur = () => {
    if (!local) {
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => setIsExpanded(true)}
      >
        <Search className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder="Search items..."
        className="pl-9 pr-9 text-base"
      />
      {local && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
