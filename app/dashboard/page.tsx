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
  const [user, setUser] = useState<any>(null)
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
    setUser(user)
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!data) { router.push('/onboarding'); return }
    setProfile(data)
    setExp(data.exp || 0)

    // トレーニング履歴取得
    const { data: logData } = await supabase
      .from('training_logs').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setLogs(logData || [])

    // ストリーク計算
    if (logData && logData.length > 0) {
      let s = 0
      const today = new Date().toDateString()
      const dates = [...new Set(logData.map((l: any) => new Date(l.created_at).toDateString()))]
      for (let i = 0; i < dates.length; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        if (dates.includes(d.toDateString())) s++
        else break
      }
      setStreak(s)
    }
  }

  if (!user || !profile) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14'}}>読み込み中...</div>
    </div>
  )

  const curLv = getLevel(exp)
  const nextLv = getNextLevel(exp)
  const expProgress = nextLv.lv > curLv.lv
    ? ((exp - curLv.minExp) / (nextLv.minExp - curLv.minExp)) * 100
    : 100

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 40px'}}>

        {/* ヘッダー */}
        <div style={{padding:'14px 16px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:'#39ff14',letterSpacing:3}}>MY TRAINER</div>
            <div style={{fontSize:13,color:'#666',marginTop:2}}>こんにちは、{profile.name}さん！</div>
          </div>
          <button onClick={async()=>{await supabase.auth.signOut();router.push('/auth')}}
            style={{padding:'8px 14px',background:'transparent',border:'1px solid #2a2a36',borderRadius:8,color:'#666',fontSize:12,cursor:'pointer'}}>
            ログアウト
          </button>
        </div>

        {/* レベル・EXPカード */}
        <div style={{margin:'16px',background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#39ff14,#00c8ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>
              {curLv.lv <= 2 ? '🌱' : curLv.lv <= 4 ? '💪' : curLv.lv <= 6 ? '🔥' : '⚡'}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                <span style={{fontSize:22,fontWeight:800,color:'#39ff14'}}>Lv.{curLv.lv}</span>
                <span style={{fontSize:13,color:'#666'}}>{curLv.title}</span>
              </div>
              <div style={{fontSize:11,color:'#666',marginTop:2}}>{exp} EXP</div>
            </div>
            {streak > 0 && (
              <div style={{textAlign:'center',background:'rgba(255,140,0,0.1)',border:'1px solid rgba(255,140,0,0.3)',borderRadius:10,padding:'8px 12px'}}>
                <div style={{fontSize:20}}>🔥</div>
                <div style={{fontSize:14,fontWeight:800,color:'#ff8c00'}}>{streak}日</div>
                <div style={{fontSize:9,color:'#666'}}>連続</div>
              </div>
            )}
          </div>

          {/* EXPバー */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#666',marginBottom:4}}>
              <span>{curLv.title}</span>
              <span>{nextLv.lv > curLv.lv ? nextLv.title : 'MAX'}</span>
            </div>
            <div style={{background:'#2a2a36',borderRadius:8,height:8,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${expProgress}%`,background:'linear-gradient(to right,#39ff14,#00c8ff)',borderRadius:8,transition:'width 0.5s'}}/>
            </div>
            {nextLv.lv > curLv.lv && (
              <div style={{fontSize:10,color:'#666',marginTop:4,textAlign:'right'}}>
                次のレベルまで {nextLv.minExp - exp} EXP
              </div>
            )}
          </div>
        </div>

        {/* プロフィールカード */}
        <div style={{margin:'0 16px 16px',background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36'}}>
          <div style={{fontSize:10,color:'#39ff14',fontWeight:700,letterSpacing:1,marginBottom:10}}>あなたのデータ</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {label:'性別',value:profile.gender},
              {label:'身長',value:profile.height+'cm'},
              {label:'体重',value:profile.weight+'kg'},
            ].map(item=>(
              <div key={item.label} style={{background:'#25252f',borderRadius:10,padding:'10px',textAlign:'center'}}>
                <div style={{fontSize:10,color:'#666',marginBottom:4}}>{item.label}</div>
                <div style={{fontSize:16,fontWeight:800,color:'#39ff14'}}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* メインボタン */}
        <div style={{margin:'0 16px 16px'}}>
          <button onClick={()=>router.push('/goal')}
            style={{width:'100%',padding:'16px',background:'#39ff14',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',marginBottom:10}}>
            今日のメニューを生成する →
          </button>
          <button onClick={()=>setShowHistory(!showHistory)}
            style={{width:'100%',padding:'13px',background:'transparent',color:'#39ff14',border:'1px solid #39ff14',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            {showHistory ? '履歴を閉じる' : `トレーニング履歴を見る（${logs.length}件）`}
          </button>
        </div>

        {/* 履歴 */}
        {showHistory && (
          <div style={{margin:'0 16px'}}>
            <div style={{fontSize:10,color:'#666',fontWeight:700,marginBottom:10}}>トレーニング履歴</div>
            {logs.length===0&&<div style={{color:'#444',fontSize:12,textAlign:'center',padding:'20px'}}>まだ履歴がありません</div>}
            {logs.map(l=>(
              <div key={l.id} style={{background:'#1e1e26',borderRadius:12,padding:'12px 14px',border:'1px solid #2a2a36',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700}}>{l.menu_name}</div>
                    <div style={{fontSize:10,color:'#666',marginTop:2}}>{new Date(l.created_at).toLocaleDateString('ja-JP')}</div>
                  </div>
                  <span style={{fontSize:10,background:l.completed?'rgba(57,255,20,0.1)':'rgba(255,68,85,0.1)',border:'1px solid '+(l.completed?'#1a6600':'#ff445544'),color:l.completed?'#39ff14':'#ff4455',borderRadius:20,padding:'3px 10px'}}>
                    {l.completed?'完了':'未完了'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}