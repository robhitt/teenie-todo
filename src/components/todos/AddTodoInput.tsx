import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AddTodoInputProps {
  onAdd: (text: string) => void
}

export function AddTodoInput({ onAdd }: AddTodoInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
  }

  return (
    <div className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Add an item..."
        className="flex-1"
      />
      <Button onClick={handleSubmit} size="icon" variant="outline">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
