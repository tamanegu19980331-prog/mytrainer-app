'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProgressPage() {
  const [fitnessLogs, setFitnessLogs] = useState<any[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([])
  const [trainingLogs, setTrainingLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('fitness')
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const [f, e, t] = await Promise.all([
      supabase.from('fitness_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('exercise_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('training_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    ])
    setFitnessLogs(f.data || [])
    setExerciseLogs(e.data || [])
    setTrainingLogs(t.data || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14'}}>Loading...</div>
    </div>
  )

  const rankColor = (r: string) => ({S:'#ffd60a',A:'#39ff14',B:'#00c8ff',C:'#ff8c00',D:'#ff6b9d',F:'#ff4455'}[r]||'#666')

  // 体力テスト比較
  const latest = fitnessLogs[fitnessLogs.length - 1]
  const prev = fitnessLogs[fitnessLogs.length - 2]

  // 種目別集計
  const exerciseCount: Record<string, number> = {}
  exerciseLogs.forEach(e => {
    exerciseCount[e.exercise_name] = (exerciseCount[e.exercise_name] || 0) + 1
  })
  const topExercises = Object.entries(exerciseCount).sort((a,b)=>b[1]-a[1]).slice(0,5)

  // 週間トレーニング数
  const weeklyCount = trainingLogs.filter(t => {
    const d = new Date(t.created_at)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7 && t.completed
  }).length

  const totalCompleted = trainingLogs.filter(t => t.completed).length

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 40px'}}>

        {/* ヘッダー */}
        <div style={{padding:'14px 16px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>router.push('/dashboard')} style={{background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer'}}>←</button>
          <div style={{fontSize:11,fontWeight:800,color:'#ffd60a',letterSpacing:3}}>成長記録</div>
        </div>

        {/* KPIカード */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,padding:'16px'}}>
          <div style={{background:'#1e1e26',borderRadius:12,padding:'12px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:'#39ff14'}}>{totalCompleted}</div>
            <div style={{fontSize:9,color:'#666'}}>総完了回数</div>
          </div>
          <div style={{background:'#1e1e26',borderRadius:12,padding:'12px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:'#00c8ff'}}>{weeklyCount}</div>
            <div style={{fontSize:9,color:'#666'}}>今週の回数</div>
          </div>
          <div style={{background:'#1e1e26',borderRadius:12,padding:'12px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:'#ffd60a'}}>{fitnessLogs.length}</div>
            <div style={{fontSize:9,color:'#666'}}>体力テスト回数</div>
          </div>
        </div>

        {/* タブ */}
        <div style={{display:'flex',gap:6,padding:'0 16px 14px'}}>
          {[['fitness','体力テスト'],['exercise','種目記録'],['history','履歴']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{flex:1,padding:'9px',background:tab===k?'#ffd60a':'#1e1e26',color:tab===k?'#000':'#666',border:'1px solid '+(tab===k?'#ffd60a':'#2a2a36'),borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:'0 16px'}}>

          {/* 体力テストタブ */}
          {tab==='fitness'&&(
            <div>
              {fitnessLogs.length===0&&(
                <div style={{textAlign:'center',padding:'40px 0',color:'#444'}}>
                  <div style={{fontSize:32,marginBottom:8}}>💪</div>
                  <div>体力テストをやってみましょう！</div>
                  <button onClick={()=>router.push('/fitness-test')}
                    style={{marginTop:16,padding:'12px 24px',background:'#00c8ff',color:'#000',border:'none',borderRadius:10,fontSize:13,fontWeight:800,cursor:'pointer'}}>
                    体力テストへ →
                  </button>
                </div>
              )}

              {/* 最新結果 */}
              {latest&&(
                <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36',marginBottom:14}}>
                  <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,marginBottom:12}}>最新の体力テスト結果</div>
                  <div style={{fontSize:11,color:'#666',marginBottom:10}}>{new Date(latest.created_at).toLocaleDateString('ja-JP')} · {latest.age_group}</div>
                  {[
                    {name:'腕立て伏せ',value:latest.pushup_value,rank:latest.pushup_rank,unit:'回',prev:prev?.pushup_value},
                    {name:'腹筋',value:latest.situp_value,rank:latest.situp_rank,unit:'回',prev:prev?.situp_value},
                    {name:'プランク',value:latest.plank_value,rank:latest.plank_rank,unit:'秒',prev:prev?.plank_value},
                  ].map(item=>(
                    <div key={item.name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #2a2a36'}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{item.name}</div>
                        {item.prev!=null&&(
                          <div style={{fontSize:11,color:item.value>item.prev?'#39ff14':'#ff4455'}}>
                            {item.value>item.prev?'↑':'↓'} 前回{item.prev}{item.unit}から{Math.abs(item.value-item.prev)}{item.unit}{item.value>item.prev?'増':'減'}
                          </div>
                        )}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:28,fontWeight:800,color:rankColor(item.rank)}}>{item.rank}</div>
                        <div style={{fontSize:14,fontWeight:700}}>{item.value}{item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 履歴グラフ */}
              {fitnessLogs.length>1&&(
                <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36',marginBottom:14}}>
                  <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,marginBottom:12}}>腕立て推移</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80}}>
                    {fitnessLogs.map((l,i)=>{
                      const max = Math.max(...fitnessLogs.map(x=>x.pushup_value))
                      const h = max>0?(l.pushup_value/max)*70+10:10
                      return (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          <div style={{fontSize:8,color:'#666'}}>{l.pushup_value}</div>
                          <div style={{width:'100%',height:h,background:rankColor(l.pushup_rank),borderRadius:'3px 3px 0 0',opacity:i===fitnessLogs.length-1?1:0.5}}/>
                          <div style={{fontSize:7,color:'#666'}}>{new Date(l.created_at).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 種目記録タブ */}
          {tab==='exercise'&&(
            <div>
              {/* よくやる種目 */}
              <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36',marginBottom:14}}>
                <div style={{fontSize:10,color:'#39ff14',fontWeight:700,marginBottom:12}}>よくやる種目 TOP5</div>
                {topExercises.length===0&&<div style={{color:'#444',fontSize:12}}>まだ記録がありません</div>}
                {topExercises.map(([name,count],i)=>(
                  <div key={name} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #2a2a36'}}>
                    <div style={{fontSize:16,fontWeight:800,color:i===0?'#ffd60a':i===1?'#aaa':i===2?'#cd7f32':'#666',minWidth:24}}>{i+1}</div>
                    <div style={{flex:1,fontSize:13}}>{name}</div>
                    <div style={{fontSize:12,fontWeight:700,color:'#39ff14'}}>{count}回</div>
                  </div>
                ))}
              </div>

              {/* 最近の種目記録 */}
              <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36'}}>
                <div style={{fontSize:10,color:'#39ff14',fontWeight:700,marginBottom:12}}>最近の種目記録</div>
                {exerciseLogs.slice(0,10).map((l,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #2a2a36'}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700}}>{l.exercise_name}</div>
                      <div style={{fontSize:10,color:'#666'}}>{new Date(l.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,color:'#39ff14'}}>{l.sets}セット × {l.reps}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 履歴タブ */}
          {tab==='history'&&(
            <div>
              <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36'}}>
                <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,marginBottom:12}}>トレーニング履歴</div>
                {trainingLogs.length===0&&<div style={{color:'#444',fontSize:12}}>まだ履歴がありません</div>}
                {trainingLogs.slice().reverse().map((l,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #2a2a36'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{l.menu_name}</div>
                      <div style={{fontSize:10,color:'#666'}}>{new Date(l.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <span style={{fontSize:10,background:l.completed?'rgba(57,255,20,0.1)':'rgba(255,68,85,0.1)',border:'1px solid '+(l.completed?'#1a6600':'#ff445544'),color:l.completed?'#39ff14':'#ff4455',borderRadius:20,padding:'3px 10px'}}>
                      {l.completed?'完了':'未完了'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}