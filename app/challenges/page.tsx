'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ChallengePage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [completions, setCompletions] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUserId(user.id)

    // 今週のチャレンジ取得
    const weekStart = getWeekStart()
    const { data: ch } = await supabase
      .from('challenges').select('*')
      .gte('week_start', weekStart)
      .order('created_at', { ascending: true })
    setChallenges(ch || [])

    // 達成済みチャレンジ
    const { data: comp } = await supabase
      .from('challenge_completions').select('challenge_id')
      .eq('user_id', user.id)
    setCompletions(new Set(comp?.map(c => c.challenge_id) || []))

    // 進捗計算
    await calcProgress(user.id, ch || [], weekStart)
    setLoading(false)
  }

  const getWeekStart = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    return monday.toISOString().slice(0, 10)
  }

  const getWeekEnd = () => {
    const start = new Date(getWeekStart())
    start.setDate(start.getDate() + 6)
    return start.toISOString().slice(0, 10)
  }

  const calcProgress = async (uid: string, chs: any[], weekStart: string) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString()

    const prog: Record<string, number> = {}

    for (const ch of chs) {
      if (ch.type === 'training_count') {
        const { data } = await supabase
          .from('training_logs').select('id')
          .eq('user_id', uid)
          .eq('completed', true)
          .gte('created_at', weekStart)
          .lt('created_at', weekEndStr)
        prog[ch.id] = data?.length || 0
      } else if (ch.type === 'weight_log') {
        const { data } = await supabase
          .from('weight_logs').select('id')
          .eq('user_id', uid)
          .gte('logged_date', weekStart)
          .lt('logged_date', weekEndStr.slice(0, 10))
        prog[ch.id] = data?.length || 0
      } else if (ch.type === 'food_log') {
        const { data } = await supabase
          .from('food_logs').select('id')
          .eq('user_id', uid)
          .gte('logged_date', weekStart)
          .lt('logged_date', weekEndStr.slice(0, 10))
        prog[ch.id] = data?.length || 0
      }
    }
    setProgress(prog)

    // 達成判定・自動完了
    for (const ch of chs) {
      if ((prog[ch.id] || 0) >= ch.target_count) {
        const { data: existing } = await supabase
          .from('challenge_completions').select('id')
          .eq('challenge_id', ch.id).eq('user_id', uid).single()
        if (!existing) {
          await supabase.from('challenge_completions').insert({
            challenge_id: ch.id, user_id: uid,
          })
          setCompletions(s => new Set([...s, ch.id]))
        }
      }
    }
  }

  const typeEmoji = (type: string) => ({
    training_count: '💪',
    weight_log: '⚖️',
    food_log: '🍱',
  }[type] || '🎯')

  const typeColor = (type: string) => ({
    training_count: '#39ff14',
    weight_log: '#ff6b9d',
    food_log: '#ff8c00',
  }[type] || '#00c8ff')

  const daysLeft = () => {
    const end = new Date(getWeekEnd())
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  if (loading) return (
    <div style={{ background: '#16161a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#39ff14' }}>読み込み中...</div>
    </div>
  )

  const completedCount = challenges.filter(ch => completions.has(ch.id)).length

  return (
    <div style={{ background: '#16161a', minHeight: '100vh', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>

        {/* ヘッダー */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e1e26' }}>
          <div style={{ fontSize: 11, color: '#ffd60a', fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>CHALLENGE</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>週間チャレンジ</div>
        </div>

        <div style={{ padding: '20px 24px 0' }}>

          {/* 今週の状況 */}
          <div style={{ background: '#1e1e26', borderRadius: 20, padding: 24, border: '1px solid #2a2a36', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>今週の達成状況</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#ffd60a' }}>
                  {completedCount} <span style={{ fontSize: 16, color: '#555', fontWeight: 400 }}>/ {challenges.length}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>残り</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: daysLeft() <= 2 ? '#ff4455' : '#00c8ff' }}>
                  {daysLeft()}<span style={{ fontSize: 12, color: '#555', fontWeight: 400 }}>日</span>
                </div>
              </div>
            </div>

            {/* 全体進捗バー */}
            <div style={{ background: '#25252f', borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg,#ffd60a,#ff8c00)',
                borderRadius: 8, transition: 'width 0.6s ease',
              }} />
            </div>

            {completedCount === challenges.length && challenges.length > 0 && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(255,215,10,0.1)', border: '1px solid rgba(255,215,10,0.3)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffd60a' }}>🎉 今週のチャレンジ全達成！</div>
              </div>
            )}
          </div>

          {/* チャレンジ一覧 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {challenges.map(ch => {
              const current = progress[ch.id] || 0
              const pct = Math.min(100, Math.round((current / ch.target_count) * 100))
              const achieved = completions.has(ch.id)
              const color = typeColor(ch.type)

              return (
                <div key={ch.id} style={{
                  background: achieved ? `rgba(${color === '#39ff14' ? '57,255,20' : color === '#ff6b9d' ? '255,107,157' : '255,140,0'},0.06)` : '#1e1e26',
                  borderRadius: 20, padding: 20,
                  border: `1px solid ${achieved ? color + '44' : '#2a2a36'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: achieved ? color + '22' : '#25252f',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24,
                      }}>
                        {achieved ? '✅' : typeEmoji(ch.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: achieved ? color : '#e8e8e8' }}>
                          {ch.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{ch.description}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: achieved ? color : '#e8e8e8' }}>
                        {current}
                      </div>
                      <div style={{ fontSize: 11, color: '#555' }}>/ {ch.target_count}</div>
                    </div>
                  </div>

                  {/* 進捗バー */}
                  <div style={{ background: '#25252f', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: achieved ? color : `linear-gradient(90deg,${color}88,${color})`,
                      borderRadius: 6, transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#444' }}>
                    <span>{pct}%達成</span>
                    {achieved
                      ? <span style={{ color, fontWeight: 700 }}>🏆 達成！</span>
                      : <span>あと{Math.max(0, ch.target_count - current)}回</span>
                    }
                  </div>
                </div>
              )
            })}
          </div>

          {challenges.length === 0 && (
            <div style={{ background: '#1e1e26', borderRadius: 20, padding: '40px 24px', border: '1px solid #2a2a36', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>今週のチャレンジはありません</div>
              <div style={{ fontSize: 13, color: '#555' }}>来週のチャレンジをお待ちください！</div>
            </div>
          )}

          {/* バッジ説明 */}
          <div style={{ background: '#1e1e26', borderRadius: 20, padding: 20, border: '1px solid #2a2a36', marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#ffd60a', fontWeight: 700, marginBottom: 12 }}>🏅 バッジについて</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { emoji: '🥉', label: '1つ達成', desc: 'チャレンジャーバッジ' },
                { emoji: '🥈', label: '2つ達成', desc: 'ストライカーバッジ' },
                { emoji: '🥇', label: '全部達成', desc: 'パーフェクトバッジ' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{item.desc}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>{item.label}</div>
                  </div>
                  {completedCount >= (item.label === '1つ達成' ? 1 : item.label === '2つ達成' ? 2 : challenges.length) && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#ffd60a', fontWeight: 700 }}>獲得済み！</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}