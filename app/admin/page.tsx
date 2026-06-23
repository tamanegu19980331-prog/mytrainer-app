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
  const TYPES = ['A','B','C']
  if (loading) return <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#39ff14'}}>Loading...</div></div>
  if (!isAdmin) return null
  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{padding:'14px',background:'#1e1e26',display:'flex',justifyContent:'space-between'}}>
        <div style={{color:'#ff4455',fontWeight:800}}>ADMIN</div>
        <button onClick={()=>router.push('/dashboard')} style={{color:'#666',background:'transparent',border:'1px solid #2a2a36',borderRadius:8,padding:'4px 10px',cursor:'pointer'}}>Back</button>
      </div>
      <div style={{padding:'16px'}}>
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {[['users','Users'],['menus','Menus'],['logs','Logs']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'9px',background:tab===k?'#39ff14':'#1e1e26',color:tab===k?'#000':'#666',border:'1px solid '+(tab===k?'#39ff14':'#2a2a36'),borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        {tab==='users'&&<div>{users.map(u=>(
          <div key={u.id} style={{background:'#1e1e26',borderRadius:12,padding:'14px',border:'1px solid #2a2a36',marginBottom:10}}>
            <div onClick={()=>router.push('/admin/user/'+u.id)} style={{cursor:'pointer',color:'#00c8ff',fontWeight:800,marginBottom:6,textDecoration:'underline'}}>{u.name} -&gt;</div>
            <div style={{fontSize:11,color:'#666'}}>{u.email}</div>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
              <span style={{fontSize:10,color:'#666'}}>Type:</span>
              <select value={u.user_type||''} onChange={e=>updateUserType(u.id,e.target.value)} style={{flex:1,background:'#25252f',border:'1px solid #2a2a36',borderRadius:6,padding:'4px 8px',color:'#e8e8e8',fontSize:11,outline:'none'}}>
                <option value=''>-</option>
                {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        ))}</div>}
        {tab==='menus'&&<div>{menus.map(m=>(
          <div key={m.id} style={{background:'#1e1e26',borderRadius:12,padding:'14px',border:'1px solid #2a2a36',marginBottom:10}}>
            <div style={{fontWeight:800}}>{m.name}</div>
          </div>
        ))}</div>}
        {tab==='logs'&&<div>
          {logs.map(l=>(
            <div key={l.id} style={{background:'#1e1e26',borderRadius:12,padding:'12px',border:'1px solid #2a2a36',marginBottom:8}}>
              <div style={{fontWeight:700}}>{l.menu_name}</div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  )
}