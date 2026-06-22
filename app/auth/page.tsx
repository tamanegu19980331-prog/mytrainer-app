'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('確認メールを送信しました。メールをご確認ください。')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#16161a' }}>
      <div className="w-full max-w-sm p-6">

        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-2xl font-black"
            style={{ color: '#39ff14' }}>
            マイトレーナー
          </h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            AIパーソナルトレーナー
          </p>
        </div>

        {/* タブ */}
        <div className="flex mb-6 rounded-xl overflow-hidden"
          style={{ background: '#25252f' }}>
          <button
            onClick={() => setIsLogin(true)}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              background: isLogin ? '#39ff14' : 'transparent',
              color: isLogin ? '#000' : '#666',
            }}>
            ログイン
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              background: !isLogin ? '#39ff14' : 'transparent',
              color: !isLogin ? '#000' : '#666',
            }}>
            新規登録
          </button>
        </div>

        {/* フォーム */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold mb-1 block"
              style={{ color: '#666' }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: '#25252f',
                border: '1px solid #2a2a36',
                color: '#e8e8e8',
              }}
            />
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block"
              style={{ color: '#666' }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8文字以上"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: '#25252f',
                border: '1px solid #2a2a36',
                color: '#e8e8e8',
              }}
            />
          </div>
        </div>

        {/* エラー・メッセージ */}
        {error && (
          <div className="mt-3 p-3 rounded-xl text-xs"
            style={{
              background: error.includes('送信') 
                ? 'rgba(57,255,20,0.1)' 
                : 'rgba(255,68,85,0.1)',
              color: error.includes('送信') ? '#39ff14' : '#ff4455',
              border: `1px solid ${error.includes('送信') ? '#1a6600' : '#ff445544'}`,
            }}>
            {error}
          </div>
        )}

        {/* ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full mt-4 py-4 rounded-xl font-black text-sm transition-all"
          style={{
            background: '#39ff14',
            color: '#000',
            opacity: loading || !email || !password ? 0.3 : 1,
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '処理中...' : isLogin ? 'ログイン' : '新規登録'}
        </button>

      </div>
    </div>
  )
}