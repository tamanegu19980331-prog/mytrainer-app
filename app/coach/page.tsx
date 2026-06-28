'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const QUICK_QUESTIONS = [
  '今日のトレーニングについてアドバイスください',
  '体重が減らないのですが...',
  '筋肉痛がひどいです',
  'モチベーションが上がらない',
  '食事について教えてください',
  '体力テストの結果を見てください',
]

export default function CoachPage() {
  const [messages, setMessages] = useState<{role:string,content:string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string|null>(null)
  const [userName, setUserName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)
      const { data } = await supabase.from('users').select('name').eq('id', user.id).single()
      setUserName(data?.name || '')
      // 最初の挨拶
      setMessages([{
        role: 'assistant',
        content: `こんにちは！AIパーソナルトレーナーです💪\n${data?.name || ''}さんのデータを確認しました。\nトレーニングや食事、体のことなど何でも相談してください！`,
      }])
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading || !userId) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId,
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.message }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'すみません、エラーが発生しました。もう一度試してください。' }])
    }
    setLoading(false)
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',flexDirection:'column'}}>
      <div style={{maxWidth:480,margin:'0 auto',width:'100%',display:'flex',flexDirection:'column',height:'100vh'}}>

        {/* ヘッダー */}
        <div style={{padding:'16px 20px',borderBottom:'1px solid #1e1e26',display:'flex',alignItems:'center',gap:12,background:'#16161a',flexShrink:0}}>
          <button onClick={()=>router.push('/dashboard')}
            style={{background:'none',border:'none',color:'#666',fontSize:24,cursor:'pointer',padding:0}}>←</button>
          <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#39ff14,#00c8ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
            🤖
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800}}>AIトレーナー</div>
            <div style={{fontSize:11,color:'#39ff14'}}>● オンライン</div>
          </div>
        </div>
        <a href="https://calendly.com/tamanegu-19980331/30min" target="_blank" rel="noopener noreferrer"
            style={{marginLeft:'auto',padding:'8px 14px',background:'linear-gradient(135deg,#ffd60a,#ff8c00)',color:'#000',border:'none',borderRadius:20,fontSize:11,fontWeight:800,cursor:'pointer',textDecoration:'none',flexShrink:0}}>
            📅 面談予約
          </a>
        {/* メッセージエリア */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 0'}}>
          {messages.map((m, i) => (
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:12}}>
              {m.role==='assistant'&&(
                <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#39ff14,#00c8ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,marginRight:8,marginTop:4}}>
                  🤖
                </div>
              )}
              <div style={{
                maxWidth:'75%',
                background:m.role==='user'?'linear-gradient(135deg,#39ff14,#00c8ff)':'#1e1e26',
                color:m.role==='user'?'#000':'#e8e8e8',
                borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                padding:'12px 16px',
                fontSize:14,
                lineHeight:1.6,
                border:m.role==='assistant'?'1px solid #2a2a36':'none',
                whiteSpace:'pre-wrap',
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading&&(
            <div style={{display:'flex',justifyContent:'flex-start',marginBottom:12}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#39ff14,#00c8ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:8}}>🤖</div>
              <div style={{background:'#1e1e26',borderRadius:'18px 18px 18px 4px',padding:'12px 16px',border:'1px solid #2a2a36'}}>
                <div style={{display:'flex',gap:4}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#39ff14',animation:`bounce 1s ${i*0.2}s infinite`}}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* クイック質問 */}
        {messages.length <= 1&&(
          <div style={{padding:'12px 16px 0',flexShrink:0}}>
            <div style={{fontSize:11,color:'#555',marginBottom:8}}>よくある相談</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {QUICK_QUESTIONS.map((q,i)=>(
                <button key={i} onClick={()=>sendMessage(q)}
                  style={{padding:'8px 12px',background:'#1e1e26',border:'1px solid #2a2a36',borderRadius:20,color:'#888',fontSize:12,cursor:'pointer'}}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 入力エリア */}
        <div style={{padding:'12px 16px 24px',borderTop:'1px solid #1e1e26',background:'#16161a',flexShrink:0}}>
          <div style={{display:'flex',gap:8}}>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
              placeholder="トレーナーに相談する..."
              style={{flex:1,background:'#1e1e26',border:'1px solid #2a2a36',borderRadius:24,padding:'12px 18px',color:'#e8e8e8',fontSize:14,outline:'none'}}
            />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading}
              style={{width:46,height:46,borderRadius:'50%',background:input.trim()&&!loading?'linear-gradient(135deg,#39ff14,#00c8ff)':'#2a2a36',border:'none',color:input.trim()&&!loading?'#000':'#444',fontSize:20,cursor:input.trim()&&!loading?'pointer':'not-allowed',flexShrink:0}}>
              ↑
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-4px)}
        }
      `}</style>
    </div>
  )
}