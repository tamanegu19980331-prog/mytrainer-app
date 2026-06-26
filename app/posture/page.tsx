'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS = [
  {
    id: 'q1',
    question: '横から見て、耳が肩より前に出ていますか？',
    image: '👂',
    hint: '壁に背中をつけて立ち、耳の位置を確認してください',
    yes: ['straight_neck'],
    no: [],
  },
  {
    id: 'q2',
    question: '肩が前に丸まって内側に巻いていますか？',
    image: '🔵',
    hint: '腕を自然に下げた時、手の甲が前を向いていたら巻き肩です',
    yes: ['rounded_shoulders'],
    no: [],
  },
  {
    id: 'q3',
    question: '背中が丸くなって猫背になっていますか？',
    image: '🐱',
    hint: '横から見て背中が弓なりに丸くなっていますか？',
    yes: ['kyphosis'],
    no: [],
  },
  {
    id: 'q4',
    question: 'お腹が前に出て腰が反っていますか？',
    image: '🔄',
    hint: '横から見てお腹が前に突き出て腰が大きく反っていますか？',
    yes: ['anterior_tilt'],
    no: [],
  },
  {
    id: 'q5',
    question: 'お尻が下がって背中が全体的に丸くなっていますか？',
    image: '🔃',
    hint: '骨盤が後ろに傾いてお尻が下に落ちていますか？',
    yes: ['posterior_tilt'],
    no: [],
  },
  {
    id: 'q6',
    question: '肩が常に上がって首が短く見えますか？',
    image: '⬆️',
    hint: '力を抜いても肩が耳に近い位置にありますか？',
    yes: ['elevated_shoulders'],
    no: [],
  },
  {
    id: 'q7',
    question: '正面から見て膝が外側に開いていますか？（O脚）',
    image: '🦵',
    hint: '足を閉じて立った時、膝と膝の間が開いていますか？',
    yes: ['o_legs'],
    no: [],
  },
  {
    id: 'q8',
    question: '正面から見て膝が内側に入っていますか？（X脚）',
    image: '🦿',
    hint: '膝をつけて立った時、足首が開いていますか？',
    yes: ['x_legs'],
    no: [],
  },
]

const POSTURE_LABELS: Record<string, string> = {
  anterior_tilt: '骨盤前傾',
  posterior_tilt: '骨盤後傾',
  rounded_shoulders: '巻き肩',
  kyphosis: '猫背',
  straight_neck: 'ストレートネック',
  elevated_shoulders: '肩の挙上',
  o_legs: 'O脚',
  x_legs: 'X脚',
}

const POSTURE_COLORS: Record<string, string> = {
  anterior_tilt: '#ffd60a',
  posterior_tilt: '#ff8c00',
  rounded_shoulders: '#00c8ff',
  kyphosis: '#ff6b9d',
  straight_neck: '#39ff14',
  elevated_shoulders: '#cc44ff',
  o_legs: '#ff4455',
  x_legs: '#ff6b35',
}

export default function PosturePage() {
  const [mode, setMode] = useState<'intro'|'quiz'|'result'|'manual'>('intro')
  const [current, setCurrent] = useState(0)
  const [detected, setDetected] = useState<string[]>([])
  const [manualSelected, setManualSelected] = useState<string[]>([])
  const router = useRouter()

  const handleAnswer = (answer: boolean) => {
    const q = QUESTIONS[current]
    if (answer) {
      setDetected(d => [...new Set([...d, ...q.yes])])
    }
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
    } else {
      setMode('result')
    }
  }

  const next = (postures: string[]) => {
    localStorage.setItem('mt_posture', JSON.stringify(postures))
    router.push('/diagnosis')
  }

  const progress = ((current + 1) / QUESTIONS.length) * 100

  // イントロ画面
  if (mode === 'intro') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14',letterSpacing:2}}>MY TRAINER</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {[1,2,3,4,5].map(i=>(
              <div key={i} style={{width:i===2?24:8,height:4,borderRadius:4,background:i<=2?'#39ff14':'#2a2a36'}}/>
            ))}
          </div>
        </div>

        <div style={{padding:'32px 24px 0'}}>
          <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:8}}>STEP 2 / 5</div>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.3,marginBottom:8}}>
            姿勢チェックを<br/>してみましょう
          </div>
          <div style={{fontSize:14,color:'#666',marginBottom:32,lineHeight:1.7}}>
            鏡の前に立って8つの質問に<br/>答えるだけで姿勢の問題を自動判定します
          </div>

          <div style={{
            background:'#1e1e26',borderRadius:20,padding:'24px',
            border:'1px solid #2a2a36',marginBottom:20,
          }}>
            <div style={{fontSize:13,fontWeight:700,color:'#39ff14',marginBottom:16}}>チェックの準備</div>
            {[
              {emoji:'🪞', text:'鏡の前または壁の近くに立ってください'},
              {emoji:'👕', text:'できれば薄着で確認するとより正確です'},
              {emoji:'😌', text:'力を抜いてリラックスした状態で'},
            ].map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:i<2?12:0}}>
                <div style={{fontSize:24,flexShrink:0}}>{item.emoji}</div>
                <div style={{fontSize:13,color:'#888'}}>{item.text}</div>
              </div>
            ))}
          </div>

          <button onClick={()=>setMode('quiz')}
            style={{
              width:'100%',padding:'20px',
              background:'linear-gradient(135deg,#39ff14,#00c8ff)',
              color:'#000',border:'none',borderRadius:18,
              fontSize:17,fontWeight:800,cursor:'pointer',
              boxShadow:'0 8px 32px rgba(57,255,20,0.2)',
              marginBottom:12,
            }}>
            姿勢チェックを始める →
          </button>

          <button onClick={()=>setMode('manual')}
            style={{
              width:'100%',padding:'16px',
              background:'transparent',color:'#555',
              border:'1px solid #2a2a36',borderRadius:14,
              fontSize:13,cursor:'pointer',
            }}>
            自分で選んで入力する
          </button>
        </div>
      </div>
    </div>
  )

  // クイズ画面
  if (mode === 'quiz') {
    const q = QUESTIONS[current]
    return (
      <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
        <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

          <div style={{padding:'20px 24px'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#555',marginBottom:8}}>
              <span>質問 {current+1} / {QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{background:'#2a2a36',borderRadius:8,height:6,overflow:'hidden'}}>
              <div style={{
                height:'100%',width:`${progress}%`,
                background:'linear-gradient(to right,#39ff14,#00c8ff)',
                borderRadius:8,transition:'width 0.4s ease',
              }}/>
            </div>
          </div>

          <div style={{padding:'0 24px'}}>
            {/* 質問カード */}
            <div style={{
              background:'#1e1e26',borderRadius:24,padding:'32px 24px',
              border:'1px solid #2a2a36',marginBottom:20,textAlign:'center',
            }}>
              <div style={{fontSize:64,marginBottom:20}}>{q.image}</div>
              <div style={{fontSize:20,fontWeight:800,lineHeight:1.5,marginBottom:16,color:'#e8e8e8'}}>
                {q.question}
              </div>
              <div style={{
                background:'rgba(57,255,20,0.06)',border:'1px solid rgba(57,255,20,0.15)',
                borderRadius:12,padding:'12px 16px',
                fontSize:12,color:'#666',lineHeight:1.6,
              }}>
                💡 {q.hint}
              </div>
            </div>

            {/* Yes/No ボタン */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <button onClick={()=>handleAnswer(true)}
                style={{
                  padding:'20px',
                  background:'rgba(57,255,20,0.08)',
                  border:'1.5px solid #39ff14',
                  borderRadius:16,color:'#39ff14',
                  fontSize:18,fontWeight:800,cursor:'pointer',
                  transition:'all 0.2s',
                }}>
                ✓ はい
              </button>
              <button onClick={()=>handleAnswer(false)}
                style={{
                  padding:'20px',
                  background:'rgba(255,68,85,0.08)',
                  border:'1.5px solid #ff4455',
                  borderRadius:16,color:'#ff4455',
                  fontSize:18,fontWeight:800,cursor:'pointer',
                  transition:'all 0.2s',
                }}>
                ✗ いいえ
              </button>
            </div>

            {current > 0 && (
              <button onClick={()=>setCurrent(c=>c-1)}
                style={{
                  width:'100%',padding:'14px',
                  background:'transparent',color:'#444',
                  border:'1px solid #2a2a36',borderRadius:12,
                  fontSize:13,cursor:'pointer',
                }}>
                ← 前の質問に戻る
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 結果画面
  if (mode === 'result') return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14',letterSpacing:2}}>MY TRAINER</div>
        </div>

        <div style={{padding:'24px 24px 0'}}>
          <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:8}}>チェック完了</div>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.3,marginBottom:8}}>
            姿勢チェックの<br/>結果です
          </div>
          <div style={{fontSize:14,color:'#666',marginBottom:24}}>
            AIがあなたの姿勢を分析しました
          </div>

          {detected.length === 0 ? (
            <div style={{
              background:'rgba(57,255,20,0.06)',border:'1px solid rgba(57,255,20,0.2)',
              borderRadius:20,padding:'32px 24px',marginBottom:20,textAlign:'center',
            }}>
              <div style={{fontSize:48,marginBottom:12}}>🎉</div>
              <div style={{fontSize:18,fontWeight:800,color:'#39ff14',marginBottom:8}}>
                姿勢の問題は検出されませんでした
              </div>
              <div style={{fontSize:13,color:'#666'}}>
                素晴らしい姿勢です！引き続き維持しましょう
              </div>
            </div>
          ) : (
            <div style={{marginBottom:20}}>
              <div style={{
                background:'rgba(255,107,53,0.06)',border:'1px solid rgba(255,107,53,0.2)',
                borderRadius:14,padding:'14px 18px',marginBottom:16,
              }}>
                <div style={{fontSize:13,color:'#ff6b35',fontWeight:600}}>
                  {detected.length}つの姿勢の問題が検出されました
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {detected.map(id=>(
                  <div key={id} style={{
                    background:'#1e1e26',borderRadius:14,padding:'16px 18px',
                    border:`1px solid ${POSTURE_COLORS[id]}33`,
                    display:'flex',alignItems:'center',gap:12,
                  }}>
                    <div style={{
                      width:12,height:12,borderRadius:'50%',
                      background:POSTURE_COLORS[id],flexShrink:0,
                    }}/>
                    <div style={{fontSize:15,fontWeight:700,color:POSTURE_COLORS[id]}}>
                      {POSTURE_LABELS[id]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            background:'#1e1e26',borderRadius:14,padding:'14px 18px',
            border:'1px solid #2a2a36',marginBottom:24,
            fontSize:12,color:'#555',lineHeight:1.6,
          }}>
            💡 検出された姿勢の問題に合わせた改善メニューが自動的に追加されます
          </div>

          <button onClick={()=>next(detected)}
            style={{
              width:'100%',padding:'20px',
              background:'linear-gradient(135deg,#39ff14,#00c8ff)',
              color:'#000',border:'none',borderRadius:18,
              fontSize:17,fontWeight:800,cursor:'pointer',
              boxShadow:'0 8px 32px rgba(57,255,20,0.2)',
              marginBottom:12,
            }}>
            次へ → 診断
          </button>

          <button onClick={()=>{setMode('quiz');setCurrent(0);setDetected([])}}
            style={{
              width:'100%',padding:'16px',
              background:'transparent',color:'#555',
              border:'1px solid #2a2a36',borderRadius:14,
              fontSize:13,cursor:'pointer',
            }}>
            もう一度チェックする
          </button>
        </div>
      </div>
    </div>
  )

  // 手動選択画面
  const POSTURE_TYPES = [
    {id:'anterior_tilt',label:'骨盤前傾',emoji:'🔄',desc:'お腹が前に出て腰が反っている'},
    {id:'posterior_tilt',label:'骨盤後傾',emoji:'🔃',desc:'お尻が下がり背中が丸くなっている'},
    {id:'rounded_shoulders',label:'巻き肩',emoji:'🔵',desc:'肩が前に出て内側に巻いている'},
    {id:'kyphosis',label:'猫背',emoji:'🐱',desc:'背中が丸く前傾姿勢になっている'},
    {id:'straight_neck',label:'ストレートネック',emoji:'📱',desc:'首が前に出てスマホ首になっている'},
    {id:'elevated_shoulders',label:'肩の挙上',emoji:'⬆️',desc:'肩が常に上がっている'},
    {id:'o_legs',label:'O脚',emoji:'🦵',desc:'膝が外側に開いている'},
    {id:'x_legs',label:'X脚',emoji:'🦿',desc:'膝が内側に入っている'},
    {id:'xo_legs',label:'XO脚',emoji:'🔀',desc:'膝がX型で足首がO型'},
  ]

  const toggleManual = (id: string) => {
    setManualSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id])
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>setMode('intro')}
            style={{background:'none',border:'none',color:'#666',fontSize:24,cursor:'pointer',padding:0}}>
            ←
          </button>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14',letterSpacing:2}}>MY TRAINER</div>
        </div>

        <div style={{padding:'24px 24px 0'}}>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.3,marginBottom:8}}>
            気になる姿勢を<br/>選んでください
          </div>
          <div style={{fontSize:14,color:'#666',marginBottom:24}}>
            複数選択できます（なければスキップ）
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
            {POSTURE_TYPES.map(p=>{
              const sel = manualSelected.includes(p.id)
              return (
                <button key={p.id} onClick={()=>toggleManual(p.id)}
                  style={{
                    width:'100%',padding:'16px 18px',
                    background:sel?'rgba(57,255,20,0.06)':'#1e1e26',
                    border:'1.5px solid '+(sel?'#39ff14':'#2a2a36'),
                    borderRadius:16,cursor:'pointer',
                    display:'flex',alignItems:'center',gap:12,
                    transition:'all 0.2s',
                  }}>
                  <div style={{
                    width:44,height:44,borderRadius:12,
                    background:sel?'rgba(57,255,20,0.15)':'#25252f',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:22,flexShrink:0,
                  }}>
                    {p.emoji}
                  </div>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{fontSize:15,fontWeight:700,color:sel?'#39ff14':'#e8e8e8',marginBottom:2}}>{p.label}</div>
                    <div style={{fontSize:12,color:'#555'}}>{p.desc}</div>
                  </div>
                  <div style={{
                    width:24,height:24,borderRadius:'50%',flexShrink:0,
                    background:sel?'#39ff14':'transparent',
                    border:'2px solid '+(sel?'#39ff14':'#333'),
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:13,color:'#000',fontWeight:800,
                    transition:'all 0.2s',
                  }}>
                    {sel&&'✓'}
                  </div>
                </button>
              )
            })}
          </div>

          <button onClick={()=>next(manualSelected)}
            style={{
              width:'100%',padding:'20px',
              background:'linear-gradient(135deg,#39ff14,#00c8ff)',
              color:'#000',border:'none',borderRadius:18,
              fontSize:17,fontWeight:800,cursor:'pointer',
              boxShadow:'0 8px 32px rgba(57,255,20,0.2)',
            }}>
            {manualSelected.length>0?`${manualSelected.length}項目を選択して次へ →`:'スキップして次へ →'}
          </button>
        </div>
      </div>
    </div>
  )
}