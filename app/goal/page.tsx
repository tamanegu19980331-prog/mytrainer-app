'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GOALS = [
  {
    id: 'fat_loss',
    label: '脂肪燃焼・ダイエット',
    emoji: '🔥',
    desc: '体脂肪を落としてスリムな体へ',
    color: '#ff6b35',
  },
  {
    id: 'muscle_gain',
    label: '筋肥大・筋力アップ',
    emoji: '💪',
    desc: '筋肉をつけて力強い体へ',
    color: '#39ff14',
  },
  {
    id: 'hip_up',
    label: 'ヒップアップ・引き締め',
    emoji: '✨',
    desc: 'お尻・脚のラインを整える',
    color: '#ff6b9d',
  },
  {
    id: 'posture',
    label: '姿勢改善・体幹強化',
    emoji: '🧍',
    desc: '正しい姿勢と安定した体幹へ',
    color: '#cc44ff',
  },
  {
    id: 'health',
    label: '健康維持・体力向上',
    emoji: '❤️',
    desc: '毎日元気に動ける体づくり',
    color: '#00c8ff',
  },
  {
    id: 'sport',
    label: 'スポーツパフォーマンス向上',
    emoji: '⚡',
    desc: '競技力を高める機能的な体へ',
    color: '#ffd60a',
  },
]

export default function GoalPage() {
  const [selected, setSelected] = useState<string>('')
  const router = useRouter()

  const next = () => {
    if (!selected) return
    const goal = GOALS.find(g => g.id === selected)
    localStorage.setItem('mt_goal', goal?.label || selected)
    router.push('/fitness-test')
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        {/* ヘッダー */}
        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14',letterSpacing:2}}>MY TRAINER</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {[1,2,3,4,5].map(i=>(
              <div key={i} style={{width:i===4?24:8,height:4,borderRadius:4,background:i<=4?'#39ff14':'#2a2a36'}}/>
            ))}
          </div>
        </div>

        <div style={{padding:'32px 24px 0'}}>
          <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:8}}>STEP 4 / 5</div>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.3,marginBottom:8}}>
            目標を<br/>選んでください
          </div>
          <div style={{fontSize:14,color:'#666',marginBottom:32}}>
            あなたの理想の体型に合わせて<br/>最適なメニューを提案します
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
            {GOALS.map(g=>{
              const sel = selected === g.id
              return (
                <button key={g.id} onClick={()=>setSelected(g.id)}
                  style={{
                    width:'100%',padding:'18px 20px',
                    background:sel?`rgba(${g.color==='#39ff14'?'57,255,20':g.color==='#ff6b35'?'255,107,53':g.color==='#ff6b9d'?'255,107,157':g.color==='#cc44ff'?'204,68,255':g.color==='#00c8ff'?'0,200,255':'255,214,10'},0.08)`:'#1e1e26',
                    border:'1.5px solid '+(sel?g.color:'#2a2a36'),
                    borderRadius:16,cursor:'pointer',
                    textAlign:'left',transition:'all 0.2s',
                    display:'flex',alignItems:'center',gap:14,
                  }}>
                  <div style={{
                    width:52,height:52,borderRadius:14,
                    background:sel?`rgba(${g.color==='#39ff14'?'57,255,20':g.color==='#ff6b35'?'255,107,53':g.color==='#ff6b9d'?'255,107,157':g.color==='#cc44ff'?'204,68,255':g.color==='#00c8ff'?'0,200,255':'255,214,10'},0.15)`:'#25252f',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:26,flexShrink:0,transition:'all 0.2s',
                  }}>
                    {g.emoji}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700,color:sel?g.color:'#e8e8e8',marginBottom:2,textAlign:'left'}}>{g.label}</div>
                    <div style={{fontSize:12,color:'#555',textAlign:'left'}}>{g.desc}</div>
                  </div>
                  {sel&&(
                    <div style={{
                      width:24,height:24,borderRadius:'50%',
                      background:g.color,flexShrink:0,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:13,color:'#000',fontWeight:800,
                    }}>✓</div>
                  )}
                </button>
              )
            })}
          </div>

          <button onClick={next} disabled={!selected}
            style={{
              width:'100%',padding:'18px',
              background:selected?'linear-gradient(135deg,#39ff14,#00c8ff)':'#1e1e26',
              color:selected?'#000':'#444',
              border:'none',borderRadius:16,
              fontSize:16,fontWeight:800,
              cursor:selected?'pointer':'not-allowed',
              transition:'all 0.2s',
              boxShadow:selected?'0 4px 20px rgba(57,255,20,0.2)':'none',
            }}>
            次へ → 体力テスト
          </button>
        </div>
      </div>
    </div>
  )
}