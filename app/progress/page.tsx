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
      supabase.from('training_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setFitnessLogs(f.data || [])
    setExerciseLogs(e.data || [])
    setTrainingLogs(t.data || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14',fontSize:14}}>読み込み中...</div>
    </div>
  )

  const rankColor = (r: string) => ({S:'#ffd60a',A:'#39ff14',B:'#00c8ff',C:'#ff8c00',D:'#ff6b9d',F:'#ff4455'}[r]||'#666')

  const latest = fitnessLogs[fitnessLogs.length - 1]
  const prev = fitnessLogs[fitnessLogs.length - 2]

  const exerciseCount: Record<string, number> = {}
  exerciseLogs.forEach(e => {
    exerciseCount[e.exercise_name] = (exerciseCount[e.exercise_name] || 0) + 1
  })
  const topExercises = Object.entries(exerciseCount).sort((a,b)=>b[1]-a[1]).slice(0,5)

  const weeklyCount = trainingLogs.filter(t => {
    const d = new Date(t.created_at)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7 && t.completed
  }).length

  const totalCompleted = trainingLogs.filter(t => t.completed).length

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        {/* ヘッダー */}
        <div style={{
          padding:'20px 24px',
          display:'flex',alignItems:'center',gap:12,
          borderBottom:'1px solid #1e1e26',
        }}>
          <button onClick={()=>router.push('/dashboard')}
            style={{background:'none',border:'none',color:'#666',fontSize:24,cursor:'pointer',padding:0}}>
            ←
          </button>
          <div>
            <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,letterSpacing:2,marginBottom:2}}>PROGRESS</div>
            <div style={{fontSize:18,fontWeight:800}}>成長記録</div>
          </div>
        </div>

        <div style={{padding:'20px 24px 0'}}>

          {/* KPIカード */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[
              {label:'総完了回数',value:totalCompleted,color:'#39ff14',unit:'回'},
              {label:'今週',value:weeklyCount,color:'#00c8ff',unit:'回'},
              {label:'体力テスト',value:fitnessLogs.length,color:'#ffd60a',unit:'回'},
            ].map(item=>(
              <div key={item.label} style={{
                background:'#1e1e26',borderRadius:16,padding:'16px 12px',
                border:'1px solid #2a2a36',textAlign:'center',
              }}>
                <div style={{fontSize:10,color:'#555',marginBottom:6}}>{item.label}</div>
                <div style={{fontSize:24,fontWeight:800,color:item.color}}>{item.value}</div>
                <div style={{fontSize:10,color:'#444'}}>{item.unit}</div>
              </div>
            ))}
          </div>

          {/* タブ */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:20}}>
            {[
              {v:'fitness',l:'体力テスト',c:'#ffd60a'},
              {v:'exercise',l:'種目記録',c:'#39ff14'},
              {v:'history',l:'履歴',c:'#00c8ff'},
            ].map(t=>(
              <button key={t.v} onClick={()=>setTab(t.v)}
                style={{
                  padding:'12px 8px',
                  background:tab===t.v?'rgba(255,215,10,0.08)':'#1e1e26',
                  border:'1.5px solid '+(tab===t.v?t.c:'#2a2a36'),
                  borderRadius:12,color:tab===t.v?t.c:'#555',
                  fontSize:12,fontWeight:700,cursor:'pointer',
                  transition:'all 0.2s',
                }}>
                {t.l}
              </button>
            ))}
          </div>

          {/* 体力テストタブ */}
          {tab==='fitness'&&(
            <div>
              {fitnessLogs.length===0&&(
                <div style={{
                  background:'#1e1e26',borderRadius:20,padding:'40px 24px',
                  border:'1px solid #2a2a36',textAlign:'center',
                }}>
                  <div style={{fontSize:40,marginBottom:12}}>💪</div>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>体力テストをやってみましょう</div>
                  <div style={{fontSize:13,color:'#555',marginBottom:20}}>結果を記録して成長を確認できます</div>
                  <button onClick={()=>router.push('/fitness-test')}
                    style={{
                      padding:'14px 28px',
                      background:'linear-gradient(135deg,#39ff14,#00c8ff)',
                      color:'#000',border:'none',borderRadius:12,
                      fontSize:14,fontWeight:800,cursor:'pointer',
                    }}>
                    体力テストへ →
                  </button>
                </div>
              )}

              {latest&&(
                <div style={{
                  background:'#1e1e26',borderRadius:20,padding:'24px',
                  border:'1px solid #2a2a36',marginBottom:12,
                }}>
                  <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,marginBottom:4}}>最新の体力テスト</div>
                  <div style={{fontSize:11,color:'#444',marginBottom:16}}>
                    {new Date(latest.created_at).toLocaleDateString('ja-JP')} · {latest.age_group}
                  </div>
                  {[
                    {name:'腕立て伏せ',value:latest.pushup_value,rank:latest.pushup_rank,unit:'回',prev:prev?.pushup_value},
                    {name:'腹筋',value:latest.situp_value,rank:latest.situp_rank,unit:'回',prev:prev?.situp_value},
                    {name:'プランク',value:latest.plank_value,rank:latest.plank_rank,unit:'秒',prev:prev?.plank_value},
                  ].map(item=>(
                    <div key={item.name} style={{
                      display:'flex',alignItems:'center',gap:14,
                      padding:'14px 0',borderBottom:'1px solid #1a1a22',
                    }}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{item.name}</div>
                        {item.prev!=null&&(
                          <div style={{
                            fontSize:12,
                            color:item.value>item.prev?'#39ff14':'#ff4455',
                            fontWeight:600,
                          }}>
                            {item.value>item.prev?'↑':'↓'} 前回比 {item.value>item.prev?'+':''}{(item.value-item.prev).toFixed(0)}{item.unit}
                          </div>
                        )}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:32,fontWeight:800,color:rankColor(item.rank)}}>{item.rank}</div>
                        <div style={{fontSize:14,fontWeight:700}}>{item.value}{item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 履歴グラフ */}
              {fitnessLogs.length>1&&(
                <div style={{
                  background:'#1e1e26',borderRadius:20,padding:'24px',
                  border:'1px solid #2a2a36',
                }}>
                  <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,marginBottom:16}}>腕立て伏せ推移</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
                    {fitnessLogs.map((l,i)=>{
                      const max = Math.max(...fitnessLogs.map(x=>x.pushup_value))
                      const h = max>0?(l.pushup_value/max)*70+10:10
                      const isLatest = i===fitnessLogs.length-1
                      return (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                          {isLatest&&<div style={{fontSize:9,color:'#ffd60a',fontWeight:700}}>{l.pushup_value}</div>}
                          <div style={{
                            width:'100%',height:h,
                            background:isLatest?'#ffd60a':'#2a2a36',
                            borderRadius:'4px 4px 0 0',
                          }}/>
                          <div style={{fontSize:8,color:'#444'}}>
                            {new Date(l.created_at).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}
                          </div>
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
              <div style={{
                background:'#1e1e26',borderRadius:20,padding:'24px',
                border:'1px solid #2a2a36',marginBottom:12,
              }}>
                <div style={{fontSize:12,color:'#39ff14',fontWeight:700,marginBottom:16}}>よくやる種目 TOP5</div>
                {topExercises.length===0&&(
                  <div style={{color:'#444',fontSize:13,textAlign:'center',padding:'20px 0'}}>
                    まだ記録がありません
                  </div>
                )}
                {topExercises.map(([name,count],i)=>(
                  <div key={name} style={{
                    display:'flex',alignItems:'center',gap:14,
                    padding:'12px 0',borderBottom:'1px solid #1a1a22',
                  }}>
                    <div style={{
                      width:32,height:32,borderRadius:10,
                      background:i===0?'rgba(255,215,10,0.15)':i===1?'rgba(170,170,170,0.1)':i===2?'rgba(205,127,50,0.1)':'#25252f',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:14,fontWeight:800,flexShrink:0,
                      color:i===0?'#ffd60a':i===1?'#aaa':i===2?'#cd7f32':'#444',
                    }}>
                      {i+1}
                    </div>
                    <div style={{flex:1,fontSize:14,fontWeight:600}}>{name}</div>
                    <div style={{fontSize:13,fontWeight:700,color:'#39ff14'}}>{count}回</div>
                  </div>
                ))}
              </div>

              <div style={{
                background:'#1e1e26',borderRadius:20,padding:'24px',
                border:'1px solid #2a2a36',
              }}>
                <div style={{fontSize:12,color:'#39ff14',fontWeight:700,marginBottom:16}}>最近の種目記録</div>
                {exerciseLogs.slice(0,10).map((l,i)=>(
                  <div key={i} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'10px 0',borderBottom:'1px solid #1a1a22',
                  }}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{l.exercise_name}</div>
                      <div style={{fontSize:11,color:'#444'}}>
                        {new Date(l.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    <div style={{fontSize:12,color:'#39ff14',fontWeight:600}}>
                      {l.sets}セット × {l.reps}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 履歴タブ */}
          {tab==='history'&&(
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'24px',
              border:'1px solid #2a2a36',
            }}>
              <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,marginBottom:16}}>トレーニング履歴</div>
              {trainingLogs.length===0&&(
                <div style={{color:'#444',fontSize:13,textAlign:'center',padding:'20px 0'}}>
                  まだ履歴がありません
                </div>
              )}
              {trainingLogs.map((l,i)=>(
                <div key={i} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'12px 0',borderBottom:'1px solid #1a1a22',
                }}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{l.menu_name}</div>
                    <div style={{fontSize:11,color:'#444'}}>
                      {new Date(l.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <span style={{
                    fontSize:11,
                    background:l.completed?'rgba(57,255,20,0.08)':'rgba(255,68,85,0.08)',
                    border:'1px solid '+(l.completed?'rgba(57,255,20,0.2)':'rgba(255,68,85,0.2)'),
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