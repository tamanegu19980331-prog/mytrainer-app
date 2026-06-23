'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TESTS = [
  {
    id: 'pushup',
    name: '腕立て伏せ',
    emoji: '💪',
    color: '#39ff14',
    type: 'count',
    duration: 60,
    description: '60秒間で何回できるか計測します',
    instruction: '肩幅より少し広めに手をつき、胸が床につくまで下げてください',
    levels: [
      {label:'初級',min:0,max:10,score:1},
      {label:'中級',min:11,max:20,score:2},
      {label:'上級',min:21,max:999,score:3},
    ]
  },
  {
    id: 'situp',
    name: '腹筋（クランチ）',
    emoji: '🔥',
    color: '#ff6b9d',
    type: 'count',
    duration: 60,
    description: '60秒間で何回できるか計測します',
    instruction: '膝を曲げて仰向けになり、肩甲骨が床から離れるまで上体を起こしてください',
    levels: [
      {label:'初級',min:0,max:15,score:1},
      {label:'中級',min:16,max:30,score:2},
      {label:'上級',min:31,max:999,score:3},
    ]
  },
  {
    id: 'plank',
    name: 'プランク',
    emoji: '⏱',
    color: '#00c8ff',
    type: 'time',
    duration: 0,
    description: 'キープできた秒数を計測します',
    instruction: '肘をついて体をまっすぐに保ってください。お尻が上がったり下がったりしないように注意',
    levels: [
      {label:'初級',min:0,max:30,score:1},
      {label:'中級',min:31,max:60,score:2},
      {label:'上級',min:61,max:999,score:3},
    ]
  },
]

export default function FitnessTestPage() {
  const [step, setStep] = useState<'intro'|'test'|'result'>('intro')
  const [testIndex, setTestIndex] = useState(0)
  const [phase, setPhase] = useState<'ready'|'running'|'input'>('ready')
  const [timer, setTimer] = useState(0)
  const [countInput, setCountInput] = useState('')
  const [results, setResults] = useState<Record<string, {value:number, level:any}>>({})
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef<any>(null)
  const router = useRouter()

  const currentTest = TESTS[testIndex]

  const getLevel = (test: any, value: number) => {
    return test.levels.find((l: any) => value >= l.min && value <= l.max) || test.levels[0]
  }

  const startTimer = () => {
    setPhase('running')
    setTimer(currentTest.type === 'count' ? currentTest.duration : 0)
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (currentTest.type === 'count') {
          if (t <= 1) {
            clearInterval(intervalRef.current)
            setPhase('input')
            return 0
          }
          return t - 1
        } else {
          return t + 1
        }
      })
    }, 1000)
  }

  const stopTimer = () => {
    clearInterval(intervalRef.current)
    setPhase('input')
  }

  const submitResult = () => {
    const value = Number(countInput)
    if (!value && value !== 0) return
    const level = getLevel(currentTest, value)
    setResults(r => ({ ...r, [currentTest.id]: { value, level } }))
    setCountInput('')
    setPhase('ready')

    if (testIndex < TESTS.length - 1) {
      setTestIndex(i => i + 1)
    } else {
      setStep('result')
    }
  }

  const saveResults = async () => {
    setSaving(true)
    try {
      // localStorageに体力テスト結果を保存
      localStorage.setItem('mt_fitness', JSON.stringify(results))
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // fitness_testテーブルに保存
      await supabase.from('training_logs').insert({
        user_id: user.id,
        menu_name: '体力テスト',
        menu_data: results,
        user_type: '体力テスト実施',
        completed: true,
      })

      // usersテーブルのuser_typeを更新
      const totalScore = Object.values(results).reduce((sum: number, r: any) => sum + (r.level?.score || 0), 0)
      const fitnessLevel = totalScore <= 3 ? '初級' : totalScore <= 6 ? '中級' : '上級'
      await supabase.from('users').update({ user_type: fitnessLevel + '者' }).eq('id', user.id)

      router.push('/menu')
    } catch(e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  // イントロ画面
  if (step === 'intro') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'20px 16px'}}>
        <div style={{padding:'14px 0 12px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <button onClick={()=>router.push('/goal')} style={{background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer'}}>←</button>
          <span style={{fontSize:11,fontWeight:800,color:'#00c8ff',letterSpacing:3}}>体力テスト</span>
        </div>

        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36',marginBottom:16}}>
          <div style={{fontSize:32,textAlign:'center',marginBottom:12}}>💪</div>
          <div style={{fontSize:18,fontWeight:800,textAlign:'center',marginBottom:8}}>体力テストを始めます</div>
          <p style={{fontSize:13,color:'#666',lineHeight:1.7,marginBottom:16,textAlign:'center'}}>
            3つの種目であなたの現在の体力を測定します。<br/>
            結果に応じて最適なメニューを提案します。
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            {TESTS.map((t,i)=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',background:'#25252f',borderRadius:10}}>
                <span style={{fontSize:24}}>{t.emoji}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:t.color}}>{t.name}</div>
                  <div style={{fontSize:11,color:'#666'}}>{t.description}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={()=>setStep('test')}
            style={{width:'100%',padding:'14px',background:'#00c8ff',color:'#000',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer'}}>
            テスト開始 →
          </button>
        </div>
      </div>
    </div>
  )

  // テスト画面
  if (step === 'test') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'20px 16px'}}>

        {/* 進捗 */}
        <div style={{padding:'14px 0 12px',borderBottom:'1px solid #2a2a36',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:800,color:currentTest.color,letterSpacing:2}}>{testIndex+1}/{TESTS.length}</span>
            <span style={{fontSize:11,color:'#666'}}>{currentTest.name}</span>
          </div>
          <div style={{background:'#2a2a36',borderRadius:4,height:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${((testIndex)/TESTS.length)*100}%`,background:currentTest.color}}/>
          </div>
        </div>

        {/* テストカード */}
        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:`1px solid ${currentTest.color}44`}}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:64,marginBottom:8}}>{currentTest.emoji}</div>
            <div style={{fontSize:22,fontWeight:800,color:currentTest.color,marginBottom:4}}>{currentTest.name}</div>
            <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>{currentTest.instruction}</div>
          </div>

          {/* 準備フェーズ */}
          {phase === 'ready' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:13,color:'#666',marginBottom:16}}>
                {currentTest.type==='count' ? `${currentTest.duration}秒間計測します` : 'タイマーで計測します'}
              </div>
              <button onClick={startTimer}
                style={{width:'100%',padding:'16px',background:currentTest.color,color:'#000',border:'none',borderRadius:12,fontSize:16,fontWeight:800,cursor:'pointer'}}>
                スタート ▶
              </button>
            </div>
          )}

          {/* 計測中フェーズ */}
          {phase === 'running' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:80,fontWeight:800,color:currentTest.color,marginBottom:8,fontVariantNumeric:'tabular-nums'}}>
                {timer}
              </div>
              <div style={{fontSize:12,color:'#666',marginBottom:20}}>
                {currentTest.type==='count' ? '秒' : '秒経過'}
              </div>
              {currentTest.type === 'time' && (
                <button onClick={stopTimer}
                  style={{width:'100%',padding:'16px',background:'#ff4455',color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:800,cursor:'pointer'}}>
                  ストップ ■
                </button>
              )}
              {currentTest.type === 'count' && (
                <div style={{padding:'12px',background:'rgba(57,255,20,0.1)',borderRadius:10,border:'1px solid #1a6600',fontSize:13,color:'#39ff14'}}>
                  全力で頑張ってください！
                </div>
              )}
            </div>
          )}

          {/* 入力フェーズ */}
          {phase === 'input' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>
                {currentTest.type==='count' ? '何回できましたか？' : `${timer}秒キープしました！`}
              </div>
              {currentTest.type === 'count' ? (
                <div style={{marginBottom:16}}>
                  <input type="number" value={countInput} onChange={e=>setCountInput(e.target.value)}
                    placeholder="回数を入力"
                    style={{width:'100%',background:'#25252f',border:`2px solid ${currentTest.color}`,borderRadius:12,padding:'16px',color:'#e8e8e8',fontSize:24,textAlign:'center',outline:'none',fontWeight:800}}
                  />
                </div>
              ) : (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:64,fontWeight:800,color:currentTest.color}}>{timer}</div>
                  <div style={{fontSize:14,color:'#666'}}>秒</div>
                </div>
              )}

              {/* レベル予測 */}
              {(countInput || currentTest.type==='time') && (
                <div style={{marginBottom:12,padding:'10px',background:'#25252f',borderRadius:10}}>
                  {(() => {
                    const val = currentTest.type==='time' ? timer : Number(countInput)
                    const lv = getLevel(currentTest, val)
                    return (
                      <div style={{fontSize:13,color:currentTest.color,fontWeight:700}}>
                        判定: {lv.label}
                      </div>
                    )
                  })()}
                </div>
              )}

              <button onClick={()=>{
                if (currentTest.type === 'time') {
                  setCountInput(String(timer))
                  const value = timer
                  const level = getLevel(currentTest, value)
                  setResults(r => ({ ...r, [currentTest.id]: { value, level } }))
                  setCountInput('')
                  setPhase('ready')
                  if (testIndex < TESTS.length - 1) {
                    setTestIndex(i => i + 1)
                  } else {
                    setStep('result')
                  }
                } else {
                  submitResult()
                }
              }}
                disabled={currentTest.type==='count' && !countInput}
                style={{width:'100%',padding:'14px',background:currentTest.color,color:'#000',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer',opacity:currentTest.type==='count'&&!countInput?0.3:1}}>
                次へ →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // 結果画面
  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'20px 16px'}}>
        <div style={{padding:'14px 0 12px',borderBottom:'1px solid #2a2a36',marginBottom:16}}>
          <span style={{fontSize:11,fontWeight:800,color:'#ffd60a',letterSpacing:3}}>テスト結果</span>
        </div>

        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36',marginBottom:16}}>
          <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,letterSpacing:1,marginBottom:16}}>体力テスト結果</div>
          {TESTS.map(t=>{
            const r = results[t.id]
            if (!r) return null
            return (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #2a2a36'}}>
                <span style={{fontSize:24}}>{t.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:t.color}}>{t.name}</div>
                  <div style={{fontSize:11,color:'#666'}}>{r.level.label}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:20,fontWeight:800,color:t.color}}>
                    {r.value}{t.type==='time'?'秒':'回'}
                  </div>
                </div>
              </div>
            )
          })}

          {/* 総合判定 */}
          <div style={{marginTop:16,padding:'14px',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,marginBottom:4}}>総合体力レベル</div>
            <div style={{fontSize:24,fontWeight:800,color:'#ffd60a'}}>
              {(() => {
                const total = Object.values(results).reduce((sum: number, r: any) => sum + (r.level?.score || 0), 0)
                return total <= 3 ? '初級' : total <= 6 ? '中級' : '上級'
              })()}
            </div>
          </div>
        </div>

        <button onClick={saveResults} disabled={saving}
          style={{width:'100%',padding:'16px',background:'#39ff14',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',opacity:saving?0.5:1,marginBottom:10}}>
          {saving ? '保存中...' : '診断に進む →'}
        </button>

        <button onClick={()=>{setStep('intro');setTestIndex(0);setResults({});setPhase('ready')}}
          style={{width:'100%',padding:'13px',background:'transparent',color:'#666',border:'1px solid #2a2a36',borderRadius:12,fontSize:13,cursor:'pointer'}}>
          もう一度テストする
        </button>
      </div>
    </div>
  )
}