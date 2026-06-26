'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function BodyPage() {
  const [user, setUser] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [form, setForm] = useState({ weight: '', fat: '', muscle: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [graphTab, setGraphTab] = useState<'weight'|'fat'|'muscle'>('weight')
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
    const bmi = Number(form.weight) / ((170 / 100) ** 2)
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
      <div style={{color:'#39ff14',fontSize:14}}>読み込み中...</div>
    </div>
  )

  const latest = records[records.length - 1]
  const first = records[0]
  const diff = latest && first ? (latest.weight - first.weight).toFixed(1) : null

  const graphConfig = {
    weight: { key: 'weight', label: '体重', unit: 'kg', color: '#39ff14' },
    fat: { key: 'fat', label: '体脂肪率', unit: '%', color: '#ff6b9d' },
    muscle: { key: 'muscle', label: '筋肉量', unit: 'kg', color: '#00c8ff' },
  }

  const gc = graphConfig[graphTab]
  const chartData = records
    .filter(r => r[gc.key] != null)
    .map(r => ({
      date: r.date.slice(5),
      value: r[gc.key],
    }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background:'#1e1e26',border:`1px solid ${gc.color}44`,
          borderRadius:10,padding:'10px 14px',
        }}>
          <div style={{fontSize:11,color:'#666',marginBottom:4}}>{label}</div>
          <div style={{fontSize:16,fontWeight:800,color:gc.color}}>
            {payload[0].value}{gc.unit}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

        {/* ヘッダー */}
        <div style={{
          padding:'20px 24px',
          display:'flex',alignItems:'center',gap:12,
          borderBottom:'1px solid #1e1e26',
        }}>
          <button onClick={()=>router.push('/dashboard')}
            style={{background:'none',border:'none',color:'#666',fontSize:24,cursor:'pointer',padding:0}}>
            ←
          </button>
          <div>
            <div style={{fontSize:11,color:'#00c8ff',fontWeight:700,letterSpacing:2,marginBottom:2}}>BODY RECORD</div>
            <div style={{fontSize:18,fontWeight:800}}>体重・体組成記録</div>
          </div>
        </div>

        <div style={{padding:'20px 24px 0'}}>

          {/* 最新データ */}
          {latest && (
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'24px',
              border:'1px solid #2a2a36',marginBottom:16,
            }}>
              <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:16}}>最新データ</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
                {[
                  {label:'体重',value:latest.weight+'kg',color:'#39ff14'},
                  {label:'体脂肪率',value:latest.fat?latest.fat+'%':'-',color:'#ff6b9d'},
                  {label:'筋肉量',value:latest.muscle?latest.muscle+'kg':'-',color:'#00c8ff'},
                ].map(item=>(
                  <div key={item.label} style={{
                    background:'#25252f',borderRadius:14,
                    padding:'14px 10px',textAlign:'center',
                  }}>
                    <div style={{fontSize:11,color:'#555',marginBottom:6}}>{item.label}</div>
                    <div style={{fontSize:18,fontWeight:800,color:item.color}}>{item.value}</div>
                  </div>
                ))}
              </div>
              {diff && (
                <div style={{
                  background:Number(diff)<0?'rgba(57,255,20,0.06)':'rgba(255,68,85,0.06)',
                  border:'1px solid '+(Number(diff)<0?'rgba(57,255,20,0.2)':'rgba(255,68,85,0.2)'),
                  borderRadius:10,padding:'10px 14px',
                  fontSize:13,fontWeight:700,
                  color:Number(diff)<0?'#39ff14':'#ff4455',
                  textAlign:'center',
                }}>
                  開始時から {Number(diff)>0?'+':''}{diff}kg
                </div>
              )}
            </div>
          )}

          {/* グラフ */}
          {records.length > 1 && (
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'24px',
              border:'1px solid #2a2a36',marginBottom:16,
            }}>
              {/* グラフタブ */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:20}}>
                {[
                  {v:'weight',l:'体重',c:'#39ff14'},
                  {v:'fat',l:'体脂肪率',c:'#ff6b9d'},
                  {v:'muscle',l:'筋肉量',c:'#00c8ff'},
                ].map(t=>(
                  <button key={t.v} onClick={()=>setGraphTab(t.v as any)}
                    style={{
                      padding:'8px 4px',
                      background:graphTab===t.v?'rgba(57,255,20,0.08)':'#25252f',
                      border:'1.5px solid '+(graphTab===t.v?t.c:'#2a2a36'),
                      borderRadius:10,color:graphTab===t.v?t.c:'#555',
                      fontSize:11,fontWeight:700,cursor:'pointer',
                      transition:'all 0.2s',
                    }}>
                    {t.l}
                  </button>
                ))}
              </div>

              {chartData.length < 2 ? (
                <div style={{textAlign:'center',padding:'20px 0',color:'#444',fontSize:13}}>
                  {gc.label}のデータが不足しています
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{top:5,right:10,left:-20,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a36"/>
                    <XAxis
                      dataKey="date"
                      tick={{fill:'#444',fontSize:10}}
                      axisLine={{stroke:'#2a2a36'}}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{fill:'#444',fontSize:10}}
                      axisLine={{stroke:'#2a2a36'}}
                      tickLine={false}
                      domain={['auto','auto']}
                    />
                    <Tooltip content={<CustomTooltip/>}/>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={gc.color}
                      strokeWidth={2.5}
                      dot={{fill:gc.color,strokeWidth:0,r:4}}
                      activeDot={{r:6,fill:gc.color}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* 記録フォーム */}
          <div style={{
            background:'#1e1e26',borderRadius:20,padding:'24px',
            border:'1px solid #2a2a36',marginBottom:16,
          }}>
            <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:4}}>今日の記録</div>
            <div style={{fontSize:11,color:'#444',marginBottom:16}}>
              体脂肪率・筋肉量は体組成計をお持ちの方のみ入力してください
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
              {[
                {key:'weight',label:'体重',unit:'kg',placeholder:'70',required:true},
                {key:'fat',label:'体脂肪率',unit:'%',placeholder:'20',required:false},
                {key:'muscle',label:'筋肉量',unit:'kg',placeholder:'50',required:false},
              ].map(item=>(
                <div key={item.key}>
                  <div style={{marginBottom:6}}>
                    <span style={{fontSize:11,color:'#555'}}>{item.label}</span>
                    {item.required
                      ? <span style={{fontSize:10,color:'#ff4455',marginLeft:3}}>*必須</span>
                      : <span style={{fontSize:9,color:'#333',marginLeft:3,display:'block'}}>体組成計のみ</span>
                    }
                  </div>
                  <div style={{position:'relative'}}>
                    <input type="number" step="0.1"
                      value={(form as any)[item.key]}
                      onChange={e=>setForm(f=>({...f,[item.key]:e.target.value}))}
                      placeholder={item.placeholder}
                      style={{
                        width:'100%',background:'#25252f',
                        border:'1.5px solid '+((form as any)[item.key]?'#39ff14':'#2a2a36'),
                        borderRadius:12,padding:'12px 28px 12px 12px',
                        color:'#e8e8e8',fontSize:16,fontWeight:700,
                        outline:'none',transition:'border 0.2s',
                      }}
                    />
                    <div style={{
                      position:'absolute',right:8,top:'50%',
                      transform:'translateY(-50%)',
                      fontSize:11,color:'#444',fontWeight:600,
                    }}>
                      {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={save} disabled={saving||!form.weight}
              style={{
                width:'100%',padding:'16px',
                background:form.weight?'linear-gradient(135deg,#39ff14,#00c8ff)':'#25252f',
                color:form.weight?'#000':'#444',
                border:'none',borderRadius:14,
                fontSize:15,fontWeight:800,
                cursor:form.weight?'pointer':'not-allowed',
                opacity:saving?0.7:1,
                transition:'all 0.2s',
              }}>
              {saving?'保存中...':'記録する'}
            </button>
          </div>

          {/* 履歴 */}
          {records.length > 0 && (
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'24px',
              border:'1px solid #2a2a36',
            }}>
              <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:14}}>記録履歴</div>
              {records.slice().reverse().map(r=>(
                <div key={r.id} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'12px 0',borderBottom:'1px solid #1a1a22',
                }}>
                  <div style={{fontSize:13,color:'#555'}}>{r.date}</div>
                  <div style={{display:'flex',gap:16,alignItems:'center'}}>
                    <span style={{fontSize:15,fontWeight:800,color:'#39ff14'}}>{r.weight}kg</span>
                    {r.fat&&<span style={{fontSize:12,color:'#ff6b9d'}}>{r.fat}%</span>}
                    {r.muscle&&<span style={{fontSize:12,color:'#00c8ff'}}>{r.muscle}kg</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}