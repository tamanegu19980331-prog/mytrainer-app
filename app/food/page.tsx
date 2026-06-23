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

    // 今日の食事記録を取得
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

      // DBに保存
      if (userId) {
        const { data: saved } = await supabase.from('food_logs').insert({
          user_id: userId,
          food_name: data.foodName,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          items: data.items,
          advice: data.advice,
          rating: data.rating,
        }).select().single()
        if (saved) setLogs(l => [saved, ...l])
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
  const totalProtein = logs.reduce((sum, l) => sum + (l.protein || 0), 0)

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 40px'}}>

        {/* ヘッダー */}
        <div style={{padding:'14px 16px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>router.push('/dashboard')} style={{background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer'}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:800,color:'#ff8c00',letterSpacing:3}}>食事AI分析</div>
          </div>
        </div>

        <div style={{padding:'16px'}}>

          {/* 今日のサマリー */}
          {logs.length > 0 && (
            <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36',marginBottom:16}}>
              <div style={{fontSize:10,color:'#ff8c00',fontWeight:700,letterSpacing:1,marginBottom:12}}>今日の合計</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                <div style={{background:'#25252f',borderRadius:10,padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'#666',marginBottom:4}}>カロリー</div>
                  <div style={{fontSize:20,fontWeight:800,color:'#ff8c00'}}>{totalCalories}</div>
                  <div style={{fontSize:9,color:'#666'}}>kcal</div>
                </div>
                <div style={{background:'#25252f',borderRadius:10,padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'#666',marginBottom:4}}>たんぱく質</div>
                  <div style={{fontSize:20,fontWeight:800,color:'#00c8ff'}}>{totalProtein.toFixed(1)}</div>
                  <div style={{fontSize:9,color:'#666'}}>g</div>
                </div>
              </div>
            </div>
          )}

          {/* 写真アップロード */}
          <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36',marginBottom:16,textAlign:'center'}}>
            <div style={{fontSize:10,color:'#ff8c00',fontWeight:700,letterSpacing:1,marginBottom:12}}>食事の写真を撮影・選択</div>
            <label style={{display:'block',cursor:'pointer'}}>
              <div style={{background:'#25252f',border:'2px dashed #2a2a36',borderRadius:12,padding:'30px',marginBottom:12,color:image?'#39ff14':'#444',fontSize:13}}>
                {image ? '✅ 写真を選択しました' : '📷 タップして写真を選択'}
              </div>
              <input type="file" accept="image/*" capture="environment" onChange={handleImage} style={{display:'none'}}/>
            </label>
            <button onClick={analyze} disabled={!image||loading}
              style={{width:'100%',padding:'14px',background:'#ff8c00',color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer',opacity:!image||loading?0.3:1}}>
              {loading ? 'AI分析中...' : '🤖 AIで分析する'}
            </button>
          </div>

          {/* 分析結果 */}
          {loading && (
            <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36',marginBottom:16,textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:8}}>🤖</div>
              <div style={{fontSize:13,color:'#ff8c00',fontWeight:700}}>AIが食事を分析中...</div>
            </div>
          )}

          {result && !loading && (
            <div style={{background:'#1e1e26',borderRadius:16,padding:'20px',border:'1px solid #2a2a36',marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                <div>
                  <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>{result.foodName}</div>
                  <span style={{fontSize:10,background:ratingColor(result.rating)+'20',border:'1px solid '+ratingColor(result.rating)+'44',color:ratingColor(result.rating),borderRadius:20,padding:'2px 10px',fontWeight:700}}>
                    {result.rating}
                  </span>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:28,fontWeight:800,color:'#ff8c00'}}>{result.calories}</div>
                  <div style={{fontSize:10,color:'#666'}}>kcal</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                {[
                  {label:'たんぱく質',value:result.protein+'g',color:'#00c8ff'},
                  {label:'炭水化物',value:result.carbs+'g',color:'#ffd60a'},
                  {label:'脂質',value:result.fat+'g',color:'#ff6b9d'},
                ].map(item=>(
                  <div key={item.label} style={{background:'#25252f',borderRadius:10,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'#666',marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:16,fontWeight:800,color:item.color}}>{item.value}</div>
                  </div>
                ))}
              </div>
              {result.advice&&(
                <div style={{padding:'10px 12px',background:'rgba(255,140,0,0.1)',border:'1px solid rgba(255,140,0,0.3)',borderRadius:10}}>
                  <div style={{fontSize:10,color:'#ff8c00',fontWeight:700,marginBottom:3}}>トレーナーからのアドバイス</div>
                  <div style={{fontSize:12,lineHeight:1.6}}>{result.advice}</div>
                </div>
              )}
            </div>
          )}

          {/* 今日の記録 */}
          {logs.length > 0 && (
            <div style={{background:'#1e1e26',borderRadius:16,padding:'16px',border:'1px solid #2a2a36'}}>
              <div style={{fontSize:10,color:'#ff8c00',fontWeight:700,letterSpacing:1,marginBottom:12}}>今日の食事記録</div>
              {logs.map(l=>(
                <div key={l.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #2a2a36'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700}}>{l.food_name}</div>
                    <div style={{fontSize:10,color:'#666'}}>{new Date(l.created_at).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <div style={{textAlign:'right',marginRight:12}}>
                    <div style={{fontSize:14,fontWeight:800,color:'#ff8c00'}}>{l.calories}kcal</div>
                    <div style={{fontSize:10,color:'#00c8ff'}}>P:{l.protein}g</div>
                  </div>
                  <button onClick={()=>deleteLog(l.id)}
                    style={{background:'transparent',border:'1px solid #ff4455',borderRadius:6,color:'#ff4455',fontSize:10,padding:'3px 8px',cursor:'pointer'}}>
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