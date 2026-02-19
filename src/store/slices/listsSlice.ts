import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabase'
import type { List } from '@/types/database'

interface ListsState {
  items: List[]
  loading: boolean
  error: string | null
}

const initialState: ListsState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchLists = createAsyncThunk('lists/fetchLists', async () => {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as List[]
})

export const createList = createAsyncThunk('lists/createList', async (name: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('lists')
    .insert({ name, owner_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data as List
})

export const renameList = createAsyncThunk(
  'lists/renameList',
  async ({ id, name }: { id: string; name: string }) => {
    const { data, error } = await supabase
      .from('lists')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as List
  }
)

export const deleteList = createAsyncThunk('lists/deleteList', async (id: string) => {
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
  return id
})

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLists.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLists.fulfilled, (state, action) => {
        state.items = action.payload
        state.loading = false
      })
      .addCase(fetchLists.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to fetch lists'
      })
      .addCase(createList.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(renameList.fulfilled, (state, action) => {
        const index = state.items.findIndex((l) => l.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        state.items = state.items.filter((l) => l.id !== action.payload)
      })
  },
})

export default listsSlice.reducer
