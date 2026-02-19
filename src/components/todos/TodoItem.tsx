import { useState, useRef, useEffect } from 'react'
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

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [justToggled, setJustToggled] = useState(false)
  const [collapsing, setCollapsing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleToggle = () => {
    if (justToggled || collapsing || isEditing) return
    setJustToggled(true)
    setTimeout(() => {
      setCollapsing(true)
      setTimeout(() => {
        onToggle(todo.id, !todo.is_completed)
        setJustToggled(false)
        setCollapsing(false)
      }, 150)
    }, 200)
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

  return (
    <div
      className={cn(
        'transition-all duration-150 overflow-hidden',
        collapsing && 'max-h-0 opacity-0 py-0',
        !collapsing && 'max-h-20 opacity-100',
      )}
    >
      <div
        className={cn(
          'group flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 hover:bg-accent',
          justToggled && !todo.is_completed && 'bg-green-50',
          justToggled && todo.is_completed && 'bg-blue-50',
        )}
        onClick={handleToggle}
        role="button"
      >
        <input
          type="checkbox"
          checked={todo.is_completed || (justToggled && !todo.is_completed)}
          readOnly
          className="h-5 w-5 shrink-0 rounded border-input accent-primary"
          onClick={(e) => e.stopPropagation()}
          onChange={handleToggle}
        />
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
              'flex-1 text-sm transition-all duration-200',
              (todo.is_completed || (justToggled && !todo.is_completed)) && 'text-muted-foreground line-through'
            )}
            onDoubleClick={handleDoubleClick}
          >
            {todo.text}
          </span>
        )}
        {justToggled && !todo.is_completed && (
          <Check className="h-4 w-4 text-green-600" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id) }}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
