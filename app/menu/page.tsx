'use client'
import { useState, useEffect } from 'react'
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

export default function MenuPage() {
  const [status, setStatus] = useState<'loading'|'done'|'error'>('loading')
  const [menu, setMenu] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState(false)
  const [expGained, setExpGained] = useState(0)
  const [levelUp, setLevelUp] = useState<any>(null)
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

  const generateMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const diag    = JSON.parse(localStorage.getItem('mt_diag')    || '{}')
      const goal    = localStorage.getItem('mt_goal')    || ''
      const posture = JSON.parse(localStorage.getItem('mt_posture') || '[]')
      const fitness = JSON.parse(localStorage.getItem('mt_fitness') || '{}')

      const { data: profile } = await supabase
        .from('users').select('*').eq('id', user.id).single()

      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, diag, goal, posture, fitness }),
      })

      const data = await res.json()
      setMenu(data)
      setStatus('done')

      // 診断・メニュー履歴をDBに保存
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

  const toggleCheck = (key: string) => {
    setChecked(c => ({ ...c, [key]: !c[key] }))
  }

  const allExercises = [
    ...(menu?.exercises?.filter((ex: any) => !ex.isSeparator) || []),
    ...(menu?.postureExercises || []),
  ]

  const allChecked = allExercises.length > 0 &&
    allExercises.every((_: any, i: number) => checked[i])

  const completeTraining = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // EXP計算
      const baseExp = menu.level === '上級' ? 60 : menu.level === '中級' ? 40 : 25
      const bonusExp = allExercises.length * 5
      const totalExp = baseExp + bonusExp
      setExpGained(totalExp)

      // 現在のEXPを取得
      const { data: profile } = await supabase
        .from('users').select('exp, level').eq('id', user.id).single()
      const currentExp = profile?.exp || 0
      const newExp = currentExp + totalExp

      // レベルアップ判定
      const oldLv = getLevel(currentExp)
      const newLv = getLevel(newExp)
      if (newLv.lv > oldLv.lv) {
        setLevelUp(newLv)
      }

      // DBに保存
      await supabase.from('users').update({
        exp: newExp,
        level: newLv.lv,
      }).eq('id', user.id)

      // training_logsを完了に更新
      await supabase.from('training_logs')
        .update({ completed: true })
        .eq('user_id', user.id)
        .eq('menu_name', menu.theme)
        .eq('completed', false)

      setCompleted(true)
    } catch(e) {
      console.error(e)
    }
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

  // レベルアップ画面
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

  // 完了画面
  if (completed) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'0 20px',maxWidth:400}}>
        <div style={{fontSize:64,marginBottom:16}}>💪</div>
        <div style={{fontSize:24,fontWeight:800,color:'#39ff14',marginBottom:8}}>トレーニング完了！</div>
        <div style={{fontSize:16,color:'#ffd60a',fontWeight:800,marginBottom:4}}>+{expGained} EXP獲得！</div>
        <div style={{fontSize:13,color:'#666',marginBottom:32}}>お疲れ様でした！継続することが大切です。</div>
        <button onClick={()=>router.push('/dashboard')}
          style={{width:'100%',padding:'16px',background:'#39ff14',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',marginBottom:10}}>
          ダッシュボードへ →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'20px 16px'}}>

        <div style={{padding:'14px 0 12px',borderBottom:'1px solid #2a2a36',marginBottom:16}}>
          <span style={{fontSize:11,fontWeight:800,color:'#39ff14',letterSpacing:3}}>⚡ 今日のメニュー</span>
        </div>

        <div style={{background:'#1e1e26',borderRadius:16,padding:'20px 16px',border:'1px solid #2a2a36',marginBottom:16}}>

          <div style={{fontSize:10,letterSpacing:2,color:'#39ff14',fontWeight:700,marginBottom:4}}>⚡ お任せメニュー</div>
          <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>{menu.theme}</div>
          <span style={{display:'inline-block',background:'rgba(57,255,20,0.1)',border:'1px solid #1a6600',color:'#39ff14',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:700,marginBottom:16}}>{menu.level}</span>

          {menu.whyThisMenu&&(
            <div style={{padding:'10px 12px',background:'rgba(204,68,255,0.1)',border:'1px solid rgba(204,68,255,0.4)',borderRadius:10,marginBottom:14}}>
              <div style={{fontSize:10,color:'#cc44ff',fontWeight:700,marginBottom:3}}>このメニューを提案した理由</div>
              <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>{menu.whyThisMenu}</div>
            </div>
          )}

          {/* トレーニングメニュー */}
          <div style={{fontSize:10,color:'#39ff14',fontWeight:700,letterSpacing:1,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            <div style={{flex:1,height:1,background:'#1a6600'}}/>
            💪 トレーニングメニュー
            <div style={{flex:1,height:1,background:'#1a6600'}}/>
          </div>

          {normalExercises.map((ex: any, i: number) => {
            const idx = exerciseIndex++
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
                    </div>
                  </div>
                  <div style={{textAlign:'right',minWidth:76}}>
                    <span style={{display:'inline-block',background:'rgba(57,255,20,0.1)',border:'1px solid #1a6600',color:'#39ff14',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:700}}>{ex.sets}セット</span>
                    <div style={{fontSize:13,fontWeight:800,marginTop:3}}>{ex.reps}</div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* 姿勢改善メニュー */}
          {postureExercises.length>0&&(
            <>
              <div style={{padding:'14px 0 8px',display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <div style={{flex:1,height:1,background:'linear-gradient(to right, #cc44ff66, transparent)'}}/>
                <div style={{fontSize:11,fontWeight:800,color:'#cc44ff',whiteSpace:'nowrap'}}>🧍 姿勢改善メニュー</div>
                <div style={{flex:1,height:1,background:'linear-gradient(to left, #cc44ff66, transparent)'}}/>
              </div>
              {postureExercises.map((ex: any, i: number) => {
                const idx = exerciseIndex++
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

        {/* 完了ボタン */}
        <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36',marginBottom:10,textAlign:'center'}}>
          <div style={{fontSize:12,color:'#666',marginBottom:8}}>
            {allChecked ? '全種目完了！' : `${Object.values(checked).filter(Boolean).length} / ${allExercises.length} 完了`}
          </div>
          <div style={{background:'#2a2a36',borderRadius:8,height:6,overflow:'hidden',marginBottom:12}}>
            <div style={{height:'100%',width:`${allExercises.length>0?(Object.values(checked).filter(Boolean).length/allExercises.length)*100:0}%`,background:'#39ff14',transition:'width 0.3s'}}/>
          </div>
          <button onClick={completeTraining} disabled={!allChecked}
            style={{width:'100%',padding:'14px',background:allChecked?'#39ff14':'#25252f',color:allChecked?'#000':'#444',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:allChecked?'pointer':'not-allowed',transition:'all 0.3s'}}>
            {allChecked ? '✅ トレーニング完了！EXP獲得' : '種目をチェックして完了'}
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