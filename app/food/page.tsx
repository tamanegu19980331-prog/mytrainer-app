'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function FoodPage() {
  const [image, setImage] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUserId(user.id)
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('food_logs').select('*')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .order('created_at', { ascending: false })
    setLogs(data || [])
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMimeType(file.type)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setImage(base64)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (!image) return
    setLoading(true)
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image, mimeType }),
      })
      const data = await res.json()
      setResult(data)
      if (userId && data.items) {
        for (const item of data.items) {
          const { data: saved } = await supabase.from('food_logs').insert({
            user_id: userId,
            food_name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            items: item.ingredients,
            advice: data.advice,
            rating: data.rating,
          }).select().single()
          if (saved) setLogs(l => [saved, ...l])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const deleteLog = async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id)
    setLogs(l => l.filter(x => x.id !== id))
  }

  const ratingColor = (r: string) =>
    r === '良い' ? '#39ff14' : r === '普通' ? '#ffd60a' : '#ff4455'

  const totalCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0)
  const totalProtein = logs.reduce((sum, l) => sum + (Number(l.protein) || 0), 0)
  const totalCarbs = logs.reduce((sum, l) => sum + (Number(l.carbs) || 0), 0)
  const totalFat = logs.reduce((sum, l) => sum + (Number(l.fat) || 0), 0)

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 60px'}}>

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
            <div style={{fontSize:11,color:'#ff8c00',fontWeight:700,letterSpacing:2,marginBottom:2}}>FOOD AI</div>
            <div style={{fontSize:18,fontWeight:800}}>食事AI分析</div>
          </div>
        </div>

        <div style={{padding:'20px 24px 0'}}>

          {/* 今日のサマリー */}
          {logs.length > 0 && (
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'24px',
              border:'1px solid #2a2a36',marginBottom:16,
            }}>
              <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:14}}>今日の合計</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div style={{background:'#25252f',borderRadius:14,padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#555',marginBottom:6}}>総カロリー</div>
                  <div style={{fontSize:26,fontWeight:800,color:'#ff8c00'}}>{totalCalories}</div>
                  <div style={{fontSize:11,color:'#444'}}>kcal</div>
                </div>
                <div style={{background:'#25252f',borderRadius:14,padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#555',marginBottom:6}}>食事数</div>
                  <div style={{fontSize:26,fontWeight:800,color:'#cc44ff'}}>{logs.length}</div>
                  <div style={{fontSize:11,color:'#444'}}>食</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[
                  {label:'炭水化物',value:totalCarbs.toFixed(1),unit:'g',color:'#ffd60a'},
                  {label:'たんぱく質',value:totalProtein.toFixed(1),unit:'g',color:'#00c8ff'},
                  {label:'脂質',value:totalFat.toFixed(1),unit:'g',color:'#ff6b9d'},
                ].map(item=>(
                  <div key={item.label} style={{background:'#25252f',borderRadius:12,padding:'12px 8px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#555',marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:18,fontWeight:800,color:item.color}}>{item.value}</div>
                    <div style={{fontSize:10,color:'#444'}}>{item.unit}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 写真アップロード */}
          <div style={{
            background:'#1e1e26',borderRadius:20,padding:'24px',
            border:'1px solid #2a2a36',marginBottom:16,
          }}>
            <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:14}}>食事を撮影・選択</div>
            <label style={{display:'block',cursor:'pointer',marginBottom:14}}>
              <div style={{
                background:'#25252f',
                border:`2px dashed ${image?'#39ff14':'#2a2a36'}`,
                borderRadius:16,padding:'32px 20px',
                textAlign:'center',transition:'all 0.2s',
              }}>
                {image ? (
                  <div>
                    <div style={{fontSize:32,marginBottom:8}}>✅</div>
                    <div style={{fontSize:14,fontWeight:700,color:'#39ff14'}}>写真を選択しました</div>
                    <div style={{fontSize:12,color:'#555',marginTop:4}}>タップして変更</div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize:40,marginBottom:8}}>📷</div>
                    <div style={{fontSize:14,fontWeight:700,color:'#888'}}>タップして写真を選択</div>
                    <div style={{fontSize:12,color:'#444',marginTop:4}}>複数の料理も一括分析できます</div>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" capture="environment"
                onChange={handleImage} style={{display:'none'}}/>
            </label>
            <button onClick={analyze} disabled={!image||loading}
              style={{
                width:'100%',padding:'18px',
                background:image&&!loading?'linear-gradient(135deg,#ff8c00,#ff4455)':'#25252f',
                color:image&&!loading?'#fff':'#444',
                border:'none',borderRadius:14,
                fontSize:16,fontWeight:800,
                cursor:image&&!loading?'pointer':'not-allowed',
                transition:'all 0.2s',
                boxShadow:image&&!loading?'0 4px 20px rgba(255,140,0,0.2)':'none',
              }}>
              {loading?'🤖 AI分析中...':'🤖 AIで分析する'}
            </button>
          </div>

          {/* ローディング */}
          {loading && (
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'32px 24px',
              border:'1px solid #2a2a36',marginBottom:16,textAlign:'center',
            }}>
              <div style={{fontSize:40,marginBottom:12}}>🤖</div>
              <div style={{fontSize:15,fontWeight:700,color:'#ff8c00',marginBottom:4}}>AIが食事を分析中...</div>
              <div style={{fontSize:12,color:'#444'}}>料理を1品ずつ識別しています</div>
            </div>
          )}

          {/* 分析結果 */}
          {result && !loading && (
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'24px',
              border:'1px solid #2a2a36',marginBottom:16,
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:700,color:'#e8e8e8'}}>分析結果</div>
                <span style={{
                  fontSize:12,
                  background:ratingColor(result.rating)+'15',
                  border:'1px solid '+ratingColor(result.rating)+'44',
                  color:ratingColor(result.rating),
                  borderRadius:20,padding:'4px 12px',fontWeight:700,
                }}>
                  {result.rating}
                </span>
              </div>

              <div style={{
                background:'rgba(255,140,0,0.06)',border:'1px solid rgba(255,140,0,0.2)',
                borderRadius:14,padding:'16px',marginBottom:16,
                display:'flex',justifyContent:'space-around',
              }}>
                {[
                  {label:'合計カロリー',value:result.totalCalories,unit:'kcal',color:'#ff8c00'},
                  {label:'たんぱく質',value:result.totalProtein,unit:'g',color:'#00c8ff'},
                  {label:'炭水化物',value:result.totalCarbs,unit:'g',color:'#ffd60a'},
                  {label:'脂質',value:result.totalFat,unit:'g',color:'#ff6b9d'},
                ].map(item=>(
                  <div key={item.label} style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'#555',marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:16,fontWeight:800,color:item.color}}>{item.value}</div>
                    <div style={{fontSize:9,color:'#444'}}>{item.unit}</div>
                  </div>
                ))}
              </div>

              {result.items && result.items.length > 0 && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:'#555',fontWeight:600,marginBottom:10}}>
                    識別した料理 ({result.items.length}品)
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {result.items.map((item: any, i: number)=>(
                      <div key={i} style={{
                        background:'#25252f',borderRadius:12,padding:'12px 14px',
                        border:'1px solid #2a2a36',
                      }}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <div style={{fontSize:14,fontWeight:700}}>{item.name}</div>
                          <div style={{fontSize:14,fontWeight:800,color:'#ff8c00'}}>{item.calories}kcal</div>
                        </div>
                        <div style={{display:'flex',gap:12}}>
                          <span style={{fontSize:11,color:'#00c8ff'}}>P:{item.protein}g</span>
                          <span style={{fontSize:11,color:'#ffd60a'}}>C:{item.carbs}g</span>
                          <span style={{fontSize:11,color:'#ff6b9d'}}>F:{item.fat}g</span>
                        </div>
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:8}}>
                            {item.ingredients.map((ing: string, j: number)=>(
                              <span key={j} style={{
                                fontSize:10,background:'#1e1e26',
                                border:'1px solid #2a2a36',borderRadius:6,
                                padding:'2px 8px',color:'#555',
                              }}>{ing}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.advice && (
                <div style={{
                  background:'rgba(255,140,0,0.06)',
                  border:'1px solid rgba(255,140,0,0.2)',
                  borderRadius:12,padding:'14px 16px',
                }}>
                  <div style={{fontSize:11,color:'#ff8c00',fontWeight:700,marginBottom:6}}>
                    💡 トレーナーからのアドバイス
                  </div>
                  <div style={{fontSize:13,color:'#888',lineHeight:1.7}}>{result.advice}</div>
                </div>
              )}
            </div>
          )}

          {/* 今日の記録 */}
          {logs.length > 0 && (
            <div style={{
              background:'#1e1e26',borderRadius:20,padding:'24px',
              border:'1px solid #2a2a36',
            }}>
              <div style={{fontSize:12,color:'#666',fontWeight:600,marginBottom:14}}>今日の食事記録</div>
              {logs.map(l=>(
                <div key={l.id} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'12px 0',borderBottom:'1px solid #1a1a22',
                }}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{l.food_name}</div>
                    <div style={{fontSize:11,color:'#444'}}>
                      {new Date(l.created_at).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  <div style={{textAlign:'right',marginRight:12}}>
                    <div style={{fontSize:15,fontWeight:800,color:'#ff8c00'}}>{l.calories}kcal</div>
                    <div style={{fontSize:11,color:'#00c8ff'}}>P:{l.protein}g</div>
                  </div>
                  <button onClick={()=>deleteLog(l.id)}
                    style={{
                      background:'transparent',border:'1px solid #2a2a36',
                      borderRadius:8,color:'#444',fontSize:11,
                      padding:'4px 10px',cursor:'pointer',
                    }}>
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}