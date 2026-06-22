import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  users: {
    id: string
    created_at: string
    name: string
    gender: string
    height: number
    weight: number
    goal: string
  }
  profiles: {
    id: string
    user_id: string
    avatar: object
    exp: number
    level: number
    streak: number
    last_trained: string
  }
  training_records: {
    id: string
    user_id: string
    date: string
    theme: string
    level: string
    duration: number
    calories: number
    exp_gained: number
    completed: boolean
  }
  body_records: {
    id: string
    user_id: string
    date: string
    weight: number
    fat: number
    muscle: number
    bmi: number
  }
}