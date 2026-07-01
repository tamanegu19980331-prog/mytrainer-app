'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [trainingLogs, setTrainingLogs] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', height: '', weight: '', goal: '' })
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUser(user)
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    setProfile(data)
    setForm({ name: data?.name || '', height: data?.height || '', weight: data?.weight || '', goal: data?.goal || '' })
    const { data: logs } = await supabase.from('training_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setTrainingLogs(logs || [])
  }

  const saveProfile = async () => {
    setSaving(true)
    await supabase.from('users').update({ name: form.name, height: parseFloat(form.height), weight: parseFloat(form.weight), goal: form.goal }).eq('id', user.id)
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    setProfile(data)
    setEditing(false)
    setSaving(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/auth') }

  const now = new Date()
  const thisMonth = trainingLogs.filter(l => { const d = new Date(l.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && l.completed })
  const totalCompleted = trainingLogs.filter(l => l.completed).length
  const estimatedCalories = thisMonth.length * 250

  const inp = { width: '100%', background: '#25252f', border: '1px solid #2a2a36', borderRadius: 12, padding: '12px 14px', color: '#e8e8e8', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 10 }

  if (!profile) return <div style={{ background: '#16161a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#39ff14' }}>読み込み中...</div></div>

  return (
    <div style={{ background: '#16161a', minHeight: '100vh', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e1e26' }}>
          <div style={{ fontSize: 11, color: '#ff8c00', fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>PROFILE</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>マイページ</div>
        </div>
        <div style={{ padding: '20px 24px' }}>

          <div style={{ background: '#1e1e26', borderRadius: 20, padding: 24, border: '1px solid #2a2a36', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#ff8c00,#ff4455)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                {profile?.name?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{profile?.name || '未設定'}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{user?.email}</div>
              </div>
              <button onClick={() => setEditing(!editing)} style={{ padding: '8px 14px', background: '#25252f', border: '1px solid #2a2a36', borderRadius: 10, color: '#ff8c00', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {editing ? 'キャンセル' : '編集'}
              </button>
            </div>
            {!editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ label: '身長', value: profile?.height ? profile.height+'cm' : '未設定' }, { label: '体重', value: profile?.weight ? profile.weight+'kg' : '未設定' }, { label: '年齢', value: profile?.age ? profile.age+'歳' : '未設定' }, { label: '性別', value: profile?.gender || '未設定' }].map(item => (
                  <div key={item.label} style={{ background: '#25252f', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>名前</div>
                <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="名前" />
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>身長 (cm)</div>
                <input style={inp} type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="170" />
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>体重 (kg)</div>
                <input style={inp} type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="65" />
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>目標</div>
                <input style={inp} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="引き締め・筋肥大など" />
                <button onClick={saveProfile} disabled={saving} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#ff8c00,#ff4455)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                  {saving ? '保存中...' : '保存する'}
                </button>
              </div>
            )}
          </div>

          {profile?.goal && !editing && (
            <div style={{ background: '#1e1e26', borderRadius: 20, padding: 20, border: '1px solid #2a2a36', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>目標</div>
              <div style={{ fontSize: 14, color: '#ff8c00', fontWeight: 700 }}>{profile.goal}</div>
            </div>
          )}

          <div style={{ background: '#1e1e26', borderRadius: 20, padding: 24, border: '1px solid #2a2a36', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#39ff14', fontWeight: 700, marginBottom: 16 }}>📊 トレーニングサマリー</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[{ label: '今月の回数', value: thisMonth.length, unit: '回', color: '#39ff14' }, { label: '総完了数', value: totalCompleted, unit: '回', color: '#00c8ff' }, { label: '推計消費', value: estimatedCalories, unit: 'kcal', color: '#ff8c00' }].map(item => (
                <div key={item.label} style={{ background: '#25252f', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#444' }}>{item.unit}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#1e1e26', borderRadius: 20, padding: 24, border: '1px solid #2a2a36', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#ffd60a', fontWeight: 700, marginBottom: 16 }}>💎 料金プラン</div>
            <div style={{ background: '#25252f', borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>フリープラン</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>現在のプラン</div>
                </div>
                <span style={{ fontSize: 11, background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)', color: '#39ff14', borderRadius: 20, padding: '4px 12px', fontWeight: 700 }}>利用中</span>
              </div>
            </div>
            <button onClick={() => router.push('/pricing')} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#ffd60a,#ff8c00)', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              💎 プレミアムにアップグレード
            </button>
          </div>

          <div style={{ background: '#1e1e26', borderRadius: 20, padding: 24, border: '1px solid #2a2a36', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#cc44ff', fontWeight: 700, marginBottom: 16 }}>👨‍💼 パーソナル面談</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.7 }}>トレーナーと1対1で目標設定や食事・運動の相談ができます。</div>
            <button onClick={() => window.open('https://calendly.com/tamanegu-19980331/30min', '_blank')} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#cc44ff,#7c3aed)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              📅 面談を予約する
            </button>
          </div>

          <div style={{ background: '#1e1e26', borderRadius: 20, border: '1px solid #2a2a36', marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a22' }}>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>⚙️ アプリ設定</div>
            </div>
            {[{ label: '🔔 プッシュ通知', sub: '近日公開予定' }, { label: '🌐 表示言語', sub: '日本語' }].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1a1a22'}}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{item.sub}</div>
                </div>
                <span style={{ color: '#444', fontSize: 16 }}>→</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#1e1e26', borderRadius: 20, border: '1px solid #2a2a36', marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a22'}}>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>📄 規約・ポリシー</div>
            </div>
            {[{ label: '利用規約', path: '/terms' }, { label: 'プライバシーポリシー', path: '/privacy' }].map((item, i) => (
              <div key={i} onClick={() => router.push(item.path)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1a1a22', cursor: 'pointer'}}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                <span style={{ color: '#444', fontSize: 16 }}>→</span>
              </div>
            ))}
          </div>

          <button onClick={signOut} style={{ width: '100%', padding: '16px', background: 'transparent', border: '1px solid #ff4455', borderRadius: 14, color: '#ff4455', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
            ログアウト
          </button>

          <button onClick={async () => {
            if (!confirm('本当にアカウントを削除しますか？\nこの操作は取り消せません。全てのデータが削除されます。')) return
            if (!confirm('最終確認です。本当に削除しますか？')) return
            try {
              const { data: { session } } = await supabase.auth.getSession()
              const res = await fetch('/api/delete-account', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token || ''}`,
                },
              })
              const data = await res.json()
              if (data.success) {
                await supabase.auth.signOut()
                router.push('/')
              } else {
                alert('削除に失敗しました: ' + data.error)
              }
            } catch (e) {
              alert('エラーが発生しました')
            }
          }}
            style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #444', borderRadius: 14, color: '#444', fontSize: 12, cursor: 'pointer' }}>
            アカウントを削除する
          </button>

        </div>
      </div>
    </div>
  )
}
