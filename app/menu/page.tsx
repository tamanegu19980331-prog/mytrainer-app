'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

const NO_TUT_KEYWORDS = ['プランク','キープ','ホールド','ストレッチ','ドローイン','ウォールシット','ジャンプ','ステップ','ハイニー','クラムシェル','レッグレイズ','バードドッグ','キャット','ウォーク','ジョグ','マーチ','タオル','チン']

const shouldShowTut = (name: string) => !NO_TUT_KEYWORDS.some(k => name.includes(k))

const isBothSidesReps = (reps: string) =>
  reps?.includes('両側') || reps?.includes('両手') || reps?.includes('左右')

function calcTutSec(ex: any, tutTempo: string): number {
    const repsText = ex.reps || ''
    const bothSides = isBothSidesReps(repsText)
  
    // ① 秒指定の種目（TUT不要）両側は2倍
    if (repsText.includes('秒')) {
      const base = ex.durationSec || 30
      return bothSides ? base * 2 : base
    }
  
    // ② 回数指定でTUT必要な種目
    const repsNum = parseInt(repsText) || 0
    if (shouldShowTut(ex.name) && tutTempo && repsNum > 0) {
      const nums = tutTempo.match(/\d+/g)?.map(Number) || []
      const secPerRep = nums.reduce((a, b) => a + b, 0)
      if (secPerRep > 0) {
        const multiplier = bothSides ? 2 : 1
        return Math.max(secPerRep * repsNum * multiplier, ex.durationSec || 30)
      }
    }
  
    // ③ TUT不要・回数指定（バードドッグ等）両側は2倍
    const base = ex.durationSec || 30
    return bothSides ? base * 2 : base
  }

export default function MenuPage() {
  const [status, setStatus] = useState<'loading'|'done'|'error'>('loading')
  const [menu, setMenu] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'view'|'training'>('view')
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [phase, setPhase] = useState<'countdown'|'exercise'|'rest'|'done'>('countdown')
  const [timer, setTimer] = useState(5)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState(false)
  const [expGained, setExpGained] = useState(0)
  const [levelUp, setLevelUp] = useState<any>(null)
  const [newStreak, setNewStreak] = useState(0)
  const intervalRef = useRef<any>(null)
  const menuRef = useRef<any>(null)
  const exercisesRef = useRef<any[]>([])
  const router = useRouter()

  const steps = [
    '📅 データを分析中...',
    '💪 体力レベルを判定中...',
    '🤖 最適メニューを生成中...',
    '✅ 完了！',
  ]

  useEffect(() => { generateMenu() }, [])

  useEffect(() => {
    if (status !== 'loading') return
    const iv = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1))
    }, 1200)
    return () => clearInterval(iv)
  }, [status])

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  const generateMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const diag    = JSON.parse(localStorage.getItem('mt_diag')    || '{}')
      const goal    = localStorage.getItem('mt_goal')    || ''
      const posture = JSON.parse(localStorage.getItem('mt_posture') || '[]')
      const fitness = JSON.parse(localStorage.getItem('mt_fitness') || '{}')
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, diag, goal, posture, fitness }),
      })
      const data = await res.json()
      menuRef.current = data
      setMenu(data)
      setStatus('done')
      await supabase.from('diagnosis_logs').insert({
        user_id: user.id, goal, posture, answers: diag,
        user_type: data.userType || '', type_reason: data.typeReason || '',
      })
      await supabase.from('training_logs').insert({
        user_id: user.id, menu_id: data.menuId || null,
        menu_name: data.theme, menu_data: data,
        user_type: data.userType || '', completed: false,
      })
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  const getAllExercises = (m: any) => [
    ...(m?.exercises?.filter((ex: any) => !ex.isSeparator) || []),
    ...(m?.postureExercises || []),
  ]

  const allExercises = getAllExercises(menu)

  const toggleCheck = (key: string) => {
    setChecked(c => ({ ...c, [key]: !c[key] }))
  }

  const allChecked = allExercises.length > 0 &&
    allExercises.every((_: any, i: number) => checked[i])

  const startTraining = () => {
    const exercises = getAllExercises(menuRef.current)
    exercisesRef.current = exercises
    const firstUnchecked = exercises.findIndex((_: any, i: number) => !checked[i])
    const startIdx = firstUnchecked >= 0 ? firstUnchecked : 0
    setMode('training')
    setCurrentExIdx(startIdx)
    setCurrentSet(1)
    setPhase('countdown')
    startCountdown(5, startIdx)
  }

  const startCountdown = (sec: number, exIdx: number) => {
    clearInterval(intervalRef.current)
    setTimer(sec)
    let t = sec
    intervalRef.current = setInterval(() => {
      t--
      setTimer(t)
      if (t <= 0) {
        clearInterval(intervalRef.current)
        setPhase('exercise')
        startExerciseTimer(exIdx)
      }
    }, 1000)
  }

  const startExerciseTimer = (exIdx: number) => {
    const ex = exercisesRef.current[exIdx]
    if (!ex) return
    const tutTempo = menuRef.current?.tutTempo || ''
    const sec = calcTutSec(ex, tutTempo)
    setTimer(sec)
    let t = sec
    intervalRef.current = setInterval(() => {
      t--
      setTimer(t)
      if (t <= 0) {
        clearInterval(intervalRef.current)
        setPhase('rest')
        startRestTimer(exIdx)
      }
    }, 1000)
  }

  const startRestTimer = (exIdx: number) => {
    const ex = exercisesRef.current[exIdx]
    const restSec = ex?.restSec || 60
    setTimer(restSec)
    let t = restSec
    intervalRef.current = setInterval(() => {
      t--
      setTimer(t)
      if (t <= 0) {
        clearInterval(intervalRef.current)
        nextSet(exIdx)
      }
    }, 1000)
  }

  const nextSet = (exIdx: number) => {
    const ex = exercisesRef.current[exIdx]
    const totalSets = ex?.sets || 3
    setCurrentSet(s => {
      const next = s + 1
      if (next <= totalSets) {
        setPhase('exercise')
        startExerciseTimer(exIdx)
        return next
      } else {
        const nextIdx = exIdx + 1
        if (nextIdx < exercisesRef.current.length) {
          setCurrentExIdx(nextIdx)
          setPhase('countdown')
          startCountdown(5, nextIdx)
          return 1
        } else {
          setPhase('done')
          clearInterval(intervalRef.current)
          const newChecked: Record<string, boolean> = {}
          exercisesRef.current.forEach((_: any, i: number) => { newChecked[i] = true })
          setChecked(newChecked)
          return s
        }
      }
    })
  }

  const skipRest = () => {
    clearInterval(intervalRef.current)
    nextSet(currentExIdx)
  }

  const completeTraining = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const exercises = getAllExercises(menuRef.current)
      const m = menuRef.current
      const baseExp = m.level === '上級' ? 60 : m.level === '中級' ? 40 : 25
      const bonusExp = exercises.length * 5
      const totalExp = baseExp + bonusExp
      setExpGained(totalExp)
      const { data: profile } = await supabase
        .from('users').select('exp, level, streak, best_streak, last_trained').eq('id', user.id).single()
      const currentExp = profile?.exp || 0
      const newExp = currentExp + totalExp
      const oldLv = getLevel(currentExp)
      const newLv = getLevel(newExp)
      if (newLv.lv > oldLv.lv) setLevelUp(newLv)
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const lastTrained = profile?.last_trained
      let streak = 1
      if (lastTrained === yesterday) streak = (profile?.streak || 0) + 1
      else if (lastTrained === today) streak = profile?.streak || 1
      const bestStreak = Math.max(streak, profile?.best_streak || 0)
      setNewStreak(streak)
      await supabase.from('users').update({
        exp: newExp, level: newLv.lv,
        streak, best_streak: bestStreak, last_trained: today,
      }).eq('id', user.id)
      await supabase.from('training_logs')
        .update({ completed: true })
        .eq('user_id', user.id)
        .eq('menu_name', m.theme)
        .eq('completed', false)
      const exerciseData = exercises.map((ex: any) => ({
        user_id: user.id,
        menu_name: m.theme,
        exercise_name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || '',
        duration_sec: ex.durationSec || 0,
        completed: true,
      }))
      if (exerciseData.length > 0) {
        await supabase.from('exercise_logs').insert(exerciseData)
      }
      setCompleted(true)
    } catch(e) { console.error(e) }
  }

  if (status === 'loading') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontSize:50,marginBottom:16}}>⚡</div>
        <div style={{fontSize:15,fontWeight:800,color:'#39ff14',marginBottom:20}}>メニューを生成中...</div>
        {steps.map((s,i)=>(
          <div key={i} style={{width:'100%',padding:'9px 14px',background:i<=step?'#1e1e26':'#25252f',border:'1px solid '+(i===step?'#39ff14':'#2a2a36'),borderRadius:9,fontSize:12,color:i<step?'#39ff14':i===step?'#e8e8e8':'#666',marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
            <span>{i<step?'✓':i===step?'⚡':'○'}</span>{s}
          </div>
        ))}
      </div>
    </div>
  )

  if (status === 'error') return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'0 20px'}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <div style={{color:'#ff4455',fontWeight:700,marginBottom:16}}>生成に失敗しました</div>
        <button onClick={generateMenu} style={{padding:'14px 24px',background:'#39ff14',color:'#000',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer'}}>再試行する</button>
      </div>
    </div>
  )

  if (!menu) return null

  const normalExercises = menu.exercises?.filter((ex: any) => !ex.isSeparator) || []
  const postureExercises = menu.postureExercises || []
  let exerciseIndex = 0

  if (levelUp) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'0 20px'}}>
        <div style={{fontSize:80,marginBottom:16}}>🎉</div>
        <div style={{fontSize:28,fontWeight:800,color:'#ffd60a',marginBottom:8}}>LEVEL UP!</div>
        <div style={{fontSize:20,fontWeight:800,color:'#e8e8e8',marginBottom:4}}>Lv.{levelUp.lv} {levelUp.title}</div>
        <div style={{fontSize:14,color:'#666',marginBottom:32}}>おめでとうございます！</div>
        <button onClick={()=>router.push('/dashboard')}
          style={{padding:'16px 32px',background:'#ffd60a',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer'}}>
          ダッシュボードへ →
        </button>
      </div>
    </div>
  )

  if (completed) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'0 20px',maxWidth:400}}>
        <div style={{fontSize:64,marginBottom:16}}>💪</div>
        <div style={{fontSize:24,fontWeight:800,color:'#39ff14',marginBottom:8}}>トレーニング完了！</div>
        <div style={{fontSize:16,color:'#ffd60a',fontWeight:800,marginBottom:4}}>+{expGained} EXP獲得！</div>
        {newStreak>1&&<div style={{fontSize:14,color:'#ff8c00',fontWeight:700,marginBottom:4}}>🔥 {newStreak}日連続！</div>}
        <div style={{fontSize:13,color:'#666',marginBottom:32}}>お疲れ様でした！</div>
        <button onClick={()=>router.push('/dashboard')}
          style={{width:'100%',padding:'16px',background:'#39ff14',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer'}}>
          ダッシュボードへ →
        </button>
      </div>
    </div>
  )

  // トレーニングモード
  if (mode === 'training') {
    const currentEx = allExercises[currentExIdx]
    const currentTutSec = currentEx ? calcTutSec(currentEx, menu?.tutTempo || '') : 30
    const currentBothSides = isBothSidesReps(currentEx?.reps || '')
    const currentShowTut = shouldShowTut(currentEx?.name || '')

    if (phase === 'done') return (
      <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center',padding:'0 20px'}}>
          <div style={{fontSize:64,marginBottom:16}}>🏆</div>
          <div style={{fontSize:24,fontWeight:800,color:'#39ff14',marginBottom:8}}>全種目完了！</div>
          <div style={{fontSize:13,color:'#666',marginBottom:24}}>素晴らしい！EXPを獲得しましょう</div>
          <button onClick={completeTraining}
            style={{width:'100%',padding:'16px',background:'#39ff14',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',marginBottom:10}}>
            ✅ EXPを獲得する
          </button>
          <button onClick={()=>setMode('view')}
            style={{width:'100%',padding:'13px',background:'transparent',color:'#666',border:'1px solid #2a2a36',borderRadius:12,fontSize:13,cursor:'pointer'}}>
            メニューに戻る
          </button>
        </div>
      </div>
    )

    return (
      <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
        <div style={{maxWidth:480,margin:'0 auto',padding:'20px 16px'}}>
          <div style={{marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#666',marginBottom:6}}>
              <span>{currentExIdx+1}/{allExercises.length} 種目</span>
              <span>{currentSet}/{currentEx?.sets||3} セット</span>
            </div>
            <div style={{background:'#2a2a36',borderRadius:8,height:6,overflow:'hidden'}}>
              <div style={{height:'100%',background:'#39ff14',borderRadius:8,transition:'width 0.3s',
                width:`${((currentExIdx*3+currentSet-1)/(allExercises.length*3))*100}%`}}/>
            </div>
          </div>

          <div style={{background:'#1e1e26',borderRadius:16,padding:'24px',border:'1px solid #2a2a36',marginBottom:16,textAlign:'center'}}>
            {phase==='countdown'&&(
              <>
                <div style={{fontSize:13,color:'#666',marginBottom:8}}>次の種目まで</div>
                <div style={{fontSize:28,fontWeight:800,color:'#39ff14',marginBottom:4}}>{currentEx?.name}</div>
                <div style={{fontSize:13,color:'#ffd60a',marginBottom:4}}>{currentEx?.reps}</div>
                {currentShowTut&&menu.tutTempo&&(
                  <div style={{fontSize:11,color:'#ffd60a',marginBottom:4}}>⏱ {menu.tutTempo}</div>
                )}
                {currentBothSides&&(
                  <div style={{padding:'6px 12px',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',borderRadius:8,marginBottom:12,fontSize:11,color:'#ffd60a'}}>
                    右{Math.round(currentTutSec/2)}秒 → 左{Math.round(currentTutSec/2)}秒
                  </div>
                )}
                <div style={{fontSize:80,fontWeight:800,color:timer<=3?'#ff4455':'#ffd60a',marginBottom:8}}>{timer}</div>
                <div style={{fontSize:13,color:'#666'}}>秒後にスタート</div>
              </>
            )}
            {phase==='exercise'&&(
              <>
                <div style={{fontSize:11,color:'#39ff14',fontWeight:700,marginBottom:8}}>SET {currentSet}/{currentEx?.sets||3}</div>
                <div style={{fontSize:24,fontWeight:800,marginBottom:4}}>{currentEx?.name}</div>
                <div style={{fontSize:14,color:'#ffd60a',fontWeight:700,marginBottom:4}}>{currentEx?.reps}</div>
                {currentShowTut&&menu.tutTempo&&(
                  <div style={{fontSize:11,color:'#ffd60a',marginBottom:4}}>⏱ {menu.tutTempo}</div>
                )}
                {currentBothSides&&(
                  <div style={{padding:'6px 12px',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',borderRadius:8,marginBottom:8,fontSize:11,color:'#ffd60a'}}>
                    右{Math.round(currentTutSec/2)}秒 → 左{Math.round(currentTutSec/2)}秒
                  </div>
                )}
                <div style={{fontSize:11,color:'#666',marginBottom:12}}>{currentEx?.muscle}</div>
                <div style={{fontSize:80,fontWeight:800,color:timer<=10?'#ff4455':'#39ff14',marginBottom:8,fontVariantNumeric:'tabular-nums'}}>{timer}</div>
                <div style={{fontSize:13,color:'#666'}}>秒</div>
              </>
            )}
            {phase==='rest'&&(
              <>
                <div style={{fontSize:20,marginBottom:8}}>😮‍💨</div>
                <div style={{fontSize:20,fontWeight:800,color:'#666',marginBottom:16}}>休憩中</div>
                <div style={{fontSize:80,fontWeight:800,color:'#00c8ff',marginBottom:8,fontVariantNumeric:'tabular-nums'}}>{timer}</div>
                <div style={{fontSize:13,color:'#666',marginBottom:16}}>秒</div>
                <div style={{fontSize:12,color:'#666',marginBottom:16}}>
                  次: {currentSet<(currentEx?.sets||3)?`セット${currentSet+1}`:allExercises[currentExIdx+1]?.name||'完了'}
                </div>
                <button onClick={skipRest}
                  style={{padding:'10px 24px',background:'transparent',color:'#39ff14',border:'1px solid #39ff14',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  スキップ →
                </button>
              </>
            )}
          </div>

          {currentEx?.why&&(
            <div style={{background:'rgba(0,200,255,0.1)',borderRadius:12,padding:'12px 14px',border:'1px solid rgba(0,200,255,0.3)',marginBottom:16}}>
              <div style={{fontSize:10,color:'#00c8ff',fontWeight:700,marginBottom:3}}>📌 ポイント</div>
              <div style={{fontSize:12,lineHeight:1.6}}>{currentEx.why}</div>
            </div>
          )}

          <button onClick={()=>{clearInterval(intervalRef.current);setMode('view')}}
            style={{width:'100%',padding:'13px',background:'transparent',color:'#666',border:'1px solid #2a2a36',borderRadius:12,fontSize:13,cursor:'pointer'}}>
            中断する（EXPなし）
          </button>
        </div>
      </div>
    )
  }

  // 通常表示モード
  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'20px 16px'}}>

        <div style={{padding:'14px 0 12px',borderBottom:'1px solid #2a2a36',marginBottom:16}}>
          <span style={{fontSize:11,fontWeight:800,color:'#39ff14',letterSpacing:3}}>⚡ 今日のメニュー</span>
        </div>

        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px 16px',border:'1px solid #2a2a36',marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:2,color:'#39ff14',fontWeight:700,marginBottom:4}}>⚡ お任せメニュー</div>
          <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>{menu.theme}</div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
            <span style={{display:'inline-block',background:'rgba(57,255,20,0.1)',border:'1px solid #1a6600',color:'#39ff14',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:700}}>{menu.level}</span>
            {menu.tutGoal&&<span style={{display:'inline-block',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',color:'#ffd60a',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:700}}>目標: {menu.tutGoal}</span>}
          </div>

          {menu.whyThisMenu&&(
            <div style={{padding:'10px 12px',background:'rgba(204,68,255,0.1)',border:'1px solid rgba(204,68,255,0.4)',borderRadius:10,marginBottom:14}}>
              <div style={{fontSize:10,color:'#cc44ff',fontWeight:700,marginBottom:3}}>このメニューを提案した理由</div>
              <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>{menu.whyThisMenu}</div>
            </div>
          )}

          <div style={{fontSize:10,color:'#39ff14',fontWeight:700,letterSpacing:1,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            <div style={{flex:1,height:1,background:'#1a6600'}}/>
            💪 トレーニングメニュー
            <div style={{flex:1,height:1,background:'#1a6600'}}/>
          </div>

          {normalExercises.map((ex: any, i: number) => {
            const idx = exerciseIndex++
            const tutSec = calcTutSec(ex, menu?.tutTempo || '')
            const exBothSides = isBothSidesReps(ex.reps || '')
            const exShowTut = shouldShowTut(ex.name)
            return (
              <div key={i} onClick={()=>toggleCheck(String(idx))}
                style={{padding:'10px 0',borderBottom:'1px solid #2a2a36',cursor:'pointer',opacity:checked[idx]?0.6:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{display:'flex',gap:10,flex:1}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:checked[idx]?'#39ff14':'#25252f',border:'2px solid '+(checked[idx]?'#39ff14':'#2a2a36'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,marginTop:2}}>
                      {checked[idx]&&'✓'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,textDecoration:checked[idx]?'line-through':'none'}}>{i+1}. {ex.name}</div>
                      <div style={{fontSize:11,color:'#666',marginTop:2}}>{ex.muscle} · 休憩{ex.restSec}秒</div>
                      <div style={{fontSize:11,color:'#00c8ff',marginTop:3}}>📌 {ex.why}</div>
                      {exShowTut&&menu.tutTempo&&(
                        <div style={{fontSize:10,color:'#ffd60a',marginTop:3}}>⏱ {menu.tutTempo}</div>
                      )}
                    </div>
                  </div>
                  <div style={{textAlign:'right',minWidth:80}}>
                    <span style={{display:'inline-block',background:'rgba(57,255,20,0.1)',border:'1px solid #1a6600',color:'#39ff14',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:700}}>{ex.sets}セット</span>
                    <div style={{fontSize:13,fontWeight:800,marginTop:3}}>{ex.reps}</div>
                    {/* TUT必要・両側 → 片側秒数表示 */}
                    {exShowTut&&exBothSides&&menu.tutTempo&&parseInt(ex.reps)>0&&(
                      <div style={{fontSize:10,color:'#ffd60a',marginTop:2}}>片側{Math.round(tutSec/2)}秒/セット</div>
                    )}
                    {/* TUT必要・片側 → 合計秒数表示 */}
                    {exShowTut&&!exBothSides&&menu.tutTempo&&parseInt(ex.reps)>0&&(
                      <div style={{fontSize:10,color:'#ffd60a',marginTop:2}}>約{tutSec}秒/セット</div>
                    )}
                    {/* TUT不要・両側 → 片側秒数表示 */}
                    {!exShowTut&&exBothSides&&(
                      <div style={{fontSize:10,color:'#ffd60a',marginTop:2}}>片側{ex.durationSec||30}秒/セット</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {postureExercises.length>0&&(
            <>
              <div style={{padding:'14px 0 8px',display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <div style={{flex:1,height:1,background:'linear-gradient(to right, #cc44ff66, transparent)'}}/>
                <div style={{fontSize:11,fontWeight:800,color:'#cc44ff',whiteSpace:'nowrap'}}>🧍 姿勢改善メニュー</div>
                <div style={{flex:1,height:1,background:'linear-gradient(to left, #cc44ff66, transparent)'}}/>
              </div>
              {postureExercises.map((ex: any, i: number) => {
                const idx = exerciseIndex++
                const exBothSides = isBothSidesReps(ex.reps || '')
                const exShowTut = shouldShowTut(ex.name)
                const tutSec = calcTutSec(ex, menu?.tutTempo || '')
                return (
                  <div key={i} onClick={()=>toggleCheck(String(idx))}
                    style={{padding:'10px 0',borderBottom:'1px solid #2a2a36',cursor:'pointer',opacity:checked[idx]?0.6:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{display:'flex',gap:10,flex:1}}>
                        <div style={{width:24,height:24,borderRadius:'50%',background:checked[idx]?'#cc44ff':'#25252f',border:'2px solid '+(checked[idx]?'#cc44ff':'#2a2a36'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,marginTop:2}}>
                          {checked[idx]&&'✓'}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13,color:'#cc44ff',textDecoration:checked[idx]?'line-through':'none'}}>{i+1}. {ex.name}</div>
                          <div style={{fontSize:11,color:'#666',marginTop:2}}>{ex.muscle} · 休憩{ex.restSec}秒</div>
                          <div style={{fontSize:11,color:'#cc44ff',marginTop:3}}>🧍 {ex.why}</div>
                        </div>
                      </div>
                      <div style={{textAlign:'right',minWidth:76}}>
                        <span style={{display:'inline-block',background:'rgba(204,68,255,0.1)',border:'1px solid #cc44ff44',color:'#cc44ff',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:700}}>{ex.sets}セット</span>
                        <div style={{fontSize:13,fontWeight:800,marginTop:3}}>{ex.reps}</div>
                        {!exShowTut&&exBothSides&&(
                          <div style={{fontSize:10,color:'#ffd60a',marginTop:2}}>片側{ex.durationSec||30}秒/セット</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {menu.closingTip&&(
            <div style={{background:'rgba(57,255,20,0.1)',borderRadius:9,padding:'10px 12px',marginTop:12,border:'1px solid #1a6600'}}>
              <div style={{fontSize:10,color:'#39ff14',fontWeight:700,marginBottom:2}}>💡 トレーニング後のアドバイス</div>
              <div style={{fontSize:12,lineHeight:1.6}}>{menu.closingTip}</div>
            </div>
          )}
        </div>

        <button onClick={startTraining}
          style={{width:'100%',padding:'16px',background:'#39ff14',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',marginBottom:10}}>
          ▶ トレーニング開始
        </button>

        <div style={{background:'#1e1e26',borderRadius:16,padding:'14px',border:'1px solid #2a2a36',marginBottom:10,textAlign:'center'}}>
          <div style={{fontSize:11,color:'#666',marginBottom:6}}>
            {allChecked?'全種目チェック済み！':`${Object.values(checked).filter(Boolean).length}/${allExercises.length} チェック済み`}
          </div>
          <div style={{background:'#2a2a36',borderRadius:8,height:4,overflow:'hidden',marginBottom:10}}>
            <div style={{height:'100%',width:`${allExercises.length>0?(Object.values(checked).filter(Boolean).length/allExercises.length)*100:0}%`,background:'#39ff14',transition:'width 0.3s'}}/>
          </div>
          <button onClick={completeTraining} disabled={!allChecked}
            style={{width:'100%',padding:'12px',background:allChecked?'#1e1e26':'#25252f',color:allChecked?'#39ff14':'#444',border:'1px solid '+(allChecked?'#39ff14':'#2a2a36'),borderRadius:10,fontSize:13,fontWeight:700,cursor:allChecked?'pointer':'not-allowed'}}>
            {allChecked?'✅ 手動完了・EXP獲得':'全種目チェックで完了'}
          </button>
        </div>

        <button onClick={()=>router.push('/dashboard')}
          style={{width:'100%',padding:'13px',background:'transparent',color:'#666',border:'1px solid #2a2a36',borderRadius:12,fontSize:13,cursor:'pointer',marginBottom:8}}>
          後でやる → ダッシュボード
        </button>

        <button onClick={generateMenu}
          style={{width:'100%',padding:'13px',background:'transparent',color:'#39ff14',border:'1px solid #39ff14',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          🔄 メニューを再生成
        </button>

      </div>
    </div>
  )
}