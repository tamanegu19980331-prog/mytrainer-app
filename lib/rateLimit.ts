import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const LIMITS: Record<string, number> = {
  'generate-menu': 1,
  'generate-meal-plan': 3,
  'analyze-food': 5,
  'coach': 10,
}

export async function checkRateLimit(userId: string, endpoint: string, token: string): Promise<{ allowed: boolean; remaining: number }> {
  const limit = LIMITS[endpoint] || 5
  const today = new Date().toISOString().slice(0, 10)

  const supabaseWithAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: existing } = await supabaseWithAuth
    .from('api_rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .eq('date', today)
    .single()

  if (!existing) {
    await supabaseWithAuth.from('api_rate_limits').insert({
      user_id: userId,
      endpoint,
      count: 1,
      date: today,
    })
    return { allowed: true, remaining: limit - 1 }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  await supabaseWithAuth.from('api_rate_limits').update({
    count: existing.count + 1,
  }).eq('user_id', userId).eq('endpoint', endpoint).eq('date', today)

  return { allowed: true, remaining: limit - existing.count - 1 }
}