'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [menus, setMenus] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [diagLogs, setDiagLogs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editMenu, setEditMenu] = useState<any>(null)
  const [form, setForm] = useState({
    name:'',description:'',category:'',
    target_gender:'',target_age:'',target_bmi:'',
    target_goal:'',difficulty:'',tags:'',exercises:''
  })
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile?.is_admin) { router.push('/dashboard'); return }
    setIsAdmin(true)
    await loadAll()
    setLoading(false)
  }

  const loadAll = async () => {
    const [u, m, l, d] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('menus').select('*').order('created_at', { ascending: false }),
      supabase.from('training_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('diagnosis_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    if (u.data) setUsers(u.data)
    if (m.data) setMenus(m.data)
    if (l.data) setLogs(l.data)
    const s = await supabase.from('weekly_schedule').select('*').order('day_of_week', { ascending: true })
    if (s.data) setSchedule(s.data)
    if (d.data) setDiagLogs(d.data)
  }

  const updateUserType = async (userId: string, userType: string) => {
    await supabase.from('users').update({ user_type: userType }).eq('id', userId)
    await loadAll()
  }

  const saveMenu = async () => {
    try {
      const exercises = form.exercises ? JSON.parse(form.exercises) : []
      const data = {
        name: form.name, description: form.description,
        category: form.category, target_gender: form.target_gender,
        target_age: form.target_age, target_bmi: form.target_bmi,
        target_goal: form.target_goal, difficulty: form.difficulty,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        exercises, is_active: true
      }
      if (editMenu) { await supabase.from('menus').update(data).eq('id', editMenu.id) }
      else { await supabase.from('menus').insert(data) }
      setShowForm(false)
      setEditMenu(null)
      setForm({name:'',description:'',category:'',target_gender:'',target_age:'',target_bmi:'',target_goal:'',difficulty:'',tags:'',exercises:''})
      await loadAll()
    } catch(e) { alert('JSONの形式が正しくありません') }
  }

  const deleteMenu = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('menus').delete().eq('id', id)
    await loadAll()
  }

  const startEdit = (m: any) => {
    setEditMenu(m)
    setForm({
      name: m.name||'', description: m.description||'',
      category: m.category||'', target_gender: m.target_gender||'',
      target_age: m.target_age||'', target_bmi: m.target_bmi||'',
      target_goal: m.target_goal||'', difficulty: m.difficulty||'',
      tags: (m.tags||[]).join(', '),
      exercises: m.exercises ? JSON.stringify(m.exercises, null, 2) : ''
    })
    setShowForm(true)
  }

  const TYPES = ['ハイスタート型','三日坊主型','食事変えたくない型','会食多い型','コンビニ派','お酒飲む型','甘いもの依存型','楽したい型','健康意識高い型','リバウンド経験者型','ガチ勢型','初心者型']

  const inp: any = {
    width:'100%', background:'#25252f', border:'1px solid #2a2a36',
    borderRadius:8, padding:'8px 10px', color:'#e8e8e8',
    fontSize:12, outline:'none', marginBottom:8
  }

  const POSTURE_LABELS: Record<string, string> = {
    anterior_tilt: '骨盤前傾',
    posterior_tilt: '骨盤後傾',
    rounded_shoulders: '巻き肩',
    kyphosis: '猫背',
    straight_neck: 'ストレートネック',
    elevated_shoulders: '肩の挙上',
    o_legs: 'O脚',
    x_legs: 'X脚',
    xo_legs: 'XO脚',
  }

  const PIE_COLORS = ['#39ff14','#00c8ff','#ffd60a','#ff6b9d','#cc44ff','#ff8c00','#ff4455']

  // KPI計算
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const activeUsers = new Set(logs.filter(l => new Date(l.created_at) > sevenDaysAgo).map(l => l.user_id)).size
  const totalUsers = users.filter(u => !u.is_admin).length
  const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  // 人気メニューランキング（体力テスト除外・ユーザーごとの初回メニューのみ）
  const firstMenuByUser: Record<string, string> = {}
  const adminIds = new Set(users.filter(u => u.is_admin).map(u => u.id))
  ;[...logs].reverse().forEach(l => {
    if (l.menu_name && l.user_id && l.menu_name !== '体力テスト' && !adminIds.has(l.user_id)) {
      firstMenuByUser[l.user_id] = l.menu_name
    }
  })
  const menuCount: Record<string, number> = {}
  Object.values(firstMenuByUser).forEach(menuName => {
    menuCount[menuName] = (menuCount[menuName] || 0) + 1
  })
  const menuRanking = Object.entries(menuCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // ユーザータイプ分布
  const typeCount: Record<string, number> = {}
  users.filter(u => !u.is_admin && u.user_type).forEach(u => {
    typeCount[u.user_type] = (typeCount[u.user_type] || 0) + 1
  })
  const typeRanking = Object.entries(typeCount).sort((a,b) => b[1]-a[1]).slice(0,5)
  const typePieData = typeRanking.map(([name, value]) => ({ name, value }))

  // 姿勢タイプ分布（ユーザーごとに最新データのみ集計）
  const latestPostureByUser: Record<string, string[]> = {}
  diagLogs.forEach(d => {
    if (d.posture && d.user_id && !latestPostureByUser[d.user_id]) {
      latestPostureByUser[d.user_id] = d.posture
    }
  })
  const postureUserCount: Record<string, Set<string>> = {}
  Object.entries(latestPostureByUser).forEach(([userId, postures]) => {
    postures.forEach((p: string) => {
      if (!postureUserCount[p]) postureUserCount[p] = new Set()
      postureUserCount[p].add(userId)
    })
  })
  const postureCount: Record<string, number> = {}
  Object.entries(postureUserCount).forEach(([k, v]) => { postureCount[k] = v.size })
  const postureRanking = Object.entries(postureCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const posturePieData = postureRanking.map(([key, value]) => ({
    name: POSTURE_LABELS[key] || key,
    value,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{background:'#1e1e26',border:'1px solid #2a2a36',borderRadius:8,padding:'8px 12px'}}>
          <div style={{fontSize:11,color:'#e8e8e8',fontWeight:700}}>{payload[0].name}</div>
          <div style={{fontSize:13,fontWeight:800,color:'#39ff14'}}>{payload[0].value}人</div>
        </div>
      )
    }
    return null
  }

  if (loading) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14'}}>Loading...</div>
    </div>
  )
  if (!isAdmin) return null

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{padding:'14px 20px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#1e1e26',position:'sticky',top:0,zIndex:10}}>
        <div style={{fontSize:11,fontWeight:800,color:'#ff4455',letterSpacing:3}}>ADMIN PANEL</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={loadAll} style={{padding:'6px 12px',background:'transparent',border:'1px solid #2a2a36',borderRadius:8,color:'#666',fontSize:11,cursor:'pointer'}}>更新</button>
          <button onClick={()=>router.push('/dashboard')} style={{padding:'6px 12px',background:'transparent',border:'1px solid #2a2a36',borderRadius:8,color:'#666',fontSize:11,cursor:'pointer'}}>ダッシュボード</button>
        </div>
      </div>

      <div style={{display:'flex',gap:6,padding:'14px 16px 0',overflowX:'auto'}}>
        {[['dashboard','ダッシュボード'],['users','ユーザー'],['menus','メニュー'],['logs','履歴']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flexShrink:0,padding:'9px 14px',background:tab===k?'#39ff14':'#1e1e26',color:tab===k?'#000':'#666',border:'1px solid '+(tab===k?'#39ff14':'#2a2a36'),borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>

      <div style={{padding:'14px 16px 40px'}}>

        {tab==='dashboard'&&(
          <div>
            {/* KPIカード */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:16}}>
              {[
                {label:'総ユーザー数',value:totalUsers,color:'#39ff14'},
                {label:'7日間アクティブ',value:activeUsers,color:'#00c8ff'},
                {label:`継続率（7日）`,value:retentionRate+'%',color:retentionRate>=50?'#39ff14':'#ff4455'},
                {label:'メニュー数',value:menus.length,color:'#ffd60a'},
              ].map(item=>(
                <div key={item.label} style={{background:'#1e1e26',borderRadius:12,padding:'14px',border:'1px solid #2a2a36'}}>
                  <div style={{fontSize:10,color:'#666',marginBottom:4}}>{item.label}</div>
                  <div style={{fontSize:28,fontWeight:800,color:item.color}}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* 人気メニューランキング */}
            <div style={{background:'#1e1e26',borderRadius:12,padding:'16px',border:'1px solid #2a2a36',marginBottom:14}}>
              <div style={{fontSize:10,color:'#39ff14',fontWeight:700,letterSpacing:1,marginBottom:4}}>人気メニューランキング</div>
              <div style={{fontSize:9,color:'#444',marginBottom:12}}>※ユーザーごとの初回メニューを集計</div>
              {menuRanking.length===0&&<div style={{color:'#444',fontSize:12}}>まだデータがありません</div>}
              {menuRanking.map(([name,count],i)=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #2a2a36'}}>
                  <div style={{fontSize:16,fontWeight:800,color:i===0?'#ffd60a':i===1?'#aaa':i===2?'#cd7f32':'#666',minWidth:24}}>{i+1}</div>
                  <div style={{flex:1,fontSize:12}}>{name}</div>
                  <div style={{fontSize:12,fontWeight:700,color:'#39ff14'}}>{count}人</div>
                </div>
              ))}
            </div>

            {/* ユーザータイプ分布 円グラフ */}
            <div style={{background:'#1e1e26',borderRadius:12,padding:'16px',border:'1px solid #2a2a36',marginBottom:14}}>
              <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,letterSpacing:1,marginBottom:12}}>ユーザータイプ分布</div>
              {typePieData.length===0&&<div style={{color:'#444',fontSize:12}}>まだデータがありません</div>}
              {typePieData.length>0&&(
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={typePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({percent}) => `${Math.round(percent*100)}%`} labelLine={false}>
                        {typePieData.map((_,index)=>(
                          <Cell key={index} fill={PIE_COLORS[index%PIE_COLORS.length]}/>
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                    {typePieData.map(({name,value},i)=>(
                      <div key={name} style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                        <div style={{width:10,height:10,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/>
                        <span style={{flex:1,color:'#888'}}>{name}</span>
                        <span style={{color:PIE_COLORS[i%PIE_COLORS.length],fontWeight:700}}>{value}人</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 姿勢タイプ分布 円グラフ */}
            <div style={{background:'#1e1e26',borderRadius:12,padding:'16px',border:'1px solid #2a2a36'}}>
              <div style={{fontSize:10,color:'#cc44ff',fontWeight:700,letterSpacing:1,marginBottom:4}}>姿勢タイプ分布</div>
              <div style={{fontSize:9,color:'#444',marginBottom:12}}>※ユーザーごとの最新データを集計</div>
              {posturePieData.length===0&&<div style={{color:'#444',fontSize:12}}>まだデータがありません</div>}
              {posturePieData.length>0&&(
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={posturePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({percent}) => `${Math.round(percent*100)}%`} labelLine={false}>
                        {posturePieData.map((_,index)=>(
                          <Cell key={index} fill={PIE_COLORS[index%PIE_COLORS.length]}/>
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                    {posturePieData.map(({name,value},i)=>(
                      <div key={name} style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                        <div style={{width:10,height:10,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/>
                        <span style={{flex:1,color:'#888'}}>{name}</span>
                        <span style={{color:PIE_COLORS[i%PIE_COLORS.length],fontWeight:700}}>{value}人</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab==='users'&&(
          <div>
            <div style={{fontSize:11,color:'#666',marginBottom:12}}>登録ユーザー一覧（{users.length}名）</div>
            {users.map(u=>(
              <div key={u.id} style={{background:'#1e1e26',borderRadius:12,padding:'14px',border:'1px solid #2a2a36',marginBottom:10}}>
                <div onClick={()=>router.push('/admin/user/'+u.id)} style={{cursor:'pointer',marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:800,color:'#00c8ff',textDecoration:'underline',marginBottom:4}}>
                    {u.name||'未設定'} →
                    {u.is_admin&&<span style={{marginLeft:6,fontSize:9,background:'#ff4455',color:'#fff',padding:'2px 6px',borderRadius:4}}>ADMIN</span>}
                  </div>
                  <div style={{fontSize:11,color:'#666'}}>{u.email}</div>
                  <div style={{fontSize:11,color:'#666'}}>{u.gender} / {u.height}cm / {u.weight}kg</div>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:10,color:'#666'}}>タイプ:</span>
                  <select value={u.user_type||''} onChange={e=>updateUserType(u.id,e.target.value)} style={{flex:1,background:'#25252f',border:'1px solid #2a2a36',borderRadius:6,padding:'4px 8px',color:'#e8e8e8',fontSize:11,outline:'none'}}>
                    <option value=''>未分類</option>
                    {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='menus'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:11,color:'#666'}}>メニュー一覧（{menus.length}件）</div>
              <button onClick={()=>{setEditMenu(null);setForm({name:'',description:'',category:'',target_gender:'',target_age:'',target_bmi:'',target_goal:'',difficulty:'',tags:'',exercises:''});setShowForm(true)}} style={{padding:'8px 14px',background:'#39ff14',color:'#000',border:'none',borderRadius:8,fontSize:11,fontWeight:800,cursor:'pointer'}}>+ 新規追加</button>
            </div>
            {showForm&&(
              <div style={{background:'#1e1e26',borderRadius:12,padding:'16px',border:'1px solid #39ff14',marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:800,color:'#39ff14',marginBottom:12}}>{editMenu?'編集':'新規追加'}</div>
                {[['name','メニュー名'],['description','説明'],['category','カテゴリ（上半身/下半身/体幹/有酸素/全身/姿勢改善）'],['target_gender','対象性別（男性/女性/両方）'],['target_age','対象年齢（20代/30代/40代以上/シニア/全年齢）'],['target_bmi','対象BMI（標準/過体重/低体重/全体）'],['target_goal','目標（筋肥大/脂肪燃焼/ヒップアップ/健康維持/姿勢改善）'],['difficulty','難易度（初級/中級/上級）'],['tags','タグ（カンマ区切り）']].map(([k,l])=>(
                  <div key={k}>
                    <div style={{fontSize:10,color:'#666',marginBottom:3}}>{l}</div>
                    <input style={inp} value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
                <div style={{fontSize:10,color:'#666',marginBottom:3}}>種目データ（JSON）</div>
                <textarea style={{...inp,height:120,resize:'vertical',fontFamily:'monospace'}} value={form.exercises} onChange={e=>setForm(f=>({...f,exercises:e.target.value}))}/>
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  <button onClick={saveMenu} style={{flex:1,padding:'10px',background:'#39ff14',color:'#000',border:'none',borderRadius:8,fontSize:12,fontWeight:800,cursor:'pointer'}}>保存</button>
                  <button onClick={()=>setShowForm(false)} style={{flex:1,padding:'10px',background:'transparent',color:'#666',border:'1px solid #2a2a36',borderRadius:8,fontSize:12,cursor:'pointer'}}>キャンセル</button>
                </div>
              </div>
            )}
            {menus.map(m=>(
              <div key={m.id} style={{background:'#1e1e26',borderRadius:12,padding:'14px',border:'1px solid #2a2a36',marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,marginBottom:3}}>{m.name}</div>
                    <div style={{fontSize:11,color:'#666'}}>{m.description}</div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>startEdit(m)} style={{padding:'5px 10px',background:'transparent',border:'1px solid #00c8ff',borderRadius:6,color:'#00c8ff',fontSize:10,cursor:'pointer'}}>編集</button>
                    <button onClick={()=>deleteMenu(m.id)} style={{padding:'5px 10px',background:'transparent',border:'1px solid #ff4455',borderRadius:6,color:'#ff4455',fontSize:10,cursor:'pointer'}}>削除</button>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {[{l:m.category,c:'#39ff14'},{l:m.target_gender,c:'#00c8ff'},{l:m.target_age,c:'#ffd60a'},{l:m.difficulty,c:'#ff8c00'},{l:m.target_goal,c:'#cc44ff'}].filter(x=>x.l).map((x,i)=>(
                    <span key={i} style={{fontSize:10,background:x.c+'20',border:'1px solid '+x.c+'44',color:x.c,borderRadius:6,padding:'2px 8px'}}>{x.l}</span>
                  ))}
                </div>
                <div style={{fontSize:10,color:'#444',marginTop:6}}>種目数: {Array.isArray(m.exercises)?m.exercises.length:'?'}件</div>
              </div>
            ))}
          </div>
        )}

        {tab==='logs'&&(
          <div>
            <div style={{fontSize:11,color:'#666',marginBottom:12}}>トレーニング履歴（{logs.length}件）</div>
            {logs.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'#444'}}>まだ履歴がありません</div>}
            {logs.map(l=>(
              <div key={l.id} style={{background:'#1e1e26',borderRadius:12,padding:'12px 14px',border:'1px solid #2a2a36',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:700}}>{l.menu_name||'メニュー名なし'}</div>
                  <div style={{fontSize:10,color:'#666'}}>{new Date(l.created_at).toLocaleDateString('ja-JP')}</div>
                </div>
                <div style={{fontSize:10,color:'#666'}}>タイプ: {l.user_type||'未設定'}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}