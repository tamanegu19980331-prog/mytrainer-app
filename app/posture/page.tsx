'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const POSTURE_TYPES = [
  {
    id: 'anterior_tilt', label: '骨盤前傾', emoji: '🔄',
    desc: 'お腹が前に出て腰が反っている',
    detail: '腸腰筋の短縮・臀部筋の弱化が原因。腰痛リスクあり。',
  },
  {
    id: 'posterior_tilt', label: '骨盤後傾', emoji: '🔃',
    desc: 'お尻が下がり背中が丸くなっている',
    detail: 'ハムストリングスの短縮・腹筋の過緊張が原因。膝痛リスクあり。',
  },
  {
    id: 'rounded_shoulders', label: '巻き肩', emoji: '🔵',
    desc: '肩が前に出て内側に巻いている',
    detail: '大胸筋の短縮・菱形筋の弱化が原因。肩こりの主な原因。',
  },
  {
    id: 'kyphosis', label: '猫背', emoji: '🐱',
    desc: '背中が丸く前傾姿勢になっている',
    detail: '脊柱起立筋の弱化・胸椎の柔軟性低下が原因。',
  },
  {
    id: 'straight_neck', label: 'ストレートネック', emoji: '📱',
    desc: '首が前に出てスマホ首になっている',
    detail: '深頸屈筋の弱化が原因。頭痛・肩こりの原因になる。',
  },
  {
    id: 'elevated_shoulders', label: '肩の挙上', emoji: '⬆️',
    desc: '肩が常に上がっている',
    detail: '僧帽筋上部の過緊張が原因。首こりの主な原因。',
  },
  {
    id: 'o_legs', label: 'O脚', emoji: '🦵',
    desc: '膝が外側に開いている',
    detail: '内転筋の弱化・外旋筋の過緊張が原因。膝関節への負担大。',
  },
  {
    id: 'x_legs', label: 'X脚', emoji: '🦿',
    desc: '膝が内側に入っている',
    detail: '中臀筋の弱化・内転筋の過緊張が原因。',
  },
  {
    id: 'xo_legs', label: 'XO脚', emoji: '🔀',
    desc: '膝がX型で足首がO型',
    detail: '複合的な筋バランスの乱れが原因。',
  },
]

export default function PosturePage() {
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string|null>(null)
  const router = useRouter()

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const next = () => {
    localStorage.setItem('mt_posture', JSON.stringify(selected))
    router.push('/diagnosis')
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        {/* ヘッダー */}
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
            姿勢の気になる<br/>部分を選んでください
          </div>
          <div style={{fontSize:14,color:'#666',marginBottom:8}}>
            複数選択できます（なければスキップ）
          </div>
          {selected.length>0&&(
            <div style={{
              display:'inline-block',
              background:'rgba(57,255,20,0.1)',border:'1px solid rgba(57,255,20,0.2)',
              borderRadius:20,padding:'4px 14px',marginBottom:24,
              fontSize:12,color:'#39ff14',fontWeight:600,
            }}>
              {selected.length}項目選択中
            </div>
          )}
          {!selected.length&&<div style={{marginBottom:24}}/>}

          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
            {POSTURE_TYPES.map(p=>{
              const sel = selected.includes(p.id)
              const exp = expanded===p.id
              return (
                <div key={p.id}
                  style={{
                    background:sel?'rgba(57,255,20,0.06)':'#1e1e26',
                    borderRadius:16,
                    border:'1.5px solid '+(sel?'#39ff14':'#2a2a36'),
                    overflow:'hidden',transition:'all 0.2s',
                  }}>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 18px',cursor:'pointer'}}
                    onClick={()=>toggle(p.id)}>
                    <div style={{
                      width:44,height:44,borderRadius:12,
                      background:sel?'rgba(57,255,20,0.15)':'#25252f',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:22,flexShrink:0,transition:'all 0.2s',
                    }}>
                      {p.emoji}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700,color:sel?'#39ff14':'#e8e8e8',marginBottom:2}}>{p.label}</div>
                      <div style={{fontSize:12,color:'#555'}}>{p.desc}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <button
                        onClick={e=>{e.stopPropagation();setExpanded(exp?null:p.id)}}
                        style={{
                          width:28,height:28,borderRadius:8,
                          background:'#25252f',border:'none',
                          color:'#555',fontSize:12,cursor:'pointer',
                          display:'flex',alignItems:'center',justifyContent:'center',
                        }}>
                        {exp?'▲':'▼'}
                      </button>
                      <div style={{
                        width:24,height:24,borderRadius:'50%',
                        background:sel?'#39ff14':'#25252f',
                        border:'2px solid '+(sel?'#39ff14':'#333'),
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:13,transition:'all 0.2s',flexShrink:0,
                      }}>
                        {sel&&'✓'}
                      </div>
                    </div>
                  </div>
                  {exp&&(
                    <div style={{padding:'0 18px 16px',borderTop:'1px solid #2a2a36'}}>
                      <div style={{fontSize:12,color:'#888',lineHeight:1.7,paddingTop:12}}>{p.detail}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button onClick={next}
            style={{
              width:'100%',padding:'18px',
              background:'linear-gradient(135deg,#39ff14,#00c8ff)',
              color:'#000',border:'none',borderRadius:16,
              fontSize:16,fontWeight:800,cursor:'pointer',
              boxShadow:'0 4px 20px rgba(57,255,20,0.2)',
            }}>
            {selected.length>0?`${selected.length}項目を選択して次へ →`:'スキップして次へ →'}
          </button>
        </div>
      </div>
    </div>
  )
}