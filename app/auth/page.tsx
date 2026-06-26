'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [tab, setTab] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('ログインに失敗しました')
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (!profile) { router.push('/onboarding'); return }
        if (profile.is_admin) { router.push('/admin'); return }
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        router.push('/onboarding')
      }
    } catch (e: any) {
      setError(e.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center',alignItems:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'0 24px'}}>

        {/* ロゴ */}
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{
            width:80,height:80,borderRadius:24,
            background:'linear-gradient(135deg,#39ff14,#00c8ff)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:40,margin:'0 auto 16px',
            boxShadow:'0 8px 32px rgba(57,255,20,0.3)',
          }}>⚡</div>
          <div style={{fontSize:28,fontWeight:800,marginBottom:4}}>MY TRAINER</div>
          <div style={{fontSize:14,color:'#555'}}>AIパーソナルトレーナー</div>
        </div>

        {/* タブ */}
        <div style={{
          display:'grid',gridTemplateColumns:'1fr 1fr',
          background:'#1e1e26',borderRadius:14,padding:4,
          marginBottom:24,border:'1px solid #2a2a36',
        }}>
          {[{v:'login',l:'ログイン'},{v:'register',l:'新規登録'}].map(t=>(
            <button key={t.v} onClick={()=>{setTab(t.v as any);setError('')}}
              style={{
                padding:'12px',borderRadius:10,
                background:tab===t.v?'#39ff14':'transparent',
                color:tab===t.v?'#000':'#666',
                border:'none',fontSize:14,fontWeight:700,
                cursor:'pointer',transition:'all 0.2s',
              }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* フォーム */}
        <div style={{
          background:'#1e1e26',borderRadius:20,padding:'28px 24px',
          border:'1px solid #2a2a36',marginBottom:16,
        }}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:8}}>メールアドレス</div>
            <input type="email" value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{
                width:'100%',background:'#25252f',
                border:'1.5px solid '+(email?'#39ff14':'#2a2a36'),
                borderRadius:12,padding:'14px 16px',
                color:'#e8e8e8',fontSize:15,outline:'none',
                transition:'border 0.2s',
              }}/>
          </div>

          <div style={{marginBottom:24}}>
            <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:8}}>パスワード</div>
            <input type="password" value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="8文字以上"
              style={{
                width:'100%',background:'#25252f',
                border:'1.5px solid '+(password?'#39ff14':'#2a2a36'),
                borderRadius:12,padding:'14px 16px',
                color:'#e8e8e8',fontSize:15,outline:'none',
                transition:'border 0.2s',
              }}/>
          </div>

          {error&&(
            <div style={{
              background:'rgba(255,68,85,0.08)',
              border:'1px solid rgba(255,68,85,0.3)',
              borderRadius:10,padding:'12px 16px',
              fontSize:13,color:'#ff4455',marginBottom:16,
            }}>
              {error}
            </div>
          )}

          <button onClick={handleAuth}
            disabled={loading||!email||!password}
            style={{
              width:'100%',padding:'18px',
              background:email&&password?'linear-gradient(135deg,#39ff14,#00c8ff)':'#25252f',
              color:email&&password?'#000':'#444',
              border:'none',borderRadius:14,
              fontSize:16,fontWeight:800,
              cursor:email&&password?'pointer':'not-allowed',
              opacity:loading?0.7:1,
              transition:'all 0.2s',
              boxShadow:email&&password?'0 4px 20px rgba(57,255,20,0.2)':'none',
            }}>
            {loading?'処理中...':(tab==='login'?'ログイン':'アカウントを作成')}
          </button>
        </div>

      </div>
    </div>
  )
}