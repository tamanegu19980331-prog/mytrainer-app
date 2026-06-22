'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const POSTURE_TYPES = [
  {id:"anterior_tilt",label:"骨盤前傾（反り腰）",emoji:"🔄",color:"#ff8c00",
    check:"壁に背をつけて立ったとき、腰と壁の隙間に手のひらが入りすぎる",
    cause:"腸腰筋・大腿四頭筋の過緊張。デスクワーク・ヒール習慣が原因",
    effect:"腰痛・お腹が出て見える・姿勢が悪く見える",
    improve:"腸腰筋ストレッチ・ハムストリングス強化・腹横筋トレーニング",
    exercises:["ハーフニーリングストレッチ","ヒップリフト","ドローイン","デッドバッグ"]},
  {id:"posterior_tilt",label:"骨盤後傾",emoji:"🔄",color:"#ff6b9d",
    check:"壁に背をつけて立ったとき、腰と壁の隙間がほぼない",
    cause:"ハムストリングス・腹筋の過緊張。長時間の座り仕事が原因",
    effect:"腰痛・お尻が垂れる・膝へのストレス増加",
    improve:"ハムストリングスストレッチ・腰背部強化・大腿四頭筋の活性化",
    exercises:["ハムストリングスストレッチ","バードドッグ","ヒップヒンジ","コブラポーズ"]},
  {id:"rounded_shoulders",label:"巻き肩",emoji:"🔄",color:"#00c8ff",
    check:"力を抜いて立ったとき、手の甲が前を向いている",
    cause:"胸筋の過緊張・菱形筋の弱化。スマホ・PC作業が原因",
    effect:"肩こり・首こり・猫背の原因・深呼吸しにくい",
    improve:"胸筋ストレッチ・菱形筋強化・肩甲骨の安定性向上",
    exercises:["胸筋ストレッチ","フェイスプル","Wエクスサイズ","YTWL"]},
  {id:"kyphosis",label:"猫背",emoji:"🐱",color:"#39ff14",
    check:"横から見たとき、背中が丸く上半身が前傾している",
    cause:"脊柱起立筋の弱化・腹筋の過緊張。長時間の前傾姿勢が原因",
    effect:"肩こり・腰痛・見た目が老けて見える・呼吸が浅くなる",
    improve:"胸椎の可動性向上・脊柱起立筋強化・姿勢意識の改善",
    exercises:["胸椎モビリティ","スーパーマン","バックエクステンション","YTWL"]},
  {id:"straight_neck",label:"ストレートネック",emoji:"📱",color:"#cc44ff",
    check:"横から見たとき、耳が肩より前に出ている",
    cause:"スマホ・PCの長時間使用。頭が前に出る習慣が原因",
    effect:"首こり・頭痛・腕のしびれ・集中力低下",
    improve:"頸椎の自然カーブ回復・深頸屈筋の強化",
    exercises:["チンタック","頸部後面ストレッチ","肩甲骨ほぐし","YTWL壁立ち版"]},
  {id:"elevated_shoulders",label:"肩が上がっている",emoji:"💆",color:"#ffd60a",
    check:"正面から見たとき、左右の肩の高さが違う・常に肩がすくんでいる",
    cause:"僧帽筋上部の過緊張・ストレスや緊張も原因",
    effect:"肩こり・首こり・頭痛・表情が暗く見える",
    improve:"僧帽筋上部のリリース・肩甲骨の下制",
    exercises:["ネックストレッチ","肩下げエクササイズ","ショルダーパッキング","YTWL"]},
  {id:"o_legs",label:"O脚",emoji:"🦵",color:"#ff4455",
    check:"両足のくるぶしをつけて立ったとき、膝の間に隙間がある",
    cause:"股関節外旋筋の過緊張・内転筋の弱化",
    effect:"膝・腰への負担増加・見た目のコンプレックス",
    improve:"内転筋強化・股関節外旋筋ストレッチ",
    exercises:["内転筋スクイーズ","クラムシェル","鳩のポーズ","スモウスクワット"]},
  {id:"x_legs",label:"X脚",emoji:"🦵",color:"#e8758a",
    check:"両膝をつけて立ったとき、足首の間に隙間がある",
    cause:"内転筋の過緊張・中臀筋の弱化",
    effect:"膝関節への負担・捻挫しやすい",
    improve:"中臀筋強化・内転筋ストレッチ・膝のアライメント改善",
    exercises:["サイドレッグレイズ","蝶のポーズ","シングルスクワット","ヒップアブダクション"]},
  {id:"xo_legs",label:"XO脚",emoji:"🦵",color:"#ff8c00",
    check:"膝はくっついているが足首が開く",
    cause:"O脚とX脚の複合型。足部アーチの低下",
    effect:"膝・足首への複合的な負担・疲れやすい",
    improve:"足部アーチ強化・内転筋と中臀筋のバランス調整",
    exercises:["タオルグリップ","カーフレイズ","クラムシェル","内転筋スクイーズ"]},
]

export default function PosturePage() {
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<any>(null)
  const router = useRouter()

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const confirm = () => {
    localStorage.setItem('mt_posture', JSON.stringify(selected))
    router.push('/diagnosis')
  }

  // 詳細モーダル
  if (detail) return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px' }}>
        <div style={{ padding: '14px 0 12px',
          borderBottom: '1px solid #2a2a36',
          display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setDetail(null)}
            style={{ background: 'none', border: 'none',
              color: '#666', fontSize: 20, cursor: 'pointer',
              marginRight: 8 }}>←</button>
          <span style={{ fontSize: 11, fontWeight: 800,
            color: '#cc44ff', letterSpacing: 3 }}>🔍 セルフチェック</span>
        </div>

        <div style={{ background: '#1e1e26', borderRadius: 16,
          padding: '20px 16px',
          border: `1px solid ${detail.color}66` }}>
          <div style={{ display: 'flex', alignItems: 'center',
            gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>{detail.emoji}</span>
            <div style={{ fontSize: 18, fontWeight: 800,
              color: detail.color }}>{detail.label}</div>
          </div>

          {[
            {label:"✅ チェック方法", color:"#39ff14", text:detail.check},
            {label:"⚠️ 主な原因",   color:"#ffd60a", text:detail.cause},
            {label:"😔 放置すると", color:"#ff4455", text:detail.effect},
            {label:"💪 改善アプローチ", color:"#00c8ff", text:detail.improve},
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 12px',
              background: '#25252f', borderRadius: 10, marginBottom: 8,
              borderLeft: `3px solid ${item.color}` }}>
              <div style={{ fontSize: 10, color: item.color,
                fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: '#e8e8e8',
                lineHeight: 1.6 }}>{item.text}</div>
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#cc44ff',
              fontWeight: 700, marginBottom: 8 }}>📋 改善エクササイズ</div>
            {detail.exercises.map((ex: string, i: number) => (
              <div key={i} style={{ padding: '8px 12px',
                background: '#25252f', borderRadius: 8,
                marginBottom: 6, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: detail.color, fontWeight: 700 }}>
                  {i + 1}.
                </span>
                {ex}
              </div>
            ))}
          </div>

          <button onClick={() => {
            toggle(detail.id)
            setDetail(null)
          }} style={{ marginTop: 12, width: '100%', padding: '13px',
            background: selected.includes(detail.id)
              ? '#ff4455' : detail.color,
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            {selected.includes(detail.id)
              ? '✓ 選択済み（タップで解除）'
              : 'この姿勢タイプを選択する'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#16161a', minHeight: '100vh',
      color: '#e8e8e8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '20px 16px' }}>

        <div style={{ padding: '14px 0 12px',
          borderBottom: '1px solid #2a2a36',
          display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 800,
            color: '#cc44ff', letterSpacing: 3 }}>🧍 姿勢チェック</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#666' }}>
            複数選択可
          </span>
        </div>

        <div style={{ background: 'rgba(204,68,255,0.08)',
          border: '1px solid rgba(204,68,255,0.3)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#cc44ff',
            fontWeight: 700, marginBottom: 4 }}>📋 使い方</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>
            当てはまる姿勢タイプを選択してください。
            「詳細・チェック方法」でセルフチェックの方法も確認できます。
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#cc44ff',
          fontWeight: 700, marginBottom: 12 }}>
          {selected.length}項目選択中
        </div>

        {POSTURE_TYPES.map(pt => (
          <div key={pt.id} style={{
            background: selected.includes(pt.id) ? pt.color + '15' : '#1e1e26',
            border: `2px solid ${selected.includes(pt.id) ? pt.color : '#2a2a36'}`,
            borderRadius: 14, padding: '14px',
            marginBottom: 10, transition: 'all 0.18s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div onClick={() => toggle(pt.id)}
                style={{ width: 24, height: 24, borderRadius: '50%',
                  background: selected.includes(pt.id) ? pt.color : '#25252f',
                  border: `2px solid ${selected.includes(pt.id) ? pt.color : '#2a2a36'}`,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12,
                  fontWeight: 900, color: '#fff',
                  flexShrink: 0, cursor: 'pointer' }}>
                {selected.includes(pt.id) ? '✓' : ''}
              </div>
              <div onClick={() => toggle(pt.id)}
                style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 800,
                  color: selected.includes(pt.id) ? pt.color : '#e8e8e8' }}>
                  {pt.emoji} {pt.label}
                </div>
                <div style={{ fontSize: 11, color: '#555',
                  marginTop: 2, lineHeight: 1.4 }}>
                  {pt.check.slice(0, 30)}...
                </div>
              </div>
              <button onClick={() => setDetail(pt)}
                style={{ padding: '5px 10px', background: 'transparent',
                  border: `1px solid ${pt.color}66`, borderRadius: 8,
                  color: pt.color, fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', flexShrink: 0 }}>
                詳細・<br/>チェック
              </button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8, marginBottom: 20 }}>
          <button onClick={confirm}
            style={{ width: '100%', padding: '14px',
              background: '#39ff14', color: '#000',
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
            {selected.length === 0
              ? '姿勢の問題なし・スキップ →'
              : `${selected.length}項目を選択して次へ →`}
          </button>
        </div>

      </div>
    </div>
  )
}