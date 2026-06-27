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

  const rankColor = (r: string) => ({S:'#ffd60a',A:'#39ff14',B:'#00c8ff',C:'#ff8c00',D:'#ff6b9d',F:'#ff4455'}[r]||'#666')
  const rankLabel = (r: string) => ({S:'最高レベル！',A:'素晴らしい！',B:'いい調子！',C:'もう少し！',D:'伸びしろあり',F:'これから！'}[r]||'')

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

  // マイルストーン判定
  const getMilestones = () => {
    const milestones = []
    if (totalCompleted >= 1) milestones.push({ emoji: '🎉', text: '初回トレーニング達成！' })
    if (totalCompleted >= 5) milestones.push({ emoji: '🔥', text: '5回トレーニング達成！' })
    if (totalCompleted >= 10) milestones.push({ emoji: '💪', text: '10回トレーニング達成！' })
    if (totalCompleted >= 30) milestones.push({ emoji: '🏆', text: '30回トレーニング達成！' })
    if (latest?.pushup_rank === 'S') milestones.push({ emoji: '👑', text: '腕立てSランク到達！' })
    if (latest?.situp_rank === 'S') milestones.push({ emoji: '👑', text: '腹筋Sランク到達！' })
    if (prev && latest && latest.pushup_rank !== prev.pushup_rank) {
      milestones.push({ emoji: '📈', text: `腕立てが${prev.pushup_rank}→${latest.pushup_rank}ランクにアップ！` })
    }
    return milestones.slice(-3)
  }

  const milestones = getMilestones()

  // 励ましメッセージ
  const getMotivationMessage = () => {
    if (!latest) return '体力テストで今の自分を確認しよう！'
    const ranks = [latest.pushup_rank, latest.situp_rank, latest.plank_rank]
    const hasS = ranks.includes('S')
    const hasA = ranks.includes('A')
    const hasF = ranks.includes('F') || ranks.includes('D')
    if (hasS) return '素晴らしい！トップクラスの体力です。このまま維持しよう！'
    if (hasA) return 'Aランク到達！あとひと踏ん張りでSランクが見えてきます！'
    if (hasF) return '大丈夫！毎日続けることで必ず成長します。今日も一歩前へ！'
    return 'いい調子！継続することで来月はさらに成長できます！'
  }

  if (loading) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14',fontSize:14}}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>
        <div style={{padding:'20px 24px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid #1e1e26'}}>
          <button onClick={()=>router.push('/dashboard')}
            style={{background:'none',border:'none',color:'#666',fontSize:24,cursor:'pointer',padding:0}}>←</button>
          <div>
            <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,letterSpacing:2,marginBottom:2}}>PROGRESS</div>
            <div style={{fontSize:18,fontWeight:800}}>成長記録</div>
          </div>
        </div>

        <div style={{padding:'20px 24px 0'}}>

          {/* KPIカード */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[
              {label:'総完了回数',value:totalCompleted,color:'#39ff14',unit:'回',emoji:'💪'},
              {label:'今週',value:weeklyCount,color:'#00c8ff',unit:'回',emoji:'📅'},
              {label:'体力テスト',value:fitnessLogs.length,color:'#ffd60a',unit:'回',emoji:'🏋️'},
            ].map(item=>(
              <div key={item.label} style={{background:'#1e1e26',borderRadius:16,padding:'16px 12px',border:'1px solid #2a2a36',textAlign:'center'}}>
                <div style={{fontSize:16,marginBottom:4}}>{item.emoji}</div>
                <div style={{fontSize:10,color:'#555',marginBottom:4}}>{item.label}</div>
                <div style={{fontSize:24,fontWeight:800,color:item.color}}>{item.value}</div>
                <div style={{fontSize:10,color:'#444'}}>{item.unit}</div>
              </div>
            ))}
          </div>

          {/* マイルストーン */}
          {milestones.length > 0 && (
            <div style={{background:'rgba(255,215,10,0.06)',borderRadius:16,padding:'16px 18px',border:'1px solid rgba(255,215,10,0.2)',marginBottom:16}}>
              <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,marginBottom:10}}>🏆 達成したこと</div>
              {milestones.map((m, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontSize:13}}>
                  <span style={{fontSize:16}}>{m.emoji}</span>
                  <span style={{color:'#e8e8e8',fontWeight:600}}>{m.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* 励ましメッセージ */}
          <div style={{background:'rgba(57,255,20,0.06)',borderRadius:16,padding:'14px 18px',border:'1px solid rgba(57,255,20,0.15)',marginBottom:20}}>
            <div style={{fontSize:12,color:'#39ff14',lineHeight:1.7,fontWeight:600}}>
              💬 {getMotivationMessage()}
            </div>
          </div>

          {/* タブ */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:20}}>
            {[
              {v:'fitness',l:'体力テスト',c:'#ffd60a'},
              {v:'exercise',l:'種目記録',c:'#39ff14'},
              {v:'history',l:'履歴',c:'#00c8ff'},
            ].map(t=>(
              <button key={t.v} onClick={()=>setTab(t.v)}
                style={{padding:'12px 8px',background:tab===t.v?'rgba(255,215,10,0.08)':'#1e1e26',border:'1.5px solid '+(tab===t.v?t.c:'#2a2a36'),borderRadius:12,color:tab===t.v?t.c:'#555',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}>
                {t.l}
              </button>
            ))}
          </div>

          {/* 体力テストタブ */}
          {tab==='fitness'&&(
            <div>
              {fitnessLogs.length===0&&(
                <div style={{background:'#1e1e26',borderRadius:20,padding:'40px 24px',border:'1px solid #2a2a36',textAlign:'center'}}>
                  <div style={{fontSize:40,marginBottom:12}}>💪</div>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>体力テストをやってみましょう</div>
                  <div style={{fontSize:13,color:'#555',marginBottom:20}}>今の自分を知ることが成長の第一歩！</div>
                  <button onClick={()=>router.push('/fitness-test')}
                    style={{padding:'14px 28px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer'}}>
                    体力テストへ →
                  </button>
                </div>
              )}

              {latest&&(
                <div style={{background:'#1e1e26',borderRadius:20,padding:'24px',border:'1px solid #2a2a36',marginBottom:12}}>
                  <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,marginBottom:4}}>最新の体力テスト</div>
                  <div style={{fontSize:11,color:'#444',marginBottom:16}}>
                    {new Date(latest.created_at).toLocaleDateString('ja-JP')} · {latest.age_group}
                  </div>
                  {[
                    {name:'腕立て伏せ',value:latest.pushup_value,rank:latest.pushup_rank,unit:'回',prev:prev?.pushup_value},
                    {name:'腹筋',value:latest.situp_value,rank:latest.situp_rank,unit:'回',prev:prev?.situp_value},
                    {name:'プランク',value:latest.plank_value,rank:latest.plank_rank,unit:'秒',prev:prev?.plank_value},
                  ].map(item=>(
                    <div key={item.name} style={{padding:'14px 0',borderBottom:'1px solid #1a1a22'}}>
                      <div style={{display:'flex',alignItems:'center',gap:14}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{item.name}</div>
                          {item.prev!=null&&(
                            <div style={{fontSize:12,color:item.value>item.prev?'#39ff14':'#ff4455',fontWeight:600,marginBottom:4}}>
                              {item.value>item.prev?'↑ 前回より':'↓ 前回より'} {Math.abs(item.value-item.prev).toFixed(0)}{item.unit}{item.value>item.prev?' 成長！':' 次は頑張ろう'}
                            </div>
                          )}
                          <div style={{fontSize:11,color:rankColor(item.rank),fontWeight:600}}>{rankLabel(item.rank)}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:36,fontWeight:800,color:rankColor(item.rank)}}>{item.rank}</div>
                          <div style={{fontSize:15,fontWeight:700}}>{item.value}{item.unit}</div>
                        </div>
                      </div>
                      {/* ランク進捗バー */}
                      <div style={{marginTop:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#444',marginBottom:4}}>
                          <span>F</span><span>D</span><span>C</span><span>B</span><span>A</span><span>S</span>
                        </div>
                        <div style={{background:'#2a2a36',borderRadius:4,height:6,overflow:'hidden'}}>
                          <div style={{height:'100%',background:rankColor(item.rank),borderRadius:4,width:({'S':'100%','A':'83%','B':'66%','C':'50%','D':'33%','F':'16%'} as any)[item.rank]||'0%',transition:'width 0.5s'}}/>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 次のランクへのメッセージ */}
                  {latest.pushup_rank !== 'S' && (
                    <div style={{marginTop:16,padding:'12px 14px',background:'rgba(57,255,20,0.06)',borderRadius:12,border:'1px solid rgba(57,255,20,0.15)'}}>
                      <div style={{fontSize:12,color:'#39ff14',fontWeight:700,marginBottom:4}}>🎯 次の目標</div>
                      <div style={{fontSize:12,color:'#888'}}>
                        腕立て伏せを毎日続けることで{latest.pushup_rank === 'D' ? 'Cランク' : latest.pushup_rank === 'C' ? 'Bランク' : latest.pushup_rank === 'B' ? 'Aランク' : 'Sランク'}に近づけます！
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* グラフ */}
              {fitnessLogs.length>1&&(
                <div style={{background:'#1e1e26',borderRadius:20,padding:'24px',border:'1px solid #2a2a36',marginBottom:12}}>
                  <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,marginBottom:4}}>腕立て伏せ推移</div>
                  <div style={{fontSize:11,color:'#555',marginBottom:16}}>継続するほど成長が見えてくる！</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:6,height:100}}>
                    {fitnessLogs.map((l,i)=>{
                      const max = Math.max(...fitnessLogs.map(x=>x.pushup_value))
                      const h = max>0?(l.pushup_value/max)*80+10:10
                      const isLatest = i===fitnessLogs.length-1
                      const isImproved = i>0 && l.pushup_value > fitnessLogs[i-1].pushup_value
                      return (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                          <div style={{fontSize:9,color:isLatest?'#ffd60a':'#555',fontWeight:isLatest?700:400}}>{l.pushup_value}</div>
                          <div style={{width:'100%',height:h,background:isLatest?'#ffd60a':isImproved?'#39ff14':'#2a2a36',borderRadius:'4px 4px 0 0',position:'relative'}}>
                            {isLatest&&<div style={{position:'absolute',top:-6,left:'50%',transform:'translateX(-50%)',fontSize:8,color:'#ffd60a'}}>★</div>}
                          </div>
                          <div style={{fontSize:8,color:'#444'}}>
                            {new Date(l.created_at).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {fitnessLogs.length>=2&&(
                    <div style={{marginTop:12,fontSize:12,color:'#39ff14',fontWeight:600,textAlign:'center'}}>
                      {fitnessLogs[fitnessLogs.length-1].pushup_value > fitnessLogs[0].pushup_value
                        ? `📈 最初から+${fitnessLogs[fitnessLogs.length-1].pushup_value - fitnessLogs[0].pushup_value}回成長！`
                        : '続けることで必ず成長します！'}
                    </div>
                  )}
                </div>
              )}

              <button onClick={()=>router.push('/fitness-test')}
                style={{width:'100%',padding:'16px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:14,fontSize:14,fontWeight:800,cursor:'pointer'}}>
                体力テストを再測定 →
              </button>
            </div>
          )}

          {/* 種目記録タブ */}
          {tab==='exercise'&&(
            <div>
              <div style={{background:'#1e1e26',borderRadius:20,padding:'24px',border:'1px solid #2a2a36',marginBottom:12}}>
                <div style={{fontSize:12,color:'#39ff14',fontWeight:700,marginBottom:4}}>よくやる種目 TOP5</div>
                <div style={{fontSize:11,color:'#555',marginBottom:16}}>継続している種目があなたの強みです！</div>
                {topExercises.length===0&&(
                  <div style={{color:'#444',fontSize:13,textAlign:'center',padding:'20px 0'}}>まだ記録がありません</div>
                )}
                {topExercises.map(([name,count],i)=>(
                  <div key={name} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid #1a1a22'}}>
                    <div style={{width:32,height:32,borderRadius:10,background:i===0?'rgba(255,215,10,0.15)':i===1?'rgba(170,170,170,0.1)':i===2?'rgba(205,127,50,0.1)':'#25252f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,flexShrink:0,color:i===0?'#ffd60a':i===1?'#aaa':i===2?'#cd7f32':'#444'}}>
                      {i+1}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600}}>{name}</div>
                      {i===0&&<div style={{fontSize:10,color:'#ffd60a',marginTop:2}}>あなたの得意種目！</div>}
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:'#39ff14'}}>{count}回</div>
                  </div>
                ))}
              </div>

              <div style={{background:'#1e1e26',borderRadius:20,padding:'24px',border:'1px solid #2a2a36'}}>
                <div style={{fontSize:12,color:'#39ff14',fontWeight:700,marginBottom:16}}>最近の種目記録</div>
                {exerciseLogs.slice(0,10).map((l,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1a1a22'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{l.exercise_name}</div>
                      <div style={{fontSize:11,color:'#444'}}>{new Date(l.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <div style={{fontSize:12,color:'#39ff14',fontWeight:600}}>{l.sets}セット × {l.reps}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 履歴タブ */}
          {tab==='history'&&(
            <div style={{background:'#1e1e26',borderRadius:20,padding:'24px',border:'1px solid #2a2a36'}}>
              <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,marginBottom:4}}>トレーニング履歴</div>
              <div style={{fontSize:11,color:'#555',marginBottom:16}}>
                {totalCompleted}回完了 · {trainingLogs.length - totalCompleted}回未完了
              </div>
              {trainingLogs.length===0&&(
                <div style={{color:'#444',fontSize:13,textAlign:'center',padding:'20px 0'}}>まだ履歴がありません</div>
              )}
              {trainingLogs.map((l,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #1a1a22'}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{l.menu_name}</div>
                    <div style={{fontSize:11,color:'#444'}}>{new Date(l.created_at).toLocaleDateString('ja-JP')}</div>
                  </div>
                  <span style={{fontSize:11,background:l.completed?'rgba(57,255,20,0.08)':'rgba(255,68,85,0.08)',border:'1px solid '+(l.completed?'rgba(57,255,20,0.2)':'rgba(255,68,85,0.2)'),color:l.completed?'#39ff14':'#ff4455',borderRadius:20,padding:'4px 12px',fontWeight:600}}>
                    {l.completed?'✅ 完了':'未完了'}
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