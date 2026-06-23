'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LEVELS = [
  {lv:1,title:'入門者',minExp:0},
  {lv:2,title:'見習い',minExp:100},
  {lv:3,title:'トレーニー',minExp:250},
  {lv:4,title:'戦士',minExp:500},
  {lv:5,title:'猛者',minExp:900},
  {lv:6,title:'エース',minExp:1500},
  {lv:7,title:'マスター',minExp:2500},
  {lv:8,title:'レジェンド',minExp:4000},
]

function getLevel(exp: number) {
  let cur = LEVELS[0]
  for (const lv of LEVELS) { if (exp >= lv.minExp) cur = lv }
  return cur
}

export default function RankingPage() {
  const [users, setUsers] = useState<any[]>([])
  const [myId, setMyId] = useState<string>('')
  const [tab, setTab] = useState('exp')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setMyId(user.id)

    const { data } = await supabase
      .from('users')
      .select('id, name, exp, level, gender')
      .eq('is_admin', false)
      .order('exp', { ascending: false })
      .limit(50)
    setUsers(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14'}}>Loading...</div>
    </div>
  )

  const rankIcon = (i: number) => i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 40px'}}>

        {/* ヘッダー */}
        <div style={{padding:'14px 16px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>router.push('/dashboard')} style={{background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer'}}>←</button>
          <div style={{fontSize:11,fontWeight:800,color:'#ffd60a',letterSpacing:3}}>全国ランキング</div>
        </div>

        {/* タブ */}
        <div style={{display:'flex',gap:6,padding:'14px 16px 0'}}>
          {[['exp','EXPランキング'],['level','レベルランキング']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{flex:1,padding:'9px',background:tab===k?'#ffd60a':'#1e1e26',color:tab===k?'#000':'#666',border:'1px solid '+(tab===k?'#ffd60a':'#2a2a36'),borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:'14px 16px'}}>
          {users.map((u, i) => {
            const lv = getLevel(u.exp || 0)
            const isMe = u.id === myId
            return (
              <div key={u.id} style={{
                background: isMe ? 'rgba(57,255,20,0.08)' : '#1e1e26',
                borderRadius:12, padding:'14px',
                border: `1px solid ${isMe ? '#39ff14' : '#2a2a36'}`,
                marginBottom:8,
                display:'flex', alignItems:'center', gap:12
              }}>
                <div style={{fontSize:i<3?24:14,fontWeight:800,minWidth:40,textAlign:'center',
                  color:i===0?'#ffd60a':i===1?'#aaa':i===2?'#cd7f32':'#666'}}>
                  {rankIcon(i)}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:800,color:isMe?'#39ff14':'#e8e8e8'}}>
                      {u.name||'名無し'}
                    </span>
                    {isMe&&<span style={{fontSize:9,background:'#39ff14',color:'#000',padding:'2px 6px',borderRadius:4,fontWeight:700}}>YOU</span>}
                  </div>
                  <div style={{fontSize:11,color:'#666'}}>Lv.{lv.lv} {lv.title}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:16,fontWeight:800,color:'#ffd60a'}}>{u.exp||0}</div>
                  <div style={{fontSize:9,color:'#666'}}>EXP</div>
                </div>
              </div>
            )
          })}

          {users.length === 0 && (
            <div style={{textAlign:'center',padding:'40px 0',color:'#444'}}>
              まだユーザーがいません
            </div>
          )}
        </div>

      </div>
    </div>
  )
}