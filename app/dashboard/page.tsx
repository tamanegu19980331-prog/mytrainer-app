'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)
      const { data } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      if (!data) { router.push('/onboarding'); return }
      setProfile(data)
    }
    init()
  }, [])

  if (!user || !profile) return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#39ff14', fontSize: 24 }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', padding: '20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800,
              color: '#39ff14', letterSpacing: 3 }}>⚡ MY TRAINER</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              こんにちは、{profile.name}さん！
            </div>
          </div>
          <button onClick={async () => {
            await supabase.auth.signOut()
            router.push('/auth')
          }} style={{ padding: '8px 14px', background: 'transparent',
            border: '1px solid #2a2a36', borderRadius: 8,
            color: '#666', fontSize: 12, cursor: 'pointer' }}>
            ログアウト
          </button>
        </div>

        {/* プロフィールカード */}
        <div style={{ background: '#1e1e26', borderRadius: 16,
          padding: '20px', border: '1px solid #2a2a36', marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#39ff14',
            fontWeight: 700, marginBottom: 12 }}>📊 あなたのデータ</div>
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: '性別', value: profile.gender },
              { label: '身長', value: profile.height + 'cm' },
              { label: '体重', value: profile.weight + 'kg' },
            ].map(item => (
              <div key={item.label} style={{ background: '#25252f',
                borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#39ff14' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* メニュー生成カード */}
        <div style={{ background: '#1e1e26', borderRadius: 16,
          padding: '24px', border: '1px solid #2a2a36', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
            今日のメニューを生成しましょう！
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
            診断 → 姿勢チェック → AIメニュー生成
          </div>
          <button onClick={() => router.push('/goal')}
            style={{ width: '100%', padding: '14px',
              background: '#39ff14', color: '#000',
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
            診断をはじめる →
          </button>
        </div>

      </div>
    </div>
  )
}