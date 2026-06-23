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
    ranks: {
      '10代': {S:40,A:30,B:20,C:15,D:10},
      '20代': {S:45,A:35,B:25,C:18,D:12},
      '30代': {S:40,A:30,B:20,C:15,D:10},
      '40代': {S:35,A:25,B:15,C:10,D:7},
      '50代以上': {S:25,A:18,B:12,C:8,D:5},
    },
    levels: [
      {label:'初級',min:0,max:10,score:1},
      {label:'中級',min:11,max:25,score:2},
      {label:'上級',min:26,max:999,score:3},
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
    ranks: {
      '10代': {S:50,A:40,B:30,C:20,D:15},
      '20代': {S:55,A:45,B:35,C:25,D:18},
      '30代': {S:50,A:40,B:30,C:20,D:15},
      '40代': {S:40,A:30,B:22,C:15,D:10},
      '50代以上': {S:30,A:22,B:15,C:10,D:7},
    },
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
    instruction: '肘をついて体をまっすぐに保ってください',
    ranks: {
      '10代': {S:120,A:90,B:60,C:40,D:20},
      '20代': {S:150,A:120,B:90,C:60,D:30},
      '30代': {S:120,A:90,B:60,C:45,D:25},
      '40代': {S:90,A:70,B:50,C:35,D:20},
      '50代以上': {S:60,A:45,B:30,C:20,D:10},
    },
    levels: [
      {label:'初級',min:0,max:30,score:1},
      {label:'中級',min:31,max:60,score:2},
      {label:'上級',min:61,max:999,score:3},
    ]
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

let audioCtx: any = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioCtx
}
function playBeep(freq: number = 440, duration: number = 200) {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration/1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration/1000)
  } catch(e) {}
}

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
  }, [])

  const ageGroup = getAgeGroup(userAge)

  const getLevel = (test: any, value: number) => {
    return test.levels.find((l: any) => value >= l.min && value <= l.max) || test.levels[0]
  }

  const startCountdown = () => {
    setPhase('countdown')
    setCountdown(5)
    let c = 5
    intervalRef.current = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 3 && c > 0) playBeep(440, 200)
      if (c <= 0) {
        clearInterval(intervalRef.current)
        playBeep(880, 400)
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
          if (t <= 4 && t > 1) playBeep(440, 150)
          if (t <= 1) {
            clearInterval(intervalRef.current)
            playBeep(220, 600)
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
    playBeep(660, 300)
    setPhase('input')
  }

  const submitResult = (value: number) => {
    const level = getLevel(currentTest, value)
    const rank = getRank(currentTest, value, ageGroup)
    setResults(r => ({ ...r, [currentTest.id]: { value, level, rank } }))
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      localStorage.setItem('mt_fitness', JSON.stringify(results))
      await supabase.from('training_logs').insert({
        user_id: user.id,
        menu_name: '体力テスト',
        menu_data: { results, ageGroup },
        user_type: '体力テスト実施',
        completed: true,
      })
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

  useEffect(() => { return () => clearInterval(intervalRef.current) }, [])

  const rankColors: Record<string,string> = {S:'#ffd60a',A:'#39ff14',B:'#00c8ff',C:'#ff8c00',D:'#ff6b9d',F:'#ff4455'}

  // イントロ
  if (step === 'intro') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'20px 16px'}}>
        <div style={{padding:'14px 0 12px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer'}}>←</button>
          <span style={{fontSize:11,fontWeight:800,color:'#00c8ff',letterSpacing:3}}>体力テスト</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'#666'}}>{ageGroup}</span>
        </div>
        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36',marginBottom:16}}>
          <div style={{fontSize:32,textAlign:'center',marginBottom:12}}>💪</div>
          <div style={{fontSize:18,fontWeight:800,textAlign:'center',marginBottom:8}}>体力テストを始めます</div>
          <p style={{fontSize:13,color:'#666',lineHeight:1.7,marginBottom:16,textAlign:'center'}}>
            3種目であなたの体力を測定します。<br/>
            {ageGroup}の基準でS〜Fランク判定します。
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            {TESTS.map((t,i)=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',background:'#25252f',borderRadius:10}}>
                <span style={{fontSize:24}}>{t.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:t.color}}>{t.name}</div>
                  <div style={{fontSize:11,color:'#666'}}>{t.description}</div>
                </div>
                <div style={{fontSize:10,color:'#666'}}>
                  S:{t.ranks[ageGroup]?.S || t.ranks['20代'].S}{t.type==='time'?'秒':'回'}〜
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

        <div style={{padding:'14px 0 12px',borderBottom:'1px solid #2a2a36',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:800,color:currentTest.color}}>{testIndex+1}/{TESTS.length}</span>
            <span style={{fontSize:11,color:'#666'}}>{currentTest.name}</span>
          </div>
          <div style={{background:'#2a2a36',borderRadius:4,height:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(testIndex/TESTS.length)*100}%`,background:currentTest.color}}/>
          </div>
        </div>

        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:`1px solid ${currentTest.color}44`}}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:64,marginBottom:8}}>{currentTest.emoji}</div>
            <div style={{fontSize:22,fontWeight:800,color:currentTest.color,marginBottom:4}}>{currentTest.name}</div>
            <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>{currentTest.instruction}</div>
          </div>

          {/* 準備 */}
          {phase==='ready'&&(
            <div style={{textAlign:'center'}}>
              <div style={{padding:'12px',background:'#25252f',borderRadius:10,marginBottom:16}}>
                <div style={{fontSize:11,color:'#666',marginBottom:4}}>ランク基準（{ageGroup}）</div>
                <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
                  {Object.entries(currentTest.ranks[ageGroup]||currentTest.ranks['20代']).map(([r,v])=>(
                    <span key={r} style={{fontSize:11,color:rankColors[r],fontWeight:700}}>{r}:{v}{currentTest.type==='time'?'秒':'回'}</span>
                  ))}
                </div>
              </div>
              <button onClick={startCountdown}
                style={{width:'100%',padding:'16px',background:currentTest.color,color:'#000',border:'none',borderRadius:12,fontSize:16,fontWeight:800,cursor:'pointer'}}>
                スタート ▶
              </button>
            </div>
          )}

          {/* カウントダウン */}
          {phase==='countdown'&&(
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:12,color:'#666',marginBottom:8}}>準備してください！</div>
              <div style={{fontSize:120,fontWeight:800,color:countdown<=3?'#ff4455':currentTest.color,lineHeight:1,marginBottom:8,transition:'all 0.2s'}}>
                {countdown}
              </div>
              <div style={{fontSize:14,color:'#666'}}>秒後にスタート</div>
            </div>
          )}

          {/* 計測中 */}
          {phase==='running'&&(
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:90,fontWeight:800,color:
                currentTest.type==='count'&&timer<=3?'#ff4455':currentTest.color,
                marginBottom:8,fontVariantNumeric:'tabular-nums',transition:'color 0.3s'}}>
                {timer}
              </div>
              <div style={{fontSize:12,color:'#666',marginBottom:20}}>
                {currentTest.type==='count'?'秒':'秒経過'}
              </div>
              {currentTest.type==='time'&&(
                <button onClick={stopTimer}
                  style={{width:'100%',padding:'16px',background:'#ff4455',color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:800,cursor:'pointer'}}>
                  ストップ ■
                </button>
              )}
              {currentTest.type==='count'&&(
                <div style={{padding:'12px',background:'rgba(57,255,20,0.1)',borderRadius:10,border:'1px solid #1a6600',fontSize:13,color:'#39ff14'}}>
                  全力で頑張ってください！
                </div>
              )}
            </div>
          )}

          {/* 入力 */}
          {phase==='input'&&(
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>
                {currentTest.type==='count'?'何回できましたか？':`${timer}秒キープ！`}
              </div>
              {currentTest.type==='count'?(
                <div style={{marginBottom:12}}>
                  <input type="number" value={countInput}
                    onChange={e=>setCountInput(e.target.value)}
                    placeholder="回数を入力"
                    style={{width:'100%',background:'#25252f',border:`2px solid ${currentTest.color}`,borderRadius:12,padding:'16px',color:'#e8e8e8',fontSize:28,textAlign:'center',outline:'none',fontWeight:800}}
                  />
                </div>
              ):(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:72,fontWeight:800,color:currentTest.color}}>{timer}</div>
                  <div style={{fontSize:14,color:'#666'}}>秒</div>
                </div>
              )}

              {/* ランク予測 */}
              {(countInput||currentTest.type==='time')&&(
                <div style={{marginBottom:12,padding:'12px',background:'#25252f',borderRadius:10}}>
                  {(()=>{
                    const val = currentTest.type==='time'?timer:Number(countInput)
                    const rank = getRank(currentTest,val,ageGroup)
                    const lv = getLevel(currentTest,val)
                    return (
                      <div>
                        <div style={{fontSize:24,fontWeight:800,color:rank.color,marginBottom:4}}>{rank.rank}ランク</div>
                        <div style={{fontSize:12,color:'#666'}}>{lv.label} · {ageGroup}基準</div>
                      </div>
                    )
                  })()}
                </div>
              )}

              <button onClick={()=>submitResult(currentTest.type==='time'?timer:Number(countInput))}
                disabled={currentTest.type==='count'&&!countInput}
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
          <span style={{marginLeft:8,fontSize:11,color:'#666'}}>{ageGroup}基準</span>
        </div>

        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36',marginBottom:16}}>
          <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,letterSpacing:1,marginBottom:16}}>種目別結果</div>
          {TESTS.map(t=>{
            const r = results[t.id]
            if (!r) return null
            return (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid #2a2a36'}}>
                <span style={{fontSize:28}}>{t.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:2}}>{t.name}</div>
                  <div style={{fontSize:11,color:'#666'}}>{r.level.label}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:32,fontWeight:800,color:r.rank.color}}>{r.rank.rank}</div>
                  <div style={{fontSize:14,fontWeight:700,color:t.color}}>{r.value}{t.type==='time'?'秒':'回'}</div>
                </div>
              </div>
            )
          })}

          {/* 総合判定 */}
          <div style={{marginTop:16,padding:'16px',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,marginBottom:4}}>総合体力レベル</div>
            {(()=>{
              const total = Object.values(results).reduce((sum: number, r: any) => sum+(r.level?.score||0), 0)
              const ranks = Object.values(results).map((r: any) => r.rank.rank)
              const avgRank = ranks.includes('S')?'S':ranks.includes('A')?'A':ranks.includes('B')?'B':ranks.includes('C')?'C':ranks.includes('D')?'D':'F'
              const level = total<=3?'初級':total<=6?'中級':'上級'
              return (
                <div>
                  <div style={{fontSize:48,fontWeight:800,color:rankColors[avgRank]}}>{avgRank}</div>
                  <div style={{fontSize:14,color:'#ffd60a',fontWeight:700}}>{level}</div>
                  <div style={{fontSize:11,color:'#666',marginTop:4}}>{ageGroup}基準</div>
                </div>
              )
            })()}
          </div>
        </div>

        <button onClick={saveResults} disabled={saving}
          style={{width:'100%',padding:'16px',background:'#39ff14',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',opacity:saving?0.5:1,marginBottom:10}}>
          {saving?'保存中...':'メニュー生成へ →'}
        </button>

        <button onClick={()=>{setStep('intro');setTestIndex(0);setResults({});setPhase('ready')}}
          style={{width:'100%',padding:'13px',background:'transparent',color:'#666',border:'1px solid #2a2a36',borderRadius:12,fontSize:13,cursor:'pointer'}}>
          もう一度テストする
        </button>
      </div>
    </div>
  )
}