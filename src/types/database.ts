export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface List {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface ListShare {
  id: string
  list_id: string
  shared_with_id: string
  created_at: string
}

export interface Todo {
  id: string
  list_id: string
  text: string
  is_completed: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface InviteLink {
  id: string
  list_id: string
  token: string
  created_by: string
  expires_at: string
  created_at: string
}
