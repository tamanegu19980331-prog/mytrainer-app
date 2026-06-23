'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function BodyPage() {
  const [user, setUser] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [form, setForm] = useState({ weight: '', fat: '', muscle: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUser(user)
    const { data } = await supabase
      .from('body_records').select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(30)
    setRecords(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.weight) return
    setSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    const bmi = form.weight && user
      ? Number(form.weight) / ((170 / 100) ** 2)
      : 0
    await supabase.from('body_records').insert({
      user_id: user.id,
      date: today,
      weight: Number(form.weight),
      fat: form.fat ? Number(form.fat) : null,
      muscle: form.muscle ? Number(form.muscle) : null,
      bmi: Math.round(bmi * 10) / 10,
    })
    setForm({ weight: '', fat: '', muscle: '' })
    await init()
    setSaving(false)
  }

  if (loading) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14'}}>Loading...</div>
    </div>
  )

  const maxWeight = Math.max(...records.map(r => r.weight), 0)
  const minWeight = Math.min(...records.map(r => r.weight), 999)
  const latest = records[records.length - 1]
  const first = records[0]
  const diff = latest && first ? (latest.weight - first.weight).toFixed(1) : null

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 40px'}}>

        {/* ヘッダー */}
        <div style={{padding:'14px 16px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>router.push('/dashboard')} style={{background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer'}}>←</button>
          <div style={{fontSize:11,fontWeight:800,color:'#39ff14',letterSpacing:3}}>体重・体組成記録</div>
        </div>

        {/* 最新データ */}
        {latest && (
          <div style={{margin:'16px',background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36'}}>
            <div style={{fontSize:10,color:'#39ff14',fontWeight:700,marginBottom:12}}>最新データ</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[
                {label:'体重',value:latest.weight+'kg',color:'#39ff14'},
                {label:'体脂肪率',value:latest.fat?latest.fat+'%':'-',color:'#ff6b9d'},
                {label:'筋肉量',value:latest.muscle?latest.muscle+'kg':'-',color:'#00c8ff'},
              ].map(item=>(
                <div key={item.label} style={{background:'#25252f',borderRadius:10,padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'#666',marginBottom:4}}>{item.label}</div>
                  <div style={{fontSize:16,fontWeight:800,color:item.color}}>{item.value}</div>
                </div>
              ))}
            </div>
            {diff && (
              <div style={{marginTop:10,textAlign:'center',fontSize:12,color:Number(diff)<0?'#39ff14':'#ff4455',fontWeight:700}}>
                開始時から {Number(diff)>0?'+':''}{diff}kg
              </div>
            )}
          </div>
        )}

        {/* グラフ */}
        {records.length > 1 && (
          <div style={{margin:'0 16px 16px',background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36'}}>
            <div style={{fontSize:10,color:'#39ff14',fontWeight:700,marginBottom:12}}>体重推移</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,height:120}}>
              {records.map((r,i)=>{
                const range = maxWeight - minWeight || 1
                const height = ((r.weight - minWeight) / range) * 90 + 10
                return (
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{fontSize:8,color:'#666'}}>{r.weight}</div>
                    <div style={{width:'100%',height:height,background:'#39ff14',borderRadius:'4px 4px 0 0',opacity:i===records.length-1?1:0.5}}/>
                    <div style={{fontSize:7,color:'#666',transform:'rotate(-45deg)',transformOrigin:'center'}}>
                      {r.date.slice(5)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 記録フォーム */}
        <div style={{margin:'0 16px 16px',background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36'}}>
          <div style={{fontSize:10,color:'#39ff14',fontWeight:700,marginBottom:12}}>今日の記録</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
            {[
              {key:'weight',label:'体重 (kg)',placeholder:'70'},
              {key:'fat',label:'体脂肪率 (%)',placeholder:'20'},
              {key:'muscle',label:'筋肉量 (kg)',placeholder:'50'},
            ].map(item=>(
              <div key={item.key}>
                <div style={{fontSize:9,color:'#666',marginBottom:4}}>{item.label}</div>
                <input type="number" step="0.1"
                  value={(form as any)[item.key]}
                  onChange={e=>setForm(f=>({...f,[item.key]:e.target.value}))}
                  placeholder={item.placeholder}
                  style={{width:'100%',background:'#25252f',border:'1px solid #2a2a36',borderRadius:8,padding:'8px',color:'#e8e8e8',fontSize:13,outline:'none'}}
                />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving||!form.weight}
            style={{width:'100%',padding:'12px',background:'#39ff14',color:'#000',border:'none',borderRadius:10,fontSize:13,fontWeight:800,cursor:'pointer',opacity:saving||!form.weight?0.3:1}}>
            {saving?'保存中...':'記録する'}
          </button>
        </div>

        {/* 履歴一覧 */}
        <div style={{margin:'0 16px'}}>
          <div style={{fontSize:10,color:'#666',fontWeight:700,marginBottom:10}}>記録履歴</div>
          {records.slice().reverse().map(r=>(
            <div key={r.id} style={{background:'#1e1e26',borderRadius:10,padding:'10px 14px',border:'1px solid #2a2a36',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:11,color:'#666'}}>{r.date}</div>
              <div style={{display:'flex',gap:12}}>
                <span style={{fontSize:13,fontWeight:700,color:'#39ff14'}}>{r.weight}kg</span>
                {r.fat&&<span style={{fontSize:11,color:'#ff6b9d'}}>{r.fat}%</span>}
                {r.muscle&&<span style={{fontSize:11,color:'#00c8ff'}}>{r.muscle}kg</span>}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}