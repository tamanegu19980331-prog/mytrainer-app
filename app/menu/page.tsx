'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MenuPage() {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [menu, setMenu] = useState<any>(null)
  const [step, setStep] = useState(0)
  const router = useRouter()

  const steps = [
    '📅 週間スケジュールを生成中...',
    '💪 今日の部位を判定中...',
    '🤖 今日のメニューを生成中...',
    '✅ 完了！',
  ]

  useEffect(() => {
    generateMenu()
  }, [])

  useEffect(() => {
    if (status !== 'loading') return
    const iv = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1))
    }, 1200)
    return () => clearInterval(iv)
  }, [status])

  const generateMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const diag    = JSON.parse(localStorage.getItem('mt_diag')    || '{}')
      const goal    = localStorage.getItem('mt_goal')    || ''
      const posture = JSON.parse(localStorage.getItem('mt_posture') || '[]')
      const fitness = JSON.parse(localStorage.getItem('mt_fitness') || '{}')

      const { data: profile } = await supabase
        .from('users').select('*').eq('id', user.id).single()

      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, diag, goal, posture, fitness }),
      })

      const data = await res.json()
      console.log('API response:', data)
      setMenu(data)
      console.log('saving to DB, user:', user.id)
      // 診断回答をDBに保存
      await supabase.from('diagnosis_logs').insert({
        user_id: user.id,
        goal,
        posture,
        answers: diag,
        user_type: data.userType || '',
        type_reason: data.typeReason || '',
      })
      // メニュー履歴をDBに保存
      await supabase.from('training_logs').insert({
        user_id: user.id,
        menu_id: data.menuId || null,
        menu_name: data.theme,
        menu_data: data,
        user_type: data.userType || '',
        completed: false,
      })
      setStatus('done')
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  if (status === 'loading') return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 50, marginBottom: 16 }}>⚡</div>
        <div style={{ fontSize: 15, fontWeight: 800,
          color: '#39ff14', marginBottom: 20 }}>
          メニューを生成中...
        </div>
        {steps.map((s, i) => (
          <div key={i} style={{ width: '100%', padding: '9px 14px',
            background: i <= step ? '#1e1e26' : '#25252f',
            border: `1px solid ${i === step ? '#39ff14' : '#2a2a36'}`,
            borderRadius: 9, fontSize: 12,
            color: i < step ? '#39ff14' : i === step ? '#e8e8e8' : '#666',
            marginBottom: 6, display: 'flex',
            alignItems: 'center', gap: 8 }}>
            <span>{i < step ? '✓' : i === step ? '⚡' : '○'}</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  )

  if (status === 'error') return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: '#ff4455', fontWeight: 700, marginBottom: 16 }}>
          生成に失敗しました
        </div>
        <button onClick={generateMenu}
          style={{ padding: '14px 24px', background: '#39ff14',
            color: '#000', border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          再試行する
        </button>
      </div>
    </div>
  )

  if (!menu) return null

  const normalExercises = menu.exercises?.filter((ex: any) => !ex.isSeparator) || []
  const postureExercises = menu.postureExercises || []

  return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px' }}>

        {/* ヘッダー */}
        <div style={{ padding: '14px 0 12px',
          borderBottom: '1px solid #2a2a36', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 800,
            color: '#39ff14', letterSpacing: 3 }}>⚡ 今日のメニュー</span>
        </div>

        {/* メニューカード */}
        <div style={{ background: '#1e1e26', borderRadius: 16,
          padding: '20px 16px', border: '1px solid #2a2a36', marginBottom: 16 }}>

          <div style={{ fontSize: 10, letterSpacing: 2, color: '#39ff14',
            fontWeight: 700, marginBottom: 4 }}>⚡ お任せメニュー</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            {menu.theme}
          </div>
          <span style={{ display: 'inline-block',
            background: 'rgba(57,255,20,0.1)',
            border: '1px solid #1a6600', color: '#39ff14',
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            fontWeight: 700, marginBottom: 16 }}>
            {menu.level}
          </span>

          {/* このメニューの理由 */}
          {menu.whyThisMenu && (
            <div style={{ padding: '10px 12px',
              background: 'rgba(204,68,255,0.1)',
              border: '1px solid rgba(204,68,255,0.4)',
              borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#cc44ff',
                fontWeight: 700, marginBottom: 3 }}>
                🧠 このメニューを提案した理由
              </div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                {menu.whyThisMenu}
              </div>
            </div>
          )}

          {/* トレーニングメニュー */}
          <div style={{ fontSize: 10, color: '#39ff14', fontWeight: 700,
            letterSpacing: 1, marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 1, background: '#1a6600' }}/>
            💪 トレーニングメニュー
            <div style={{ flex: 1, height: 1, background: '#1a6600' }}/>
          </div>

          {normalExercises.map((ex: any, i: number) => (
            <div key={i} style={{ padding: '10px 0',
              borderBottom: '1px solid #2a2a36' }}>
              <div style={{ display: 'flex',
                justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {i + 1}. {ex.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    {ex.muscle} · 休憩{ex.restSec}秒
                  </div>
                  <div style={{ fontSize: 11, color: '#00c8ff', marginTop: 3 }}>
                    📌 {ex.why}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 76 }}>
                  <span style={{ display: 'inline-block',
                    background: 'rgba(57,255,20,0.1)',
                    border: '1px solid #1a6600', color: '#39ff14',
                    fontSize: 10, padding: '2px 8px',
                    borderRadius: 20, fontWeight: 700 }}>
                    {ex.sets}セット
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>
                    {ex.reps}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 姿勢改善メニュー */}
          {postureExercises.length > 0 && (
            <>
              <div style={{ padding: '14px 0 8px',
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 1,
                  background: 'linear-gradient(to right, #cc44ff66, transparent)' }}/>
                <div style={{ fontSize: 11, fontWeight: 800,
                  color: '#cc44ff', whiteSpace: 'nowrap' }}>
                  🧍 姿勢改善メニュー
                </div>
                <div style={{ flex: 1, height: 1,
                  background: 'linear-gradient(to left, #cc44ff66, transparent)' }}/>
              </div>
              {postureExercises.map((ex: any, i: number) => (
                <div key={i} style={{ padding: '10px 0',
                  borderBottom: '1px solid #2a2a36' }}>
                  <div style={{ display: 'flex',
                    justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13,
                        color: '#cc44ff' }}>
                        {i + 1}. {ex.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {ex.muscle} · 休憩{ex.restSec}秒
                      </div>
                      <div style={{ fontSize: 11, color: '#cc44ff', marginTop: 3 }}>
                        🧍 {ex.why}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 76 }}>
                      <span style={{ display: 'inline-block',
                        background: 'rgba(204,68,255,0.1)',
                        border: '1px solid #cc44ff44', color: '#cc44ff',
                        fontSize: 10, padding: '2px 8px',
                        borderRadius: 20, fontWeight: 700 }}>
                        {ex.sets}セット
                      </span>
                      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>
                        {ex.reps}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* closing tip */}
          {menu.closingTip && (
            <div style={{ background: 'rgba(57,255,20,0.1)',
              borderRadius: 9, padding: '10px 12px', marginTop: 12,
              border: '1px solid #1a6600' }}>
              <div style={{ fontSize: 10, color: '#39ff14',
                fontWeight: 700, marginBottom: 2 }}>
                💡 トレーニング後のアドバイス
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                {menu.closingTip}
              </div>
            </div>
          )}
        </div>

        {/* ボタン */}
        <button onClick={() => router.push('/dashboard')}
          style={{ width: '100%', padding: '14px',
            background: '#39ff14', color: '#000',
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            marginBottom: 8 }}>
          ダッシュボードへ →
        </button>

        <button onClick={generateMenu}
          style={{ width: '100%', padding: '13px',
            background: 'transparent', color: '#39ff14',
            border: '1px solid #39ff14', borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          🔄 メニューを再生成
        </button>

      </div>
    </div>
  )
}