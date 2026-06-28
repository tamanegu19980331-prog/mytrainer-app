'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MEAL_TYPES = [
  { key: 'breakfast', label: '朝食', emoji: '🌅', color: '#ffd60a' },
  { key: 'lunch',     label: '昼食', emoji: '☀️',  color: '#ff8c00' },
  { key: 'dinner',    label: '夕食', emoji: '🌙', color: '#cc44ff' },
  { key: 'snack',     label: '間食', emoji: '🍩', color: '#00c8ff' },
]

function calcTargetCalories(user: any): number {
  const weight = user?.weight || 65
  const height = user?.height || 165
  const age = user?.age || 30
  const gender = user?.gender || 'male'
  let bmr = gender === 'female'
    ? 447.6 + 9.25 * weight + 3.1 * height - 4.33 * age
    : 88.36 + 13.4 * weight + 4.8 * height - 5.68 * age
  let tdee = bmr * 1.55
  const goal = user?.goal || ''
  if (goal.includes('引き締め') || goal.includes('ダイエット') || goal.includes('減量')) tdee -= 200
  else if (goal.includes('筋肥大') || goal.includes('増量') || goal.includes('筋力向上')) tdee += 300
  return Math.round(tdee)
}

function calcTargetProtein(user: any): number {
  const weight = user?.weight || 65
  const goal = user?.goal || ''
  if (goal.includes('筋肥大') || goal.includes('筋力')) return Math.round(weight * 2.0)
  return Math.round(weight * 1.6)
}

export default function FoodPage() {
  const [image, setImage] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedMeal, setSelectedMeal] = useState<string>('breakfast')
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record')
  const [weekLogs, setWeekLogs] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const router = useRouter()

  useEffect(() => { init() }, [])

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 10) setSelectedMeal('breakfast')
    else if (h < 14) setSelectedMeal('lunch')
    else if (h < 19) setSelectedMeal('dinner')
    else setSelectedMeal('snack')
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUserId(user.id)
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    setUserProfile(profile)
    await loadLogs(user.id, new Date().toISOString().slice(0, 10))
    await loadWeekLogs(user.id)
  }

  const loadLogs = async (uid: string, date: string) => {
    const { data } = await supabase
      .from('food_logs').select('*')
      .eq('user_id', uid)
      .eq('logged_date', date)
      .order('created_at', { ascending: true })
    setLogs(data || [])
  }

  const loadWeekLogs = async (uid: string) => {
    const from = new Date()
    from.setDate(from.getDate() - 6)
    const { data } = await supabase
      .from('food_logs').select('*')
      .eq('user_id', uid)
      .gte('logged_date', from.toISOString().slice(0, 10))
      .order('logged_date', { ascending: true })
    setWeekLogs(data || [])
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
        const today = new Date().toISOString().slice(0, 10)
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
            meal_type: selectedMeal,
            logged_date: today,
          }).select().single()
          if (saved) setLogs(l => [...l, saved])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setImage(null)
    }
  }

  const deleteLog = async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id)
    setLogs(l => l.filter(x => x.id !== id))
  }

  const targetCalories = userProfile ? calcTargetCalories(userProfile) : 2000
  const targetProtein = userProfile ? calcTargetProtein(userProfile) : 100

  const totalCalories = logs.reduce((s, l) => s + (l.calories || 0), 0)
  const totalProtein  = logs.reduce((s, l) => s + (Number(l.protein) || 0), 0)
  const totalCarbs    = logs.reduce((s, l) => s + (Number(l.carbs) || 0), 0)
  const totalFat      = logs.reduce((s, l) => s + (Number(l.fat) || 0), 0)

  const remainCalories = targetCalories - totalCalories
  const calPct = Math.min(100, Math.round((totalCalories / targetCalories) * 100))
  const proteinPct = Math.min(100, Math.round((totalProtein / targetProtein) * 100))

  const mealGroups = MEAL_TYPES.map(mt => ({
    ...mt,
    logs: logs.filter(l => l.meal_type === mt.key),
    calories: logs.filter(l => l.meal_type === mt.key).reduce((s, l) => s + (l.calories || 0), 0),
  }))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLogs = weekLogs.filter(l => l.logged_date === dateStr)
    const cal = dayLogs.reduce((s, l) => s + (l.calories || 0), 0)
    const protein = dayLogs.reduce((s, l) => s + (Number(l.protein) || 0), 0)
    return { dateStr, cal, protein, label: ['日','月','火','水','木','金','土'][d.getDay()] }
  })
  const avgCalories = weekDays.filter(d => d.cal > 0).length > 0
    ? Math.round(weekDays.filter(d => d.cal > 0).reduce((s, d) => s + d.cal, 0) / weekDays.filter(d => d.cal > 0).length)
    : 0
  const proteinOkDays = weekDays.filter(d => d.protein >= targetProtein).length
  const maxWeekCal = Math.max(...weekDays.map(d => d.cal), 1)

  const ratingColor = (r: string) =>
    r === '良い' ? '#39ff14' : r === '普通' ? '#ffd60a' : '#ff4455'

  return (
    <div style={{ background: '#16161a', minHeight: '100vh', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>

        {/* ヘッダー */}
        <div style={{
          padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid #1e1e26',
          position: 'sticky', top: 0, background: '#16161a', zIndex: 10,
        }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: 24, cursor: 'pointer', padding: 0 }}>
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#ff8c00', fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>FOOD AI</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>食事管理</div>
          </div>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => {
              setSelectedDate(e.target.value)
              if (userId) loadLogs(userId, e.target.value)
            }}
            style={{
              background: '#25252f', border: '1px solid #2a2a36',
              borderRadius: 8, color: '#e8e8e8', fontSize: 12, padding: '6px 10px',
            }}
          />
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e1e26' }}>
          {[
            { key: 'record', label: '📋 今日の記録' },
            { key: 'history', label: '📊 週間レポート' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1, padding: '14px', background: 'none', border: 'none',
                color: activeTab === tab.key ? '#ff8c00' : '#555',
                fontWeight: activeTab === tab.key ? 800 : 600, fontSize: 13,
                borderBottom: activeTab === tab.key ? '2px solid #ff8c00' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px 0' }}>

          {activeTab === 'record' && (
            <>
              {/* カロリー進捗 */}
              <div style={{
                background: '#1e1e26', borderRadius: 20, padding: 24,
                border: '1px solid #2a2a36', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>今日の摂取カロリー</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 36, fontWeight: 900, color: '#ff8c00' }}>{totalCalories}</span>
                      <span style={{ fontSize: 13, color: '#555' }}>/ {targetCalories} kcal</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>残り</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: remainCalories < 0 ? '#ff4455' : '#39ff14' }}>
                      {remainCalories < 0 ? `+${Math.abs(remainCalories)}` : remainCalories}
                      <span style={{ fontSize: 11, color: '#555', fontWeight: 400 }}> kcal</span>
                    </div>
                  </div>
                </div>

                {/* カロリーバー */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ background: '#25252f', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                    <div style={{
                      width: `${calPct}%`, height: '100%',
                      background: calPct > 100 ? '#ff4455' : calPct > 80 ? '#ffd60a' : 'linear-gradient(90deg,#ff8c00,#ff4455)',
                      borderRadius: 8, transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#444' }}>{calPct}%達成</span>
                    <span style={{ fontSize: 10, color: '#444' }}>
                      {remainCalories > 0 ? `あと${remainCalories}kcal食べられます` : 'オーバーしています'}
                    </span>
                  </div>
                </div>

                {/* たんぱく質バー */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#00c8ff' }}>たんぱく質</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{totalProtein.toFixed(0)}g / 目標{targetProtein}g</span>
                  </div>
                  <div style={{ background: '#25252f', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${proteinPct}%`, height: '100%',
                      background: 'linear-gradient(90deg,#00c8ff,#0099dd)',
                      borderRadius: 6, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                {/* PFC */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
                  {[
                    { label: '炭水化物', value: totalCarbs.toFixed(0), color: '#ffd60a' },
                    { label: 'たんぱく質', value: totalProtein.toFixed(0), color: '#00c8ff' },
                    { label: '脂質', value: totalFat.toFixed(0), color: '#ff6b9d' },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#25252f', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}g</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ミールタイム別記録 */}
              <div style={{
                background: '#1e1e26', borderRadius: 20, padding: 24,
                border: '1px solid #2a2a36', marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 16 }}>食事の記録</div>
                {mealGroups.map(meal => (
                  <div key={meal.key} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{meal.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: meal.color }}>{meal.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>
                        {meal.calories > 0 ? `${meal.calories}kcal` : '未記録'}
                      </span>
                    </div>
                    {meal.logs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {meal.logs.map(l => (
                          <div key={l.id} style={{
                            background: '#25252f', borderRadius: 12, padding: '10px 14px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{l.food_name}</div>
                              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                                P:{Number(l.protein).toFixed(0)}g C:{Number(l.carbs).toFixed(0)}g F:{Number(l.fat).toFixed(0)}g
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#ff8c00' }}>{l.calories}kcal</span>
                              <button onClick={() => deleteLog(l.id)}
                                style={{
                                  background: 'transparent', border: '1px solid #2a2a36',
                                  borderRadius: 6, color: '#444', fontSize: 11,
                                  padding: '3px 8px', cursor: 'pointer',
                                }}>削除</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        background: '#25252f', borderRadius: 12, padding: '12px 14px',
                        color: '#333', fontSize: 12, textAlign: 'center', marginBottom: 8,
                      }}>未記録</div>
                    )}
                  </div>
                ))}
              </div>

              {/* 食事を追加 */}
              <div style={{
                background: '#1e1e26', borderRadius: 20, padding: 24,
                border: '1px solid #2a2a36', marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 14 }}>食事を追加</div>

                {/* ミール選択 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
                  {MEAL_TYPES.map(mt => (
                    <button key={mt.key}
                      onClick={() => setSelectedMeal(mt.key)}
                      style={{
                        background: selectedMeal === mt.key ? mt.color + '22' : '#25252f',
                        border: `2px solid ${selectedMeal === mt.key ? mt.color : '#2a2a36'}`,
                        borderRadius: 12, padding: '10px 4px', cursor: 'pointer',
                        color: selectedMeal === mt.key ? mt.color : '#555',
                        fontSize: 11, fontWeight: 700, textAlign: 'center',
                        transition: 'all 0.2s',
                      }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{mt.emoji}</div>
                      {mt.label}
                    </button>
                  ))}
                </div>

                <label style={{ display: 'block', cursor: 'pointer', marginBottom: 14 }}>
                  <div style={{
                    background: '#25252f',
                    border: `2px dashed ${image ? '#39ff14' : '#2a2a36'}`,
                    borderRadius: 16, padding: '28px 20px', textAlign: 'center',
                  }}>
                    {image ? (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#39ff14' }}>写真を選択しました</div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>タップして変更</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 6 }}>📷</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>タップして写真を選択</div>
                        <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>複数の料理も一括分析できます</div>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" capture="environment"
                    onChange={handleImage} style={{ display: 'none' }} />
                </label>

                <button onClick={analyze} disabled={!image || loading}
                  style={{
                    width: '100%', padding: '16px',
                    background: image && !loading ? 'linear-gradient(135deg,#ff8c00,#ff4455)' : '#25252f',
                    color: image && !loading ? '#fff' : '#444',
                    border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
                    cursor: image && !loading ? 'pointer' : 'not-allowed',
                    boxShadow: image && !loading ? '0 4px 20px rgba(255,140,0,0.2)' : 'none',
                  }}>
                  {loading ? '🤖 AI分析中...' : '🤖 AIで分析する'}
                </button>
              </div>

              {loading && (
                <div style={{
                  background: '#1e1e26', borderRadius: 20, padding: '28px 24px',
                  border: '1px solid #2a2a36', marginBottom: 16, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ff8c00', marginBottom: 4 }}>AIが食事を分析中...</div>
                  <div style={{ fontSize: 12, color: '#444' }}>料理を1品ずつ識別しています</div>
                </div>
              )}

              {result && !loading && (
                <div style={{
                  background: '#1e1e26', borderRadius: 20, padding: 24,
                  border: '1px solid #2a2a36', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>分析結果</div>
                    <span style={{
                      fontSize: 12,
                      background: ratingColor(result.rating) + '15',
                      border: '1px solid ' + ratingColor(result.rating) + '44',
                      color: ratingColor(result.rating),
                      borderRadius: 20, padding: '4px 12px', fontWeight: 700,
                    }}>{result.rating}</span>
                  </div>
                  <div style={{
                    background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.2)',
                    borderRadius: 14, padding: '14px', marginBottom: 14,
                    display: 'flex', justifyContent: 'space-around',
                  }}>
                    {[
                      { label: '合計', value: result.totalCalories, unit: 'kcal', color: '#ff8c00' },
                      { label: 'たんぱく質', value: result.totalProtein, unit: 'g', color: '#00c8ff' },
                      { label: '炭水化物', value: result.totalCarbs, unit: 'g', color: '#ffd60a' },
                      { label: '脂質', value: result.totalFat, unit: 'g', color: '#ff6b9d' },
                    ].map(item => (
                      <div key={item.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#555', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: 9, color: '#444' }}>{item.unit}</div>
                      </div>
                    ))}
                  </div>
                  {result.items && result.items.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 8 }}>
                        識別した料理 ({result.items.length}品)
                      </div>
                      {result.items.map((item: any, i: number) => (
                        <div key={i} style={{
                          background: '#25252f', borderRadius: 12, padding: '12px 14px',
                          border: '1px solid #2a2a36', marginBottom: 8,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#ff8c00' }}>{item.calories}kcal</div>
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span style={{ fontSize: 11, color: '#00c8ff' }}>P:{item.protein}g</span>
                            <span style={{ fontSize: 11, color: '#ffd60a' }}>C:{item.carbs}g</span>
                            <span style={{ fontSize: 11, color: '#ff6b9d' }}>F:{item.fat}g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.advice && (
                    <div style={{
                      background: 'rgba(255,140,0,0.06)',
                      border: '1px solid rgba(255,140,0,0.2)',
                      borderRadius: 12, padding: '14px 16px',
                    }}>
                      <div style={{ fontSize: 11, color: '#ff8c00', fontWeight: 700, marginBottom: 6 }}>
                        💡 トレーナーからのアドバイス
                      </div>
                      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>{result.advice}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              <div style={{
                background: '#1e1e26', borderRadius: 20, padding: 24,
                border: '1px solid #2a2a36', marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 16 }}>今週のサマリー</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: '#25252f', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>1日平均カロリー</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#ff8c00' }}>{avgCalories}</div>
                    <div style={{ fontSize: 10, color: '#444' }}>kcal</div>
                    <div style={{ fontSize: 10, color: avgCalories < targetCalories ? '#39ff14' : '#ff4455', marginTop: 4 }}>
                      目標 {targetCalories}kcal
                    </div>
                  </div>
                  <div style={{ background: '#25252f', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>タンパク質OK日数</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#00c8ff' }}>{proteinOkDays}</div>
                    <div style={{ fontSize: 10, color: '#444' }}>/ 7日</div>
                    <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>目標 {targetProtein}g/日</div>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.2)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 11, color: '#ff8c00', fontWeight: 700, marginBottom: 6 }}>💡 今週の振り返り</div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>
                    {proteinOkDays >= 5
                      ? 'たんぱく質が十分に摂れています！筋肉の回復に効果的です。'
                      : proteinOkDays >= 3
                      ? `たんぱく質が不足気味の日があります。${targetProtein}g/日を意識しましょう。`
                      : 'たんぱく質が少ない日が多いです。プロテインや鶏むね肉などを意識して取り入れましょう。'}
                    {avgCalories > targetCalories + 200 && ' カロリーが目標より多めです。間食を減らすと改善できます。'}
                    {avgCalories > 0 && avgCalories < targetCalories - 300 && ' カロリーが不足気味です。栄養不足は筋肉の減少につながります。'}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#1e1e26', borderRadius: 20, padding: 24,
                border: '1px solid #2a2a36', marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 16 }}>カロリー推移（7日）</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                  {weekDays.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 9, color: '#444' }}>{d.cal > 0 ? d.cal : ''}</div>
                      <div style={{
                        width: '100%', background: '#25252f', borderRadius: 6,
                        height: 80, display: 'flex', alignItems: 'flex-end', overflow: 'hidden',
                      }}>
                        {d.cal > 0 && (
                          <div style={{
                            width: '100%',
                            height: `${(d.cal / maxWeekCal) * 100}%`,
                            background: d.dateStr === new Date().toISOString().slice(0, 10)
                              ? 'linear-gradient(180deg,#ff8c00,#ff4455)'
                              : d.cal > targetCalories ? '#ff4455' : '#2a6644',
                            borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease',
                          }} />
                        )}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: d.dateStr === new Date().toISOString().slice(0, 10) ? '#ff8c00' : '#444',
                        fontWeight: 700,
                      }}>{d.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  {[
                    { color: '#2a6644', label: '目標内' },
                    { color: '#ff4455', label: '目標オーバー' },
                    { color: '#ff8c00', label: '今日' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                      <span style={{ fontSize: 10, color: '#444' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {userProfile && (
                <div style={{
                  background: '#1e1e26', borderRadius: 20, padding: 24,
                  border: '1px solid #2a2a36',
                }}>
                  <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 14 }}>あなたの目標設定</div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
                    目標：<span style={{ color: '#ff8c00', fontWeight: 700 }}>{userProfile.goal || '未設定'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: '目標カロリー', value: `${targetCalories} kcal`, color: '#ff8c00' },
                      { label: 'たんぱく質目標', value: `${targetProtein} g`, color: '#00c8ff' },
                      { label: '体重', value: userProfile.weight ? `${userProfile.weight} kg` : '未設定', color: '#e8e8e8' },
                      { label: 'BMI', value: userProfile.weight && userProfile.height ? (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1) : '-', color: '#e8e8e8' },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#25252f', borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}