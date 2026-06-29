'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // リセットリンクからのアクセスを検知
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (password !== confirm) { setError('パスワードが一致しません'); return }
    if (password.length < 8) { setError('パスワードは8文字以上にしてください'); return }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center',alignItems:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'0 24px'}}>

        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:48,marginBottom:12}}>🔐</div>
          <div style={{fontSize:24,fontWeight:800,marginBottom:4}}>パスワードリセット</div>
          <div style={{fontSize:13,color:'#555'}}>新しいパスワードを設定してください</div>
        </div>

        {done ? (
          <div style={{background:'#1e1e26',borderRadius:20,padding:'28px 24px',border:'1px solid #2a2a36',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontSize:18,fontWeight:800,marginBottom:8}}>パスワードを変更しました</div>
            <div style={{fontSize:13,color:'#555',marginBottom:24}}>新しいパスワードでログインしてください</div>
            <button onClick={()=>router.push('/auth')}
              style={{width:'100%',padding:'16px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:14,fontSize:15,fontWeight:800,cursor:'pointer'}}>
              ログインへ →
            </button>
          </div>
        ) : (
          <div style={{background:'#1e1e26',borderRadius:20,padding:'28px 24px',border:'1px solid #2a2a36'}}>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:8}}>新しいパスワード</div>
              <input type="password" value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="8文字以上"
                style={{
                  width:'100%',background:'#25252f',
                  border:'1.5px solid '+(password?'#39ff14':'#2a2a36'),
                  borderRadius:12,padding:'14px 16px',
                  color:'#e8e8e8',fontSize:15,outline:'none',
                }}/>
            </div>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:8}}>パスワード確認</div>
              <input type="password" value={confirm}
                onChange={e=>setConfirm(e.target.value)}
                placeholder="もう一度入力"
                style={{
                  width:'100%',background:'#25252f',
                  border:'1.5px solid '+(confirm?(confirm===password?'#39ff14':'#ff4455'):'#2a2a36'),
                  borderRadius:12,padding:'14px 16px',
                  color:'#e8e8e8',fontSize:15,outline:'none',
                }}/>
              {confirm && confirm !== password && (
                <div style={{fontSize:11,color:'#ff4455',marginTop:6}}>パスワードが一致しません</div>
              )}
            </div>

            {error&&(
              <div style={{background:'rgba(255,68,85,0.08)',border:'1px solid rgba(255,68,85,0.3)',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#ff4455',marginBottom:16}}>
                {error}
              </div>
            )}

            <button onClick={handleReset}
              disabled={loading||!password||!confirm||password!==confirm}
              style={{
                width:'100%',padding:'18px',
                background:password&&confirm&&password===confirm?'linear-gradient(135deg,#39ff14,#00c8ff)':'#25252f',
                color:password&&confirm&&password===confirm?'#000':'#444',
                border:'none',borderRadius:14,fontSize:16,fontWeight:800,
                cursor:password&&confirm&&password===confirm?'pointer':'not-allowed',
                opacity:loading?0.7:1,
              }}>
              {loading?'変更中...':'パスワードを変更する'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}