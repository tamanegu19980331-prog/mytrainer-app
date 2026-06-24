'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [profile, setProfile] = useState({
    name: '', gender: '', height: '', weight: '', age: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const bmi = profile.height && profile.weight
    ? (Number(profile.weight) / ((Number(profile.height) / 100) ** 2)).toFixed(1)
    : null

  const bmiColor = !bmi ? '#666'
    : Number(bmi) < 18.5 ? '#00c8ff'
    : Number(bmi) < 25 ? '#39ff14'
    : Number(bmi) < 30 ? '#ffd60a' : '#ff4455'

  const bmiLabel = !bmi ? ''
    : Number(bmi) < 18.5 ? '低体重'
    : Number(bmi) < 25 ? '標準'
    : Number(bmi) < 30 ? '過体重' : '肥満'

  const saveProfile = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('users').upsert({
        id: user.id,
        name: profile.name,
        gender: profile.gender,
        height: Number(profile.height),
        weight: Number(profile.weight),
        age: Number(profile.age),
      })
      router.push('/posture')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const isValid = profile.name && profile.gender && profile.height && profile.weight && profile.age

  const AGE_GROUPS = [
    {label:'10代', value:'15'},
    {label:'20代', value:'25'},
    {label:'30代', value:'35'},
    {label:'40代', value:'45'},
    {label:'50代以上', value:'55'},
  ]

  const getSelectedAge = () => {
    const age = Number(profile.age)
    if (age < 20) return '15'
    if (age < 30) return '25'
    if (age < 40) return '35'
    if (age < 50) return '45'
    if (age >= 50) return '55'
    return ''
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        {/* ヘッダー */}
        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14',letterSpacing:2}}>MY TRAINER</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {[1,2,3,4,5].map(i=>(
              <div key={i} style={{width:i===1?24:8,height:4,borderRadius:4,background:i===1?'#39ff14':'#2a2a36'}}/>
            ))}
          </div>
        </div>

        <div style={{padding:'32px 24px 0'}}>
          <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:8}}>STEP 1 / 5</div>
          <div style={{fontSize:28,fontWeight:800,lineHeight:1.3,marginBottom:8}}>
            あなたの情報を<br/>教えてください
          </div>
          <div style={{fontSize:14,color:'#666',marginBottom:32}}>
            最適なトレーニングを提案するために<br/>基本情報が必要です
          </div>

          {/* ニックネーム */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:10}}>ニックネーム</div>
            <input
              style={{
                width:'100%', background:'#1e1e26',
                border:'1.5px solid '+(profile.name?'#39ff14':'#2a2a36'),
                borderRadius:14, padding:'16px 18px',
                color:'#e8e8e8', fontSize:16, outline:'none',
                transition:'border 0.2s',
              }}
              placeholder="例：たろう"
              value={profile.name}
              onChange={e=>setProfile(p=>({...p,name:e.target.value}))}
            />
          </div>

          {/* 性別 */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:10}}>性別</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[{v:'男性',emoji:'👨',label:'男性'},{v:'女性',emoji:'👩',label:'女性'}].map(g=>(
                <button key={g.v} onClick={()=>setProfile(p=>({...p,gender:g.v}))}
                  style={{
                    padding:'20px 16px',
                    background:profile.gender===g.v?'rgba(57,255,20,0.08)':'#1e1e26',
                    border:'1.5px solid '+(profile.gender===g.v?'#39ff14':'#2a2a36'),
                    borderRadius:14, color:profile.gender===g.v?'#39ff14':'#888',
                    fontSize:15, fontWeight:700, cursor:'pointer',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                    transition:'all 0.2s',
                  }}>
                  <span style={{fontSize:28}}>{g.emoji}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 年代 */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:10}}>年代</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {AGE_GROUPS.map(a=>(
                <button key={a.value} onClick={()=>setProfile(p=>({...p,age:a.value}))}
                  style={{
                    flex:1, minWidth:60, padding:'14px 8px',
                    background:getSelectedAge()===a.value?'rgba(57,255,20,0.08)':'#1e1e26',
                    border:'1.5px solid '+(getSelectedAge()===a.value?'#39ff14':'#2a2a36'),
                    borderRadius:12, color:getSelectedAge()===a.value?'#39ff14':'#888',
                    fontSize:13, fontWeight:700, cursor:'pointer',
                    transition:'all 0.2s',
                  }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* 身長・体重 */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:10}}>身長・体重</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {key:'height',label:'身長',unit:'cm',placeholder:'170'},
                {key:'weight',label:'体重',unit:'kg',placeholder:'65'},
              ].map(item=>(
                <div key={item.key} style={{position:'relative'}}>
                  <div style={{fontSize:11,color:'#666',marginBottom:6}}>{item.label}</div>
                  <div style={{position:'relative'}}>
                    <input type="number"
                      style={{
                        width:'100%', background:'#1e1e26',
                        border:'1.5px solid '+((profile as any)[item.key]?'#39ff14':'#2a2a36'),
                        borderRadius:14, padding:'16px 44px 16px 18px',
                        color:'#e8e8e8', fontSize:18, fontWeight:700,
                        outline:'none', transition:'border 0.2s',
                      }}
                      placeholder={item.placeholder}
                      value={(profile as any)[item.key]}
                      onChange={e=>setProfile(p=>({...p,[item.key]:e.target.value}))}
                    />
                    <div style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#666',fontWeight:600}}>
                      {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BMI */}
          {bmi&&(
            <div style={{
              background:'#1e1e26', borderRadius:14, padding:'16px 18px',
              marginBottom:24, border:'1px solid #2a2a36',
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div>
                  <div style={{fontSize:12,color:'#666',marginBottom:2}}>BMI</div>
                  <div style={{fontSize:11,color:bmiColor,fontWeight:600}}>{bmiLabel}</div>
                </div>
                <div style={{fontSize:32,fontWeight:800,color:bmiColor}}>{bmi}</div>
              </div>
              <div style={{background:'#2a2a36',borderRadius:6,overflow:'hidden',height:6}}>
                <div style={{height:'100%',width:`${Math.min((Number(bmi)/40)*100,100)}%`,background:bmiColor,borderRadius:6,transition:'width 0.5s'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#444',marginTop:6}}>
                <span>低体重</span><span>標準</span><span>過体重</span><span>肥満</span>
              </div>
            </div>
          )}

          {/* ボタン */}
          <button onClick={saveProfile} disabled={loading||!isValid}
            style={{
              width:'100%', padding:'18px',
              background:isValid?'#39ff14':'#1e1e26',
              color:isValid?'#000':'#444',
              border:'none', borderRadius:16,
              fontSize:16, fontWeight:800,
              cursor:isValid?'pointer':'not-allowed',
              opacity:loading?0.7:1,
              transition:'all 0.2s',
            }}>
            {loading?'保存中...':'次へ → 姿勢チェック'}
          </button>
        </div>
      </div>
    </div>
  )
}