import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AddTodoInputProps {
  onAdd: (text: string) => void
}

export function AddTodoInput({ onAdd }: AddTodoInputProps) {
  const [text, setText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
    setExpanded(false)
  }

  const handleExpand = () => {
    setExpanded(true)
  }

  // Focus input when expanding
  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus()
    }
  }, [expanded])

  // Close on tap outside
  useEffect(() => {
    if (!expanded) return

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false)
        setText('')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [expanded])

  if (!expanded) {
    return (
      <button
        onClick={handleExpand}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm',
          'text-muted-foreground hover:bg-accent min-h-[44px]',
        )}
      >
        <Plus className="h-4 w-4" />
        Add an item
      </button>
    )
  }

  return (
    <div ref={containerRef} className="flex gap-2">
      <Input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') { setExpanded(false); setText('') }
        }}
        placeholder="Add an item..."
        className="flex-1"
        enterKeyHint="send"
      />
      <Button onClick={handleSubmit} size="icon" variant="outline">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
