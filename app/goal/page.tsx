'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GOAL_PERSONS = [
    {id:"m_muscle",gender:"M",label:"筋肉質（マッスル体型）",pct:"10〜15%",feat:"筋肉量が多く全体的に厚みがある。逆三角形でたくましい体型。",color:"#4a90d9",left:0,top:3,w:33.3,h:44},
    {id:"m_fit",gender:"M",label:"標準（アスレティック体型）",pct:"15〜18%",feat:"筋肉がしっかりついており、引き締まって健康的な体型。",color:"#4a90d9",left:33.3,top:3,w:33.4,h:44},
    {id:"m_slim",gender:"M",label:"細身（スリム体型）",pct:"8〜14%",feat:"細く引き締まった体型。筋肉量は少なめで脂肪も少ない。",color:"#4a90d9",left:66.7,top:3,w:33.3,h:44},
    {id:"f_glamour",gender:"F",label:"メリハリ体型（グラマラス）",pct:"30〜35%",feat:"バストやヒップにボリュームがあり、メリハリのある女性らしい体型。",color:"#e8758a",left:0,top:52,w:33.3,h:45},
    {id:"f_healthy",gender:"F",label:"標準（ヘルシー体型）",pct:"25〜30%",feat:"適度に筋肉があり、女性らしい自然で健康的な体型。",color:"#e8758a",left:33.3,top:52,w:33.4,h:45},
    {id:"f_slim",gender:"F",label:"細身（スリム体型）",pct:"18〜24%",feat:"脂肪が少なく細く引き締まった体型。華奢でスレンダーな印象。",color:"#e8758a",left:66.7,top:52,w:33.3,h:45},
  ]

export default function GoalPage() {
  const [selId, setSelId] = useState<string | null>(null)
  const [info, setInfo] = useState<any>(null)
  const router = useRouter()

  const pick = (id: string) => {
    const d = GOAL_PERSONS.find(x => x.id === id)
    if (!d) return
    setSelId(id)
    setInfo(d)
    localStorage.setItem('mt_goal', id)
    localStorage.setItem('mt_gender', d.gender === 'M' ? '男性' : '女性')
  }

  return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px' }}>

        {/* ヘッダー */}
        <div style={{ padding: '14px 0 12px',
          borderBottom: '1px solid #2a2a36',
          marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 800,
            color: '#39ff14', letterSpacing: 3 }}>⚡ MY TRAINER</span>
          <span style={{ marginLeft: 16, fontSize: 11, color: '#666' }}>
            ① 体型ゴール
          </span>
        </div>

        <span style={{ fontSize: 10, letterSpacing: 2, color: '#39ff14',
          textTransform: 'uppercase', fontWeight: 700,
          display: 'block', marginBottom: 6 }}>
          Step 1-2 — 理想の体型
        </span>
        <p style={{ fontSize: 12, color: '#666',
          marginBottom: 12, lineHeight: 1.6 }}>
          タップして目指したい体型を選んでください
        </p>

        {/* 画像 + オーバーレイ */}
        <div style={{ position: 'relative', width: '100%',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', marginBottom: 12 }}>
          <img
            src="/goal.jpg"
            style={{ width: '100%', display: 'block' }}
            alt="体型選択"
          />
          {GOAL_PERSONS.map(p => {
            const isSel = selId === p.id
            return (
              <div key={p.id} onClick={() => pick(p.id)}
                style={{ position: 'absolute',
                  left: p.left + '%', top: p.top + '%',
                  width: p.w + '%', height: p.h + '%',
                  cursor: 'pointer' }}>
                <div style={{ position: 'absolute', inset: 3,
                  borderRadius: 8,
                  border: isSel
                    ? `3px solid ${p.color}`
                    : '3px solid transparent',
                  background: isSel ? p.color + '22' : 'transparent',
                  transition: 'all 0.18s', pointerEvents: 'none' }} />
                {isSel && (
                  <div style={{ position: 'absolute', top: 8, right: 8,
                    width: 22, height: 22, borderRadius: '50%',
                    background: p.color, color: '#fff',
                    fontSize: 13, fontWeight: 900,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 10 }}>
                    ✓
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 選択結果 */}
        {info && (
          <div style={{ marginBottom: 12, padding: '12px 14px',
            background: info.gender === 'M'
              ? 'rgba(74,144,217,0.1)' : 'rgba(232,117,138,0.1)',
            border: `1px solid ${info.color}55`,
            borderRadius: 12, display: 'flex',
            alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 22 }}>
              {info.gender === 'M' ? '💪' : '✨'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800,
                color: info.color, marginBottom: 2 }}>
                {info.label} / 体脂肪率 {info.pct}
              </div>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>
                {info.feat}
              </div>
            </div>
          </div>
        )}

        {/* ボタン */}
        <button
onClick={() => router.push('/fitness-test')}
          disabled={!selId}
          style={{ width: '100%', padding: '14px',
            background: '#39ff14', color: '#000',
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            opacity: !selId ? 0.3 : 1 }}>
          診断へ進む →
        </button>

      </div>
    </div>
  )
}