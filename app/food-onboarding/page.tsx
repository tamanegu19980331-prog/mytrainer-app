'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const QUESTIONS = [
  {
    key: 'meal_count',
    title: '1日の食事回数は？',
    desc: '無理なく続けられるペースを教えてください',
    options: [
      { v: '3食しっかり', l: '3食しっかり', emoji: '🍽️' },
      { v: '2食が多い', l: '2食が多い', emoji: '🥪' },
      { v: '不規則', l: '不規則・バラバラ', emoji: '🌀' },
    ],
  },
  {
    key: 'cooking_level',
    title: '自炊はできますか？',
    desc: '無理のない範囲で大丈夫です',
    options: [
      { v: '自炊メイン', l: '自炊メイン', emoji: '👨‍🍳' },
      { v: 'たまに自炊', l: 'たまに自炊', emoji: '🍳' },
      { v: 'ほぼしない', l: 'ほぼしない', emoji: '🚫' },
    ],
  },
  {
    key: 'eating_out_frequency',
    title: '外食・コンビニの頻度は？',
    desc: '',
    options: [
      { v: 'ほぼ毎日', l: 'ほぼ毎日', emoji: '🏪' },
      { v: '週3-4回', l: '週3〜4回', emoji: '📅' },
      { v: '週1-2回', l: '週1〜2回', emoji: '🗓️' },
      { v: 'ほとんどない', l: 'ほとんどない', emoji: '🏠' },
    ],
  },
  {
    key: 'convenience_store_pref',
    title: 'コンビニ利用について',
    desc: '',
    options: [
      { v: 'コンビニ中心でOK', l: 'コンビニ中心でOK', emoji: '🏪' },
      { v: 'できれば避けたい', l: 'できれば避けたい', emoji: '🙅' },
      { v: 'どちらでも', l: 'どちらでも良い', emoji: '🤷' },
    ],
  },
  {
    key: 'pfc_interest',
    title: 'PFC（栄養素）バランスへの興味は？',
    desc: 'タンパク質・脂質・炭水化物の管理について',
    options: [
      { v: '細かく管理したい', l: '細かく管理したい', emoji: '📊' },
      { v: 'カロリーだけ見たい', l: 'カロリーだけ見たい', emoji: '🔢' },
      { v: 'よくわからないので任せたい', l: 'お任せしたい', emoji: '🙏' },
    ],
  },
]

export default function FoodOnboardingPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [dislikes, setDislikes] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
    }
    check()
  }, [])

  const selectAnswer = (key: string, value: string) => {
    setAnswers(a => ({ ...a, [key]: value }))
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 250)
    } else {
      setTimeout(() => setStep(QUESTIONS.length), 250)
    }
  }

  const determineDietType = (a: Record<string, string>) => {
    if (a.convenience_store_pref === 'コンビニ中心でOK' || a.eating_out_frequency === 'ほぼ毎日') {
      return 'コンビニ派・時間なし型'
    }
    if (a.eating_out_frequency === '週3-4回' && a.cooking_level !== '自炊メイン') {
      return '外食多い・選択型'
    }
    if (a.cooking_level === '自炊メイン' && a.pfc_interest === '細かく管理したい') {
      return '自炊できる・PFC管理型'
    }
    if (a.meal_count === '2食が多い' || a.meal_count === '不規則') {
      return '2食・不規則型'
    }
    if (a.pfc_interest === 'カロリーだけ見たい' || a.pfc_interest === 'よくわからないので任せたい') {
      return 'まずはカロリーだけ型'
    }
    return '自炊できる・PFC管理型'
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const dietType = determineDietType(answers)
      await supabase.from('food_profiles').upsert({
        user_id: user.id,
        meal_count: answers.meal_count,
        cooking_level: answers.cooking_level,
        eating_out_frequency: answers.eating_out_frequency,
        convenience_store_pref: answers.convenience_store_pref,
        pfc_interest: answers.pfc_interest,
        dislikes: dislikes.trim(),
        diet_type: dietType,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      router.push('/food')
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const progress = Math.min(((step) / QUESTIONS.length) * 100, 100)

  return (
    <div style={{ background: '#16161a', minHeight: '100vh', color: '#e8e8e8', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '24px 24px 40px', flex: 1 }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#ff8c00', fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
            食事の好みを教えてください
          </div>
          <div style={{ background: '#2a2a36', borderRadius: 8, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(to right,#ff8c00,#39ff14)', borderRadius: 8, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {step < QUESTIONS.length && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{QUESTIONS[step].title}</div>
            {QUESTIONS[step].desc && <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>{QUESTIONS[step].desc}</div>}
            {!QUESTIONS[step].desc && <div style={{ marginBottom: 24 }} />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {QUESTIONS[step].options.map(opt => (
                <button key={opt.v} onClick={() => selectAnswer(QUESTIONS[step].key, opt.v)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '18px 20px',
                    background: answers[QUESTIONS[step].key] === opt.v ? 'rgba(57,255,20,0.08)' : '#1e1e26',
                    border: '1.5px solid ' + (answers[QUESTIONS[step].key] === opt.v ? '#39ff14' : '#2a2a36'),
                    borderRadius: 16, color: '#e8e8e8', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.2s',
                  }}>
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === QUESTIONS.length && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>最後に一つ</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>苦手な食品やアレルギーがあれば教えてください（任意）</div>
            <textarea
              value={dislikes}
              onChange={e => setDislikes(e.target.value)}
              placeholder="例：パクチーが苦手、卵アレルギーなど"
              rows={4}
              style={{
                width: '100%', background: '#1e1e26', border: '1.5px solid #2a2a36',
                borderRadius: 16, padding: '16px 18px', color: '#e8e8e8',
                fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box',
                marginBottom: 24,
              }}
            />
            <button onClick={handleFinish} disabled={saving}
              style={{
                width: '100%', padding: '18px',
                background: 'linear-gradient(135deg,#39ff14,#00c8ff)',
                color: '#000', border: 'none', borderRadius: 16,
                fontSize: 16, fontWeight: 800, cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
              {saving ? '保存中...' : '完了して食事プランを見る →'}
            </button>
          </div>
        )}

        {step > 0 && step <= QUESTIONS.length && (
          <button onClick={() => setStep(s => Math.max(0, s - 1))}
            style={{ marginTop: 20, background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer' }}>
            ← 前の質問に戻る
          </button>
        )}

      </div>
    </div>
  )
}