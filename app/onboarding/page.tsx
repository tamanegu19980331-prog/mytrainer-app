'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [profile, setProfile] = useState({
    name: '', gender: '', height: '', weight: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const bmi = profile.height && profile.weight
    ? (Number(profile.weight) / ((Number(profile.height) / 100) ** 2)).toFixed(1)
    : null

  const bmiColor = !bmi ? '#666'
    : Number(bmi) < 18.5 ? '#00c8ff'
    : Number(bmi) < 25 ? '#39ff14'
    : Number(bmi) < 30 ? '#ffd60a' : '#ff4455'

  const bmiLabel = !bmi ? ''
    : Number(bmi) < 18.5 ? '低体重'
    : Number(bmi) < 25 ? '標準'
    : Number(bmi) < 30 ? '過体重' : '肥満'

  const saveProfile = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('users').upsert({
        id: user.id,
        name: profile.name,
        gender: profile.gender,
        height: Number(profile.height),
        weight: Number(profile.weight),
      })

      router.push('/posture')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px' }}>

        <div style={{ padding: '14px 0 12px', borderBottom: '1px solid #2a2a36',
          display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#39ff14',
            letterSpacing: 3 }}>⚡ MY TRAINER</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#666' }}>
            ① プロフィール
          </span>
        </div>

        <div style={{ background: '#1e1e26', borderRadius: 16,
          padding: '20px 16px', border: '1px solid #2a2a36' }}>

          <div style={{ fontSize: 10, letterSpacing: 2, color: '#39ff14',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Step 1 — プロフィール
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            基本情報を入力
          </div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            性別によって診断内容が変わります。
          </p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: '#666', fontWeight: 700,
              letterSpacing: 1, display: 'block', marginBottom: 4 }}>
              ニックネーム
            </label>
            <input
              style={{ width: '100%', background: '#25252f',
                border: '1px solid #2a2a36', borderRadius: 10,
                padding: '10px 12px', color: '#e8e8e8', fontSize: 14,
                outline: 'none' }}
              placeholder="例：たろう"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: '#666', fontWeight: 700,
              letterSpacing: 1, display: 'block', marginBottom: 4 }}>
              性別
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: '男性', l: '👨 男性' }, { v: '女性', l: '👩 女性' }].map(g => (
                <button key={g.v}
                  onClick={() => setProfile(p => ({ ...p, gender: g.v }))}
                  style={{ flex: 1, padding: '14px',
                    background: profile.gender === g.v
                      ? 'rgba(57,255,20,0.1)' : '#25252f',
                    border: `2px solid ${profile.gender === g.v ? '#39ff14' : '#2a2a36'}`,
                    borderRadius: 12,
                    color: profile.gender === g.v ? '#39ff14' : '#666',
                    fontSize: 15,
                    fontWeight: profile.gender === g.v ? 800 : 400,
                    cursor: 'pointer' }}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: '#666', fontWeight: 700,
                letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                身長 (cm)
              </label>
              <input type="number"
                style={{ width: '100%', background: '#25252f',
                  border: '1px solid #2a2a36', borderRadius: 10,
                  padding: '10px 12px', color: '#e8e8e8', fontSize: 14,
                  outline: 'none' }}
                placeholder="170"
                value={profile.height}
                onChange={e => setProfile(p => ({ ...p, height: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: '#666', fontWeight: 700,
                letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                体重 (kg)
              </label>
              <input type="number"
                style={{ width: '100%', background: '#25252f',
                  border: '1px solid #2a2a36', borderRadius: 10,
                  padding: '10px 12px', color: '#e8e8e8', fontSize: 14,
                  outline: 'none' }}
                placeholder="65"
                value={profile.weight}
                onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))}
              />
            </div>
          </div>

          {bmi && (
            <div style={{ background: '#25252f', border: '1px solid #2a2a36',
              borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#666' }}>BMI</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: bmiColor }}>
                  {bmi} <span style={{ fontSize: 11, fontWeight: 400,
                    color: '#666' }}>{bmiLabel}</span>
                </span>
              </div>
              <div style={{ background: '#2a2a36', borderRadius: 4,
                overflow: 'hidden', height: 4 }}>
                <div style={{ height: '100%',
                  width: `${Math.min((Number(bmi) / 40) * 100, 100)}%`,
                  background: bmiColor, transition: 'width 0.5s' }} />
              </div>
            </div>
          )}

          <button onClick={saveProfile}
            disabled={loading || !profile.name || !profile.gender
              || !profile.height || !profile.weight}
            style={{ width: '100%', padding: '14px',
              background: '#39ff14', color: '#000',
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              opacity: loading || !profile.name || !profile.gender
                || !profile.height || !profile.weight ? 0.3 : 1 }}>
            {loading ? '保存中...' : '次へ →'}
          </button>

        </div>
      </div>
    </div>
  )
}