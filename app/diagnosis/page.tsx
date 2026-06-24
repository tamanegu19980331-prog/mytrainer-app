'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS = [
  {
    id: 'purpose',
    question: 'トレーニングの目的は？',
    options: ['ダイエット・脂肪燃焼', '筋肉をつけたい', '姿勢を改善したい', '健康維持・体力向上', 'スポーツパフォーマンス向上'],
  },
  {
    id: 'frequency',
    question: '週に何回トレーニングできますか？',
    options: ['週1回', '週2〜3回', '週4〜5回', 'ほぼ毎日'],
  },
  {
    id: 'experience',
    question: 'トレーニング経験はどのくらいですか？',
    options: ['ほぼ未経験', '3ヶ月未満', '3ヶ月〜1年', '1年以上'],
  },
  {
    id: 'issue',
    question: '続かなかった主な理由は？',
    options: ['時間がない', 'やり方がわからない', 'モチベーション維持が難しい', 'ケガや体の不調', '続けられていた'],
  },
  {
    id: 'lifestyle',
    question: '普段の生活スタイルは？',
    options: ['デスクワーク中心', '立ち仕事・体を動かす', '在宅勤務', '学生・その他'],
  },
]

export default function DiagnosisPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const router = useRouter()

  const q = QUESTIONS[current]
  const progress = ((current) / QUESTIONS.length) * 100

  const select = (val: string) => {
    const newAnswers = { ...answers, [q.id]: val }
    setAnswers(newAnswers)
    setTimeout(() => {
      if (current < QUESTIONS.length - 1) {
        setCurrent(c => c + 1)
      } else {
        localStorage.setItem('mt_diag', JSON.stringify(newAnswers))
        router.push('/goal')
      }
    }, 300)
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        {/* ヘッダー */}
        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14',letterSpacing:2}}>MY TRAINER</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {[1,2,3,4,5].map(i=>(
              <div key={i} style={{width:i===3?24:8,height:4,borderRadius:4,background:i<=3?'#39ff14':'#2a2a36'}}/>
            ))}
          </div>
        </div>

        <div style={{padding:'32px 24px 0'}}>
          <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:8}}>STEP 3 / 5</div>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.3,marginBottom:24}}>
            あなたについて<br/>教えてください
          </div>

          {/* プログレスバー */}
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#555',marginBottom:8}}>
              <span>質問 {current+1} / {QUESTIONS.length}</span>
              <span>{Math.round(((current+1)/QUESTIONS.length)*100)}%</span>
            </div>
            <div style={{background:'#2a2a36',borderRadius:8,height:6,overflow:'hidden'}}>
              <div style={{
                height:'100%',
                width:`${((current+1)/QUESTIONS.length)*100}%`,
                background:'linear-gradient(to right,#39ff14,#00c8ff)',
                borderRadius:8,transition:'width 0.4s ease',
              }}/>
            </div>
            {/* ステップドット */}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
              {QUESTIONS.map((_,i)=>(
                <div key={i} style={{
                  width:8,height:8,borderRadius:'50%',
                  background:i<=current?'#39ff14':'#2a2a36',
                  transition:'all 0.3s',
                }}/>
              ))}
            </div>
          </div>

          {/* 質問 */}
          <div style={{
            background:'#1e1e26',borderRadius:20,padding:'24px',
            border:'1px solid #2a2a36',marginBottom:20,
          }}>
            <div style={{fontSize:18,fontWeight:800,lineHeight:1.5,color:'#e8e8e8'}}>
              {q.question}
            </div>
          </div>

          {/* 選択肢 */}
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {q.options.map(opt=>{
              const selected = answers[q.id] === opt
              return (
                <button key={opt} onClick={()=>select(opt)}
                  style={{
                    width:'100%',padding:'18px 20px',
                    background:selected?'rgba(57,255,20,0.08)':'#1e1e26',
                    border:'1.5px solid '+(selected?'#39ff14':'#2a2a36'),
                    borderRadius:14,color:selected?'#39ff14':'#e8e8e8',
                    fontSize:15,fontWeight:selected?700:400,
                    cursor:'pointer',textAlign:'left',
                    transition:'all 0.2s',
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                  }}>
                  <span>{opt}</span>
                  {selected&&<span style={{fontSize:18}}>✓</span>}
                </button>
              )
            })}
          </div>

          {/* 戻るボタン */}
          {current > 0 && (
            <button onClick={()=>setCurrent(c=>c-1)}
              style={{
                width:'100%',padding:'16px',marginTop:16,
                background:'transparent',color:'#555',
                border:'1px solid #2a2a36',borderRadius:14,
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