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

function getNextLevel(exp: number) {
  const cur = getLevel(exp)
  return LEVELS.find(l => l.lv === cur.lv + 1) || cur
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [exp, setExp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!data) { router.push('/onboarding'); return }
    setProfile(data)
    setExp(data.exp || 0)
    setStreak(data.streak || 0)
    const { data: logData } = await supabase
      .from('training_logs').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setLogs(logData || [])
  }

  if (!profile) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14',fontSize:14}}>読み込み中...</div>
    </div>
  )

  const curLv = getLevel(exp)
  const nextLv = getNextLevel(exp)
  const expProgress = nextLv.lv > curLv.lv
    ? ((exp - curLv.minExp) / (nextLv.minExp - curLv.minExp)) * 100
    : 100

  const todayDone = logs.some(l => {
    const today = new Date().toDateString()
    return new Date(l.created_at).toDateString() === today && l.completed
  })

  const lvEmoji = curLv.lv <= 2 ? '🌱' : curLv.lv <= 4 ? '💪' : curLv.lv <= 6 ? '🔥' : '⚡'

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        {/* ヘッダー */}
        <div style={{
          padding:'20px 24px 20px',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          borderBottom:'1px solid #1e1e26',
        }}>
          <div>
            <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:2}}>MY TRAINER</div>
            <div style={{fontSize:18,fontWeight:800}}>こんにちは、{profile.name}さん 👋</div>
          </div>
          <button onClick={async()=>{await supabase.auth.signOut();router.push('/auth')}}
            style={{padding:'8px 14px',background:'#1e1e26',border:'none',borderRadius:10,color:'#666',fontSize:12,cursor:'pointer'}}>
            ログアウト
          </button>
        </div>

        <div style={{padding:'20px 24px 0'}}>

          {/* 今日のステータス */}
          {todayDone && (
            <div style={{
              background:'rgba(57,255,20,0.08)',border:'1px solid rgba(57,255,20,0.2)',
              borderRadius:16,padding:'16px 20px',marginBottom:20,
              display:'flex',alignItems:'center',gap:12,
            }}>
              <div style={{fontSize:28}}>✅</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#39ff14'}}>今日のトレーニング完了！</div>
                <div style={{fontSize:12,color:'#666',marginTop:2}}>お疲れ様でした。継続が力です</div>
              </div>
            </div>
          )}

          {/* レベル・EXPカード */}
          <div style={{
            background:'#1e1e26',borderRadius:20,padding:'24px',
            border:'1px solid #2a2a36',marginBottom:16,
          }}>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
              <div style={{
                width:72,height:72,borderRadius:'50%',
                background:'linear-gradient(135deg,#39ff14,#00c8ff)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:32,flexShrink:0,
              }}>
                {lvEmoji}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:'#666',marginBottom:4}}>現在のレベル</div>
                <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                  <span style={{fontSize:28,fontWeight:800,color:'#39ff14'}}>Lv.{curLv.lv}</span>
                  <span style={{fontSize:15,color:'#888',fontWeight:600}}>{curLv.title}</span>
                </div>
              </div>
              {streak > 0 && (
                <div style={{
                  textAlign:'center',
                  background:'rgba(255,140,0,0.1)',
                  border:'1px solid rgba(255,140,0,0.2)',
                  borderRadius:14,padding:'12px 16px',
                }}>
                  <div style={{fontSize:22}}>🔥</div>
                  <div style={{fontSize:18,fontWeight:800,color:'#ff8c00'}}>{streak}</div>
                  <div style={{fontSize:10,color:'#666'}}>日連続</div>
                </div>
              )}
            </div>

            {/* EXPバー */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',marginBottom:8}}>
                <span>{exp} EXP</span>
                <span>{nextLv.lv > curLv.lv ? `次: ${nextLv.minExp} EXP` : 'MAX'}</span>
              </div>
              <div style={{background:'#2a2a36',borderRadius:8,height:8,overflow:'hidden'}}>
                <div style={{
                  height:'100%',
                  width:`${expProgress}%`,
                  background:'linear-gradient(to right,#39ff14,#00c8ff)',
                  borderRadius:8,transition:'width 0.8s ease',
                }}/>
              </div>
              {nextLv.lv > curLv.lv && (
                <div style={{fontSize:11,color:'#444',marginTop:6,textAlign:'right'}}>
                  あと {nextLv.minExp - exp} EXP でレベルアップ
                </div>
              )}
            </div>
          </div>

          {/* プロフィールカード */}
          <div style={{
            background:'#1e1e26',borderRadius:20,padding:'20px 24px',
            border:'1px solid #2a2a36',marginBottom:20,
          }}>
            <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:14}}>あなたのデータ</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[
                {label:'性別',value:profile.gender,color:'#e8e8e8'},
                {label:'身長',value:profile.height+'cm',color:'#00c8ff'},
                {label:'体重',value:profile.weight+'kg',color:'#39ff14'},
              ].map(item=>(
                <div key={item.label} style={{
                  background:'#25252f',borderRadius:12,
                  padding:'14px 10px',textAlign:'center',
                }}>
                  <div style={{fontSize:11,color:'#555',marginBottom:6}}>{item.label}</div>
                  <div style={{fontSize:16,fontWeight:800,color:item.color}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* メインCTA */}
          <button onClick={()=>router.push('/menu')}
            style={{
              width:'100%',padding:'20px',
              background:'linear-gradient(135deg,#39ff14,#00c8ff)',
              color:'#000',border:'none',borderRadius:18,
              fontSize:18,fontWeight:800,cursor:'pointer',
              marginBottom:12,
              boxShadow:'0 4px 20px rgba(57,255,20,0.2)',
            }}>
            ⚡ 今日のメニューを生成する
          </button>

          {/* サブボタングリッド */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            {[
              {label:'🏆 ランキング',color:'#ffd60a',path:'/ranking'},
              {label:'📈 成長記録',color:'#cc44ff',path:'/progress'},
              {label:'🍱 食事分析',color:'#ff8c00',path:'/food'},
              {label:'⚖️ 体重記録',color:'#00c8ff',path:'/body'},
              {label:'🤖 AIコーチ',color:'#39ff14',path:'/coach'},
            ].map(item=>(
              <button key={item.path} onClick={()=>router.push(item.path)}
                style={{
                  padding:'16px 12px',
                  background:'#1e1e26',
                  border:'1px solid #2a2a36',
                  borderRadius:14,
                  color:item.color,
                  fontSize:13,fontWeight:700,
                  cursor:'pointer',
                  textAlign:'center',
                  transition:'all 0.2s',
                }}>
                {item.label}
              </button>
            ))}
          </div>

          {/* 履歴ボタン */}
          <button onClick={()=>setShowHistory(!showHistory)}
            style={{
              width:'100%',padding:'16px',
              background:'transparent',color:'#666',
              border:'1px solid #2a2a36',borderRadius:14,
              fontSize:13,fontWeight:600,cursor:'pointer',
              marginBottom:showHistory?12:0,
            }}>
            {showHistory ? '履歴を閉じる ↑' : `📋 トレーニング履歴（${logs.filter(l=>l.completed).length}件）`}
          </button>

          {/* 履歴リスト */}
          {showHistory && (
            <div>
              {logs.length===0&&(
                <div style={{color:'#444',fontSize:13,textAlign:'center',padding:'24px'}}>
                  まだ履歴がありません
                </div>
              )}
              {logs.map(l=>(
                <div key={l.id} style={{
                  background:'#1e1e26',borderRadius:14,
                  padding:'14px 18px',border:'1px solid #2a2a36',
                  marginBottom:8,display:'flex',
                  justifyContent:'space-between',alignItems:'center',
                }}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{l.menu_name}</div>
                    <div style={{fontSize:11,color:'#555'}}>{new Date(l.created_at).toLocaleDateString('ja-JP')}</div>
                  </div>
                  <span style={{
                    fontSize:11,
                    background:l.completed?'rgba(57,255,20,0.1)':'rgba(255,68,85,0.1)',
                    border:'1px solid '+(l.completed?'rgba(57,255,20,0.3)':'rgba(255,68,85,0.3)'),
                    color:l.completed?'#39ff14':'#ff4455',
                    borderRadius:20,padding:'4px 12px',fontWeight:600,
                  }}>
                    {l.completed?'完了':'未完了'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}