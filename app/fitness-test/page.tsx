'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TESTS = [
  {
    id: 'pushup', name: '腕立て伏せ', emoji: '💪', color: '#39ff14',
    type: 'count', duration: 60,
    description: '60秒間で何回できるか計測します',
    instruction: '肩幅より少し広めに手をつき、胸が床につくまで下げてください',
    ranks: {
      '10代': {S:40,A:30,B:20,C:15,D:10},
      '20代': {S:45,A:35,B:25,C:18,D:12},
      '30代': {S:40,A:30,B:20,C:15,D:10},
      '40代': {S:35,A:25,B:15,C:10,D:7},
      '50代以上': {S:25,A:18,B:12,C:8,D:5},
    },
    levels: [{label:'初級',min:0,max:10,score:1},{label:'中級',min:11,max:25,score:2},{label:'上級',min:26,max:999,score:3}],
  },
  {
    id: 'situp', name: '腹筋（クランチ）', emoji: '🔥', color: '#ff6b9d',
    type: 'count', duration: 60,
    description: '60秒間で何回できるか計測します',
    instruction: '膝を曲げて仰向けになり、肩甲骨が床から離れるまで上体を起こしてください',
    ranks: {
      '10代': {S:50,A:40,B:30,C:20,D:15},
      '20代': {S:55,A:45,B:35,C:25,D:18},
      '30代': {S:50,A:40,B:30,C:20,D:15},
      '40代': {S:40,A:30,B:22,C:15,D:10},
      '50代以上': {S:30,A:22,B:15,C:10,D:7},
    },
    levels: [{label:'初級',min:0,max:15,score:1},{label:'中級',min:16,max:30,score:2},{label:'上級',min:31,max:999,score:3}],
  },
  {
    id: 'plank', name: 'プランク', emoji: '⏱', color: '#00c8ff',
    type: 'time', duration: 0,
    description: 'キープできた秒数を計測します',
    instruction: '肘をついて体をまっすぐに保ってください',
    ranks: {
      '10代': {S:120,A:90,B:60,C:40,D:20},
      '20代': {S:150,A:120,B:90,C:60,D:30},
      '30代': {S:120,A:90,B:60,C:45,D:25},
      '40代': {S:90,A:70,B:50,C:35,D:20},
      '50代以上': {S:60,A:45,B:30,C:20,D:10},
    },
    levels: [{label:'初級',min:0,max:30,score:1},{label:'中級',min:31,max:60,score:2},{label:'上級',min:61,max:999,score:3}],
  },
]

function getRank(test: any, value: number, ageGroup: string) {
  const r = test.ranks[ageGroup] || test.ranks['20代']
  if (value >= r.S) return {rank:'S',color:'#ffd60a'}
  if (value >= r.A) return {rank:'A',color:'#39ff14'}
  if (value >= r.B) return {rank:'B',color:'#00c8ff'}
  if (value >= r.C) return {rank:'C',color:'#ff8c00'}
  if (value >= r.D) return {rank:'D',color:'#ff6b9d'}
  return {rank:'F',color:'#ff4455'}
}

function getAgeGroup(age: number) {
  if (age < 20) return '10代'
  if (age < 30) return '20代'
  if (age < 40) return '30代'
  if (age < 50) return '40代'
  return '50代以上'
}

const rankColors: Record<string,string> = {S:'#ffd60a',A:'#39ff14',B:'#00c8ff',C:'#ff8c00',D:'#ff6b9d',F:'#ff4455'}

export default function FitnessTestPage() {
  const [step, setStep] = useState<'intro'|'test'|'result'>('intro')
  const [testIndex, setTestIndex] = useState(0)
  const [phase, setPhase] = useState<'ready'|'countdown'|'running'|'input'>('ready')
  const [timer, setTimer] = useState(0)
  const [countdown, setCountdown] = useState(5)
  const [countInput, setCountInput] = useState('')
  const [results, setResults] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [userAge, setUserAge] = useState(25)
  const intervalRef = useRef<any>(null)
  const router = useRouter()

  const currentTest = TESTS[testIndex]

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('age').eq('id', user.id).single()
      if (data?.age) setUserAge(data.age)
    }
    init()
    return () => clearInterval(intervalRef.current)
  }, [])

  const ageGroup = getAgeGroup(userAge)

  const getLevel = (test: any, value: number) =>
    test.levels.find((l: any) => value >= l.min && value <= l.max) || test.levels[0]

  const startCountdown = () => {
    setPhase('countdown')
    setCountdown(5)
    let c = 5
    intervalRef.current = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) {
        clearInterval(intervalRef.current)
        startTimer()
      }
    }, 1000)
  }

  const startTimer = () => {
    setPhase('running')
    setTimer(currentTest.type === 'count' ? currentTest.duration : 0)
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (currentTest.type === 'count') {
          if (t <= 1) { clearInterval(intervalRef.current); setPhase('input'); return 0 }
          return t - 1
        } else { return t + 1 }
      })
    }, 1000)
  }

  const stopTimer = () => { clearInterval(intervalRef.current); setPhase('input') }

  const submitResult = (value: number) => {
    const level = getLevel(currentTest, value)
    const rank = getRank(currentTest, value, ageGroup)
    setResults(r => ({ ...r, [currentTest.id]: { value, level, rank } }))
    setCountInput('')
    setPhase('ready')
    if (testIndex < TESTS.length - 1) { setTestIndex(i => i + 1) }
    else { setStep('result') }
  }

  const saveResults = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      localStorage.setItem('mt_fitness', JSON.stringify(results))
      await supabase.from('fitness_logs').insert({
        user_id: user.id,
        pushup_value: results.pushup?.value || 0,
        pushup_rank: results.pushup?.rank?.rank || 'F',
        situp_value: results.situp?.value || 0,
        situp_rank: results.situp?.rank?.rank || 'F',
        plank_value: results.plank?.value || 0,
        plank_rank: results.plank?.rank?.rank || 'F',
        total_score: Object.values(results).reduce((s, r) => s + (r.level?.score || 0), 0),
        age_group: ageGroup,
      })
      await supabase.from('training_logs').insert({
        user_id: user.id, menu_name: '体力テスト',
        menu_data: { results, ageGroup },
        user_type: '体力テスト実施', completed: true,
      })
      router.push('/menu')
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  // イントロ画面
  if (step === 'intro') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>
        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14',letterSpacing:2}}>MY TRAINER</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {[1,2,3,4,5].map(i=>(
              <div key={i} style={{width:i===5?24:8,height:4,borderRadius:4,background:i<=5?'#39ff14':'#2a2a36'}}/>
            ))}
          </div>
        </div>

        <div style={{padding:'32px 24px 0'}}>
          <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:8}}>STEP 5 / 5</div>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.3,marginBottom:8}}>
            体力テストで<br/>現在地を確認しよう
          </div>
          <div style={{fontSize:14,color:'#666',marginBottom:32}}>
            3種目の測定結果から{ageGroup}の<br/>基準でS〜Fランク判定します
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:32}}>
            {TESTS.map((t,i)=>(
              <div key={t.id} style={{
                background:'#1e1e26',borderRadius:16,padding:'18px 20px',
                border:'1px solid #2a2a36',
                display:'flex',alignItems:'center',gap:14,
              }}>
                <div style={{
                  width:52,height:52,borderRadius:14,
                  background:'#25252f',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:26,flexShrink:0,
                }}>
                  {t.emoji}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:t.color,marginBottom:2}}>{t.name}</div>
                  <div style={{fontSize:12,color:'#555'}}>{t.description}</div>
                </div>
                <div style={{fontSize:11,color:'#444',textAlign:'right'}}>
                  <div>S: {t.ranks[ageGroup]?.S||t.ranks['20代'].S}</div>
                  <div style={{color:'#333'}}>{t.type==='time'?'秒':'回'}〜</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={()=>setStep('test')}
            style={{
              width:'100%',padding:'18px',
              background:'linear-gradient(135deg,#39ff14,#00c8ff)',
              color:'#000',border:'none',borderRadius:16,
              fontSize:16,fontWeight:800,cursor:'pointer',
              boxShadow:'0 4px 20px rgba(57,255,20,0.2)',
              marginBottom:12,
            }}>
            テスト開始 →
          </button>

          <button onClick={()=>router.push('/menu')}
            style={{
              width:'100%',padding:'16px',
              background:'transparent',color:'#555',
              border:'1px solid #2a2a36',borderRadius:14,
              fontSize:13,cursor:'pointer',
            }}>
            スキップしてメニュー生成へ
          </button>
        </div>
      </div>
    </div>
  )

  // テスト画面
  if (step === 'test') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        <div style={{padding:'20px 24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{fontSize:12,color:'#555'}}>種目 {testIndex+1} / {TESTS.length}</div>
            <div style={{fontSize:12,color:currentTest.color,fontWeight:700}}>{currentTest.name}</div>
          </div>
          <div style={{background:'#2a2a36',borderRadius:8,height:6,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(testIndex/TESTS.length)*100}%`,background:currentTest.color,borderRadius:8,transition:'width 0.3s'}}/>
          </div>
        </div>

        <div style={{padding:'0 24px'}}>
          <div style={{
            background:'#1e1e26',borderRadius:24,padding:'32px 24px',
            border:`1px solid ${currentTest.color}33`,marginBottom:16,
          }}>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:56,marginBottom:12}}>{currentTest.emoji}</div>
              <div style={{fontSize:22,fontWeight:800,color:currentTest.color,marginBottom:4}}>{currentTest.name}</div>
              <div style={{fontSize:13,color:'#555',lineHeight:1.6}}>{currentTest.instruction}</div>
            </div>

            {/* 準備 */}
            {phase==='ready'&&(
              <div style={{textAlign:'center'}}>
                <div style={{
                  background:'#25252f',borderRadius:14,padding:'16px',marginBottom:20,
                }}>
                  <div style={{fontSize:12,color:'#555',marginBottom:8}}>ランク基準（{ageGroup}）</div>
                  <div style={{display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
                    {Object.entries(currentTest.ranks[ageGroup]||currentTest.ranks['20代']).map(([r,v])=>(
                      <div key={r} style={{textAlign:'center'}}>
                        <div style={{fontSize:16,fontWeight:800,color:rankColors[r]}}>{r}</div>
                        <div style={{fontSize:11,color:'#555'}}>{v as number}{currentTest.type==='time'?'秒':'回'}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={startCountdown}
                  style={{
                    width:'100%',padding:'18px',background:currentTest.color,
                    color:'#000',border:'none',borderRadius:14,
                    fontSize:16,fontWeight:800,cursor:'pointer',
                  }}>
                  スタート ▶
                </button>
              </div>
            )}

            {/* カウントダウン */}
            {phase==='countdown'&&(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:13,color:'#555',marginBottom:12}}>準備してください！</div>
                <div style={{
                  fontSize:112,fontWeight:800,lineHeight:1,
                  color:countdown<=3?'#ff4455':currentTest.color,
                  marginBottom:8,transition:'color 0.2s',
                }}>
                  {countdown}
                </div>
                <div style={{fontSize:14,color:'#555'}}>秒後にスタート</div>
              </div>
            )}

            {/* 計測中 */}
            {phase==='running'&&(
              <div style={{textAlign:'center'}}>
                <div style={{
                  fontSize:112,fontWeight:800,lineHeight:1,
                  color:currentTest.type==='count'&&timer<=3?'#ff4455':currentTest.color,
                  marginBottom:8,fontVariantNumeric:'tabular-nums',transition:'color 0.3s',
                }}>
                  {timer}
                </div>
                <div style={{fontSize:14,color:'#555',marginBottom:20}}>
                  {currentTest.type==='count'?'秒':'秒経過'}
                </div>
                {currentTest.type==='time'&&(
                  <button onClick={stopTimer}
                    style={{
                      width:'100%',padding:'18px',background:'#ff4455',
                      color:'#fff',border:'none',borderRadius:14,
                      fontSize:16,fontWeight:800,cursor:'pointer',
                    }}>
                    ストップ ■
                  </button>
                )}
                {currentTest.type==='count'&&(
                  <div style={{
                    background:'rgba(57,255,20,0.08)',borderRadius:12,
                    padding:'14px',border:'1px solid rgba(57,255,20,0.2)',
                    fontSize:14,color:'#39ff14',fontWeight:600,
                  }}>
                    全力で頑張ってください！
                  </div>
                )}
              </div>
            )}

            {/* 入力 */}
            {phase==='input'&&(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:20}}>
                  {currentTest.type==='count'?'何回できましたか？':`${timer}秒キープしました！`}
                </div>
                {currentTest.type==='count'?(
                  <div style={{marginBottom:16}}>
                    <input type="number" value={countInput}
                      onChange={e=>setCountInput(e.target.value)}
                      placeholder="回数を入力"
                      style={{
                        width:'100%',background:'#25252f',
                        border:`2px solid ${currentTest.color}`,
                        borderRadius:14,padding:'20px',
                        color:'#e8e8e8',fontSize:32,textAlign:'center',
                        outline:'none',fontWeight:800,
                      }}
                    />
                  </div>
                ):(
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:72,fontWeight:800,color:currentTest.color}}>{timer}</div>
                    <div style={{fontSize:14,color:'#555'}}>秒</div>
                  </div>
                )}

                {(countInput||currentTest.type==='time')&&(
                  <div style={{
                    background:'#25252f',borderRadius:14,padding:'16px',marginBottom:16,
                  }}>
                    {(()=>{
                      const val = currentTest.type==='time'?timer:Number(countInput)
                      const rank = getRank(currentTest,val,ageGroup)
                      const lv = getLevel(currentTest,val)
                      return (
                        <div>
                          <div style={{fontSize:36,fontWeight:800,color:rank.color,marginBottom:4}}>{rank.rank}ランク</div>
                          <div style={{fontSize:13,color:'#555'}}>{lv.label} · {ageGroup}基準</div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <button
                  onClick={()=>submitResult(currentTest.type==='time'?timer:Number(countInput))}
                  disabled={currentTest.type==='count'&&!countInput}
                  style={{
                    width:'100%',padding:'18px',background:currentTest.color,
                    color:'#000',border:'none',borderRadius:14,
                    fontSize:16,fontWeight:800,cursor:'pointer',
                    opacity:currentTest.type==='count'&&!countInput?0.3:1,
                  }}>
                  次へ →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // 結果画面
  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        <div style={{padding:'20px 24px 0'}}>
          <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,letterSpacing:2,marginBottom:8}}>RESULT</div>
          <div style={{fontSize:28,fontWeight:800,marginBottom:8}}>テスト完了！</div>
          <div style={{fontSize:14,color:'#666',marginBottom:24}}>{ageGroup}基準での結果です</div>

          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
            {TESTS.map(t=>{
              const r = results[t.id]
              if (!r) return null
              return (
                <div key={t.id} style={{
                  background:'#1e1e26',borderRadius:16,padding:'18px 20px',
                  border:'1px solid #2a2a36',
                  display:'flex',alignItems:'center',gap:14,
                }}>
                  <div style={{fontSize:32}}>{t.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:t.color,marginBottom:2}}>{t.name}</div>
                    <div style={{fontSize:12,color:'#555'}}>{r.level.label} · {ageGroup}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:36,fontWeight:800,color:r.rank.color}}>{r.rank.rank}</div>
                    <div style={{fontSize:15,fontWeight:700,color:t.color}}>{r.value}{t.type==='time'?'秒':'回'}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 総合判定 */}
          <div style={{
            background:'rgba(255,215,10,0.06)',borderRadius:20,padding:'24px',
            border:'1px solid rgba(255,215,10,0.15)',marginBottom:24,textAlign:'center',
          }}>
            <div style={{fontSize:12,color:'#ffd60a',fontWeight:700,letterSpacing:1,marginBottom:8}}>総合体力レベル</div>
            {(()=>{
              const total = Object.values(results).reduce((s:number,r:any)=>s+(r.level?.score||0),0)
              const ranks = Object.values(results).map((r:any)=>r.rank.rank)
              const avgRank = ranks.includes('S')?'S':ranks.includes('A')?'A':ranks.includes('B')?'B':ranks.includes('C')?'C':ranks.includes('D')?'D':'F'
              const level = total<=3?'初級':total<=6?'中級':'上級'
              return (
                <>
                  <div style={{fontSize:56,fontWeight:800,color:rankColors[avgRank],marginBottom:4}}>{avgRank}</div>
                  <div style={{fontSize:16,fontWeight:700,color:'#ffd60a'}}>{level}</div>
                  <div style={{fontSize:12,color:'#555',marginTop:4}}>{ageGroup}基準</div>
                </>
              )
            })()}
          </div>

          <button onClick={saveResults} disabled={saving}
            style={{
              width:'100%',padding:'18px',
              background:'linear-gradient(135deg,#39ff14,#00c8ff)',
              color:'#000',border:'none',borderRadius:16,
              fontSize:16,fontWeight:800,cursor:'pointer',
              opacity:saving?0.5:1,marginBottom:12,
              boxShadow:'0 4px 20px rgba(57,255,20,0.2)',
            }}>
            {saving?'保存中...':'メニュー生成へ →'}
          </button>

          <button onClick={()=>{setStep('intro');setTestIndex(0);setResults({});setPhase('ready')}}
            style={{
              width:'100%',padding:'16px',
              background:'transparent',color:'#555',
              border:'1px solid #2a2a36',borderRadius:14,
              fontSize:13,cursor:'pointer',
            }}>
            もう一度テストする
          </button>
        </div>
      </div>
    </div>
  )
}