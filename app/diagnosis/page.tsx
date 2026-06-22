'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS_M = [
  {
    id: 'goal',
    q: 'トレーニングの一番の目的は？',
    opts: ['筋肉を増やして体を大きくしたい','お腹周りをすっきりしたい','運動習慣をつけたい','マラソン・持久力をつけたい','怪我防止・肩こり腰痛改善','モテたい・かっこよくなりたい']
  },
  {
    id: 'food',
    q: '食事について正直なところは？',
    opts: ['しっかり管理できる','なるべく変えたくない','外食・会食が多くて難しい','コンビニ飯が多い']
  },
  {
    id: 'reason',
    q: '今まで続かなかった一番の理由は？',
    opts: ['最初から飛ばしすぎた','何をすれば良いか分からない','時間が取れなかった','キツくて挫折した']
  },
  {
    id: 'lifestyle',
    q: '生活スタイルで当てはまるものは？',
    opts: ['お酒をよく飲む','甘いものが止まらない','楽できるならしたい','特に問題ない']
  },
  {
    id: 'time',
    q: '1回のトレーニングに使える時間は？',
    opts: ['15〜20分','30〜45分','1時間程度','1時間以上']
  },
]

const QUESTIONS_F = [
  {
    id: 'goal',
    q: '一番なりたい体・目標は？',
    opts: ['見た目を引き締めたい','お腹周りをすっきりしたい','運動習慣をつけたい・健康でいたい','肩こり・腰痛を改善したい','歳をとっても体型維持したい']
  },
  {
    id: 'food',
    q: '食事について正直なところは？',
    opts: ['しっかり管理できる','なるべく変えたくない','外食・会食が多くて難しい','コンビニ・お惣菜が多い']
  },
  {
    id: 'reason',
    q: '今まで続かなかった理由は？',
    opts: ['三日坊主になってしまう','何をすれば良いか分からない','時間がない','キツいのが苦手']
  },
  {
    id: 'lifestyle',
    q: '生活スタイルで当てはまるものは？',
    opts: ['お酒をよく飲む','甘いもの・お菓子が止まらない','楽できるならしたい','特に問題ない']
  },
  {
    id: 'time',
    q: '1回に使える時間は？',
    opts: ['10〜20分','30〜45分','1時間程度']
  },
]

export default function DiagnosisPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [gender, setGender] = useState<string>('')
  const router = useRouter()

  // genderをlocalStorageから取得
  useState(() => {
    if(typeof window !== 'undefined'){
      const g = localStorage.getItem('mt_gender') || '男性'
      setGender(g)
    }
  })

  const questions = gender === '女性' ? QUESTIONS_F : QUESTIONS_M
  const current = questions[step]
  const progress = ((step) / questions.length) * 100

  const select = (opt: string) => {
    const newAnswers = { ...answers, [current.id]: opt }
    setAnswers(newAnswers)
    if (step < questions.length - 1) {
      setStep(s => s + 1)
    } else {
      // 診断完了 → localStorageに保存してメニュー生成へ
      localStorage.setItem('mt_diag', JSON.stringify(newAnswers))
      router.push('/menu')
    }
  }

  const back = () => {
    if (step > 0) setStep(s => s - 1)
  }

  return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px' }}>

        {/* ヘッダー */}
        <div style={{ padding: '14px 0 12px',
          borderBottom: '1px solid #2a2a36',
          display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 800,
            color: '#ff6b9d', letterSpacing: 3 }}>② 診断タイプ</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#666' }}>
            Q{step + 1} / {questions.length}
          </span>
        </div>

        {/* プログレスバー */}
        <div style={{ background: '#2a2a36', borderRadius: 4,
          overflow: 'hidden', height: 4, marginBottom: 20 }}>
          <div style={{ height: '100%', width: `${progress}%`,
            background: '#ff6b9d', transition: 'width 0.3s' }} />
        </div>

        {/* 質問カード */}
        <div style={{ background: '#1e1e26', borderRadius: 16,
          padding: '20px 16px', border: '1px solid #2a2a36' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#ff6b9d',
            fontWeight: 700, marginBottom: 8 }}>
            質問 {step + 1}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800,
            marginBottom: 20, lineHeight: 1.4 }}>
            {current.q}
          </div>

          {/* 選択肢 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {current.opts.map((opt, i) => (
              <button key={i} onClick={() => select(opt)}
                style={{ padding: '12px 14px', textAlign: 'left',
                  background: answers[current.id] === opt
                    ? 'rgba(255,107,157,0.15)' : '#25252f',
                  border: `1px solid ${answers[current.id] === opt
                    ? '#ff6b9d' : '#2a2a36'}`,
                  borderRadius: 10, color: answers[current.id] === opt
                    ? '#ff6b9d' : '#e8e8e8',
                  fontSize: 13, cursor: 'pointer',
                  fontWeight: answers[current.id] === opt ? 700 : 400 }}>
                <span style={{ marginRight: 8 }}>
                  {answers[current.id] === opt ? '✓' : '○'}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 戻るボタン */}
        {step > 0 && (
          <button onClick={back}
            style={{ marginTop: 12, width: '100%', padding: '13px',
              background: 'transparent', color: '#ff6b9d',
              border: '1px solid #ff6b9d', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            ← 戻る
          </button>
        )}

      </div>
    </div>
  )
}