'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState<any[]>([])
  const [menus, setMenus] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
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
    const [u, m, l] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('menus').select('*').order('created_at', { ascending: false }),
      supabase.from('training_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (u.data) setUsers(u.data)
    if (m.data) setMenus(m.data)
    if (l.data) setLogs(l.data)
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

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,padding:'16px'}}>
        <div style={{background:'#1e1e26',borderRadius:12,padding:'14px',textAlign:'center'}}>
          <div style={{fontSize:24,fontWeight:800,color:'#39ff14'}}>{users.length}</div>
          <div style={{fontSize:10,color:'#666'}}>ユーザー</div>
        </div>
        <div style={{background:'#1e1e26',borderRadius:12,padding:'14px',textAlign:'center'}}>
          <div style={{fontSize:24,fontWeight:800,color:'#00c8ff'}}>{menus.length}</div>
          <div style={{fontSize:10,color:'#666'}}>メニュー</div>
        </div>
        <div style={{background:'#1e1e26',borderRadius:12,padding:'14px',textAlign:'center'}}>
          <div style={{fontSize:24,fontWeight:800,color:'#ffd60a'}}>{logs.length}</div>
          <div style={{fontSize:10,color:'#666'}}>履歴</div>
        </div>
      </div>

      <div style={{display:'flex',gap:6,padding:'0 16px 14px'}}>
        {[['users','ユーザー'],['menus','メニュー'],['logs','履歴']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'9px',background:tab===k?'#39ff14':'#1e1e26',color:tab===k?'#000':'#666',border:'1px solid '+(tab===k?'#39ff14':'#2a2a36'),borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>

      <div style={{padding:'0 16px 40px'}}>

        {tab==='users'&&(
          <div>
            {users.map(u=>(
              <div key={u.id} style={{background:'#1e1e26',borderRadius:12,padding:'14px',border:'1px solid #2a2a36',marginBottom:10}}>
                <div onClick={()=>router.push('/admin/user/'+u.id)} style={{cursor:'pointer',marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:800,color:'#00c8ff',textDecoration:'underline',marginBottom:4}}>{u.name||'未設定'} →</div>
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
                {[
                  ['name','メニュー名'],
                  ['description','説明'],
                  ['category','カテゴリ（上半身/下半身/体幹/有酸素/全身/姿勢改善）'],
                  ['target_gender','対象性別（男性/女性/両方）'],
                  ['target_age','対象年齢（20代/30代/40代以上/シニア/全年齢）'],
                  ['target_bmi','対象BMI（標準/過体重/低体重/全体）'],
                  ['target_goal','目標（筋肥大/脂肪燃焼/ヒップアップ/健康維持/姿勢改善）'],
                  ['difficulty','難易度（初級/中級/上級）'],
                  ['tags','タグ（カンマ区切り）'],
                ].map(([k,l])=>(
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
                  {[
                    {l:m.category,c:'#39ff14'},
                    {l:m.target_gender,c:'#00c8ff'},
                    {l:m.target_age,c:'#ffd60a'},
                    {l:m.difficulty,c:'#ff8c00'},
                    {l:m.target_goal,c:'#cc44ff'},
                  ].filter(x=>x.l).map((x,i)=>(
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