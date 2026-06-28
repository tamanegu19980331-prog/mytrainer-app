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
    const [tab, setTab] = useState<'ai'|'trainer'>('ai')
    useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'trainer') setTab('trainer')
    }, [])
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
            {tab==='ai'?'🤖':'👨‍💼'}
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800}}>{tab==='ai'?'AIトレーナー':'パーソナルトレーナー'}</div>
            <div style={{fontSize:11,color:tab==='ai'?'#39ff14':'#ffd60a'}}>● {tab==='ai'?'オンライン':'予約受付中'}</div>
          </div>
        </div>

        {/* タブ */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0,borderBottom:'1px solid #1e1e26',flexShrink:0}}>
          <button onClick={()=>setTab('ai')}
            style={{padding:'14px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='ai'?'#39ff14':'transparent'}`,color:tab==='ai'?'#39ff14':'#555',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            🤖 AIチャット
          </button>
          <button onClick={()=>setTab('trainer')}
            style={{padding:'14px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='trainer'?'#ffd60a':'transparent'}`,color:tab==='trainer'?'#ffd60a':'#555',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            📅 トレーナーに相談
          </button>
        </div>

        {/* AIチャットタブ */}
        {tab==='ai'&&(
          <>
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
                    padding:'12px 16px',fontSize:14,lineHeight:1.6,
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

            {messages.length<=1&&(
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

            <div style={{padding:'12px 16px 24px',borderTop:'1px solid #1e1e26',background:'#16161a',flexShrink:0}}>
              <div style={{display:'flex',gap:8}}>
                <input value={input} onChange={e=>setInput(e.target.value)}
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
          </>
        )}

        {/* トレーナー相談タブ */}
        {tab==='trainer'&&(
          <div style={{flex:1,overflowY:'auto',padding:'24px 20px'}}>
            <div style={{textAlign:'center',marginBottom:32}}>
              <div style={{fontSize:56,marginBottom:16}}>👨‍💼</div>
              <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>プロトレーナーに相談</div>
              <div style={{fontSize:13,color:'#666',lineHeight:1.7}}>
                AIでは解決できない悩みを<br/>プロのトレーナーが直接サポートします
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:32}}>
              {[
                {emoji:'🎯',title:'フォームチェック',desc:'正しいフォームをビデオで確認してもらえます'},
                {emoji:'🍽️',title:'食事プランの相談',desc:'あなたの目標に合った食事計画を一緒に考えます'},
                {emoji:'💊',title:'サプリ・栄養相談',desc:'必要なサプリメントや栄養素をアドバイス'},
                {emoji:'🏃',title:'トレーニング計画',desc:'長期的な目標達成のためのプランを作成'},
              ].map((item,i)=>(
                <div key={i} style={{background:'#1e1e26',borderRadius:16,padding:'16px 18px',border:'1px solid #2a2a36',display:'flex',gap:14,alignItems:'flex-start'}}>
                  <div style={{fontSize:28,flexShrink:0}}>{item.emoji}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{item.title}</div>
                    <div style={{fontSize:12,color:'#555',lineHeight:1.6}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:'rgba(255,215,10,0.06)',borderRadius:16,padding:'16px 18px',border:'1px solid rgba(255,215,10,0.2)',marginBottom:24}}>
              <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,marginBottom:8}}>📋 面談の流れ</div>
              {['Calendlyで日程を選ぶ（30分）','ビデオ通話で面談','具体的なアドバイスをもらう','フォローアップメッセージ'].map((s,i)=>(
                <div key={i} style={{display:'flex',gap:10,marginBottom:6,fontSize:13,color:'#888',alignItems:'center'}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:'rgba(255,215,10,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#ffd60a',flexShrink:0}}>{i+1}</div>
                  {s}
                </div>
              ))}
            </div>

            <a href="https://calendly.com/tamanegu-19980331/30min" target="_blank" rel="noopener noreferrer"
              style={{display:'block',width:'100%',padding:'18px',background:'linear-gradient(135deg,#ffd60a,#ff8c00)',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',textAlign:'center',textDecoration:'none',marginBottom:12,boxShadow:'0 4px 20px rgba(255,215,10,0.2)'}}>
              📅 今すぐ面談を予約する
            </a>

            <div style={{fontSize:11,color:'#444',textAlign:'center'}}>
              ※ 予約後、確認メールが届きます
            </div>
          </div>
        )}
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