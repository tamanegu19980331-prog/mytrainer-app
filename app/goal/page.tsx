'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const GOALS_MALE = [
  { id: 'muscle_gain', label: '筋肥大・マッスル体型', desc: '体脂肪10〜15%', color: '#39ff14' },
  { id: 'athletic', label: 'アスレティック体型', desc: '体脂肪15〜18%', color: '#00c8ff' },
  { id: 'slim', label: 'スリム体型（男性）', desc: '体脂肪8〜14%', color: '#ffd60a' },
]

const GOALS_FEMALE = [
  { id: 'hip_up', label: 'ヒップアップ体型', desc: 'メリハリのある体', color: '#ff6b9d' },
  { id: 'fat_loss', label: '脂肪燃焼・引き締め', desc: 'しなやかな体型', color: '#ff6b35' },
  { id: 'slim_female', label: 'スリム体型（女性）', desc: 'すっきりしたライン', color: '#cc44ff' },
]

export default function GoalPage() {
  const [selected, setSelected] = useState<string>('')
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [gender, setGender] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('gender').eq('id', user.id).single()
        setGender(profile?.gender || '')
      }
    }
    init()

    const updateSize = () => {
      if (imgRef.current) {
        setImgSize({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const isMale = gender === '男性'
  const isFemale = gender === '女性'
  const allGoals = [...GOALS_MALE, ...GOALS_FEMALE]

  const tapAreas = [
    { id: 'muscle_gain', row: 0, col: 0, forGender: 'male' },
    { id: 'athletic', row: 0, col: 1, forGender: 'male' },
    { id: 'slim', row: 0, col: 2, forGender: 'male' },
    { id: 'hip_up', row: 1, col: 0, forGender: 'female' },
    { id: 'fat_loss', row: 1, col: 1, forGender: 'female' },
    { id: 'slim_female', row: 1, col: 2, forGender: 'female' },
  ]

  const isDisabled = (forGender: string) => {
    if (!gender) return false
    if (isMale && forGender === 'female') return true
    if (isFemale && forGender === 'male') return true
    return false
  }

  const next = () => {
    if (!selected) return
    const goal = allGoals.find(g => g.id === selected)
    localStorage.setItem('mt_goal', goal?.label || selected)
    router.push('/fitness-test')
  }

  const selectedGoal = allGoals.find(g => g.id === selected)

  return (
    <div style={{ background: '#16161a', minHeight: '100vh', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 60px' }}>

        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#39ff14', letterSpacing: 2 }}>MY TRAINER</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ width: i === 4 ? 24 : 8, height: 4, borderRadius: 4, background: i <= 4 ? '#39ff14' : '#2a2a36' }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontSize: 11, color: '#39ff14', fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>STEP 4 / 5</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>
            理想の体型を<br/>タップして選んでください
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
            画像をタップして選択してください
          </div>

          {/* 性別バッジ */}
          {gender && (
            <div style={{ marginBottom: 16 }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                background: isMale ? 'rgba(0,200,255,0.1)' : 'rgba(255,107,157,0.1)',
                border: `1px solid ${isMale ? '#00c8ff' : '#ff6b9d'}`,
                color: isMale ? '#00c8ff' : '#ff6b9d',
                borderRadius: 20, padding: '4px 12px',
              }}>
                {isMale ? '👨 男性向けの体型を選んでください' : '👩 女性向けの体型を選んでください'}
              </span>
            </div>
          )}

          {/* 画像 + タップエリア */}
          <div style={{
            position: 'relative', borderRadius: 20, overflow: 'hidden',
            border: '1px solid #2a2a36', marginBottom: 16, background: '#16161a',
          }}>
            <img
              ref={imgRef}
              src="/goal.jpg"
              alt="goal"
              onLoad={() => {
                if (imgRef.current) {
                  setImgSize({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight })
                }
              }}
              style={{ width: '100%', display: 'block', objectFit: 'contain' }}
            />

            {imgSize.height > 0 && tapAreas.map(area => {
              const sel = selected === area.id
              const goal = allGoals.find(g => g.id === area.id)
              const disabled = isDisabled(area.forGender)
              const w = imgSize.width / 3
              const h = imgSize.height / 2
              return (
                <div
                  key={area.id}
                  onClick={() => { if (!disabled) setSelected(area.id) }}
                  style={{
                    position: 'absolute',
                    top: area.row * h,
                    left: area.col * w,
                    width: w,
                    height: h,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: sel ? `3px solid ${goal?.color || '#39ff14'}` : '3px solid transparent',
                    boxSizing: 'border-box',
                    background: disabled
                      ? 'rgba(0,0,0,0.55)'
                      : sel ? `rgba(57,255,20,0.12)` : 'transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {disabled && (
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#666',
                      background: 'rgba(0,0,0,0.6)', padding: '4px 10px',
                      borderRadius: 10,
                    }}>
                      選択不可
                    </div>
                  )}
                  {sel && !disabled && (
                    <div style={{
                      position: 'absolute', bottom: 8, left: '50%',
                      transform: 'translateX(-50%)',
                      background: goal?.color, color: '#000',
                      fontSize: 10, fontWeight: 800,
                      padding: '4px 10px', borderRadius: 20,
                      whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                      ✓ 選択中
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 選択中の表示 */}
          {selectedGoal ? (
            <div style={{
              background: `rgba(57,255,20,0.06)`,
              border: `1.5px solid ${selectedGoal.color}55`,
              borderRadius: 16, padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: selectedGoal.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#000', fontWeight: 800, flexShrink: 0,
              }}>✓</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: selectedGoal.color, marginBottom: 2 }}>{selectedGoal.label}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{selectedGoal.desc}</div>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#1e1e26', border: '1px solid #2a2a36',
              borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: '#444' }}>画像をタップして体型を選んでください</div>
            </div>
          )}

          <button onClick={next} disabled={!selected}
            style={{
              width: '100%', padding: '20px',
              background: selected ? 'linear-gradient(135deg,#39ff14,#00c8ff)' : '#1e1e26',
              color: selected ? '#000' : '#444',
              border: 'none', borderRadius: 18,
              fontSize: 17, fontWeight: 800,
              cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s',
              boxShadow: selected ? '0 8px 32px rgba(57,255,20,0.2)' : 'none',
            }}>
            次へ → 体力テスト
          </button>
        </div>
      </div>
    </div>
  )
}