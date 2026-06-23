'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインに失敗しました')
      const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) {
        await supabase.auth.signOut()
        throw new Error('管理者アカウントではありません')
      }
      router.push('/admin')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:360,padding:'0 20px'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:40,marginBottom:8}}>⚙️</div>
          <div style={{fontSize:18,fontWeight:800,color:'#ff4455',letterSpacing:2}}>ADMIN LOGIN</div>
          <div style={{fontSize:12,color:'#666',marginTop:4}}>マイトレーナー管理者専用</div>
        </div>
        <div style={{background:'#1e1e26',borderRadius:16,padding:'24px',border:'1px solid #2a2a36'}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:'#666',marginBottom:4}}>メールアドレス</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="admin@mytrainer.com"
              style={{width:'100%',background:'#25252f',border:'1px solid #2a2a36',borderRadius:10,padding:'10px 12px',color:'#e8e8e8',fontSize:14,outline:'none'}}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,color:'#666',marginBottom:4}}>パスワード</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              style={{width:'100%',background:'#25252f',border:'1px solid #2a2a36',borderRadius:10,padding:'10px 12px',color:'#e8e8e8',fontSize:14,outline:'none'}}/>
          </div>
          {error&&<div style={{padding:'8px 12px',background:'rgba(255,68,85,0.1)',border:'1px solid #ff445544',borderRadius:8,fontSize:12,color:'#ff4455',marginBottom:12}}>{error}</div>}
          <button onClick={handleLogin} disabled={loading||!email||!password}
            style={{width:'100%',padding:'13px',background:'#ff4455',color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer',opacity:loading||!email||!password?0.3:1}}>
            {loading?'認証中...':'管理者としてログイン'}
          </button>
        </div>
        <div style={{textAlign:'center',marginTop:16}}>
          <a href="/auth" style={{fontSize:11,color:'#444',textDecoration:'none'}}>一般ユーザーの方はこちら</a>
        </div>
      </div>
    </div>
  )
}