import { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types/database'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string, isCompleted: boolean) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}

const SWIPE_MAX = 80
const SWIPE_THRESHOLD = 50

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const inputRef = useRef<HTMLInputElement>(null)

  // revealWidth: 0 (closed) to SWIPE_MAX (fully open)
  const [revealWidth, setRevealWidth] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiping = useRef(false)
  const locked = useRef<'horizontal' | 'vertical' | null>(null)
  const startReveal = useRef(0)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleToggle = () => {
    if (isEditing || swiping.current) return
    onToggle(todo.id, !todo.is_completed)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditText(todo.text)
    setIsEditing(true)
  }

  const handleEditSave = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      setEditText(todo.text)
      setIsEditing(false)
    }
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    startReveal.current = revealWidth
    locked.current = null
    swiping.current = false
  }, [revealWidth])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    if (!locked.current) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        locked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
      }
    }

    if (locked.current === 'horizontal') {
      e.preventDefault()
      swiping.current = true
      // Swipe left (negative deltaX) increases reveal; swipe right decreases
      const newWidth = Math.max(0, Math.min(SWIPE_MAX, startReveal.current - deltaX))
      setRevealWidth(newWidth)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    touchStart.current = null
    if (!swiping.current) return
    // Small delay to prevent toggle firing on swipe end
    setTimeout(() => { swiping.current = false }, 50)
    setRevealWidth((prev) => (prev >= SWIPE_THRESHOLD ? SWIPE_MAX : 0))
  }, [])

  const isAnimating = revealWidth === 0 || revealWidth === SWIPE_MAX

  return (
    <div
      className="flex"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Content area — stays in place, shrinks from right when swiping */}
      <div
        className={cn(
          'group flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150 hover:bg-accent active:bg-accent/80',
        )}
        onClick={handleToggle}
        role="button"
      >
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
            'active:scale-90',
            todo.is_completed
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/40 bg-transparent'
          )}
          onClick={(e) => { e.stopPropagation(); handleToggle() }}
        >
          {todo.is_completed && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
        </div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent text-sm outline-none border-b border-primary"
          />
        ) : (
          <span
            className={cn(
              'flex-1 truncate text-sm transition-all duration-200',
              todo.is_completed && 'text-muted-foreground line-through'
            )}
            onDoubleClick={handleDoubleClick}
          >
            {todo.text}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id) }}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      {/* Delete zone — grows from 0 to 80px width on swipe */}
      {revealWidth > 0 && (
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-r-md bg-destructive"
          style={{
            width: revealWidth,
            transition: isAnimating ? 'width 200ms ease-out' : 'none',
          }}
          onClick={(e) => {
            e.stopPropagation()
            setRevealWidth(0)
            onDelete(todo.id)
          }}
        >
          <Trash2 className="h-5 w-5 shrink-0 text-white" />
        </div>
      )}
    </div>
  )
}
