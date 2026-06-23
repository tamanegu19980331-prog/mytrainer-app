'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function UserDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [diagLogs, setDiagLogs] = useState<any[]>([])
  const [trainingLogs, setTrainingLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth'); return }
    const { data: adminProfile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    if (!adminProfile?.is_admin) { router.push('/dashboard'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single()
    setUser(userData)

    const { data: diagData } = await supabase.from('diagnosis_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setDiagLogs(diagData || [])

    const { data: trainingData } = await supabase.from('training_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setTrainingLogs(trainingData || [])

    setLoading(false)
  }

  if (loading) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14'}}>Loading...</div>
    </div>
  )
  if (!user) return null

  const bmi = user.height && user.weight
    ? (Number(user.weight) / ((Number(user.height)/100)**2)).toFixed(1)
    : '-'

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{padding:'14px 16px',borderBottom:'1px solid #2a2a36',display:'flex',alignItems:'center',gap:12,background:'#1e1e26',position:'sticky',top:0,zIndex:10}}>
        <button onClick={()=>router.push('/admin')} style={{background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer'}}>←</button>
        <div>
          <div style={{fontSize:13,fontWeight:800}}>{user.name||'未設定'}</div>
          <div style={{fontSize:11,color:'#666'}}>{user.email}</div>
        </div>
      </div>

      <div style={{padding:'16px'}}>

        {/* 基本情報 */}
        <div style={{background:'#1e1e26',borderRadius:12,padding:'16px',border:'1px solid #2a2a36',marginBottom:14}}>
          <div style={{fontSize:10,color:'#39ff14',fontWeight:700,letterSpacing:1,marginBottom:12}}>基本情報</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
            {[
              {label:'性別',value:user.gender||'-'},
              {label:'身長',value:user.height?user.height+'cm':'-'},
              {label:'体重',value:user.weight?user.weight+'kg':'-'},
              {label:'BMI',value:bmi},
              {label:'レベル',value:user.level||'1'},
              {label:'EXP',value:user.exp||'0'},
            ].map(item=>(
              <div key={item.label} style={{background:'#25252f',borderRadius:8,padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:9,color:'#666',marginBottom:3}}>{item.label}</div>
                <div style={{fontSize:14,fontWeight:800,color:'#39ff14'}}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'10px 12px',background:'#25252f',borderRadius:8}}>
            <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,marginBottom:4}}>ユーザータイプ</div>
            <div style={{fontSize:13,fontWeight:700}}>{user.user_type||'未分類'}</div>
          </div>
        </div>

        {/* 診断履歴 */}
        <div style={{background:'#1e1e26',borderRadius:12,padding:'16px',border:'1px solid #2a2a36',marginBottom:14}}>
          <div style={{fontSize:10,color:'#ff6b9d',fontWeight:700,letterSpacing:1,marginBottom:12}}>
            診断履歴（{diagLogs.length}回）
          </div>
          {diagLogs.length===0&&(
            <div style={{color:'#444',fontSize:12,textAlign:'center',padding:'20px 0'}}>まだ診断履歴がありません</div>
          )}
          {diagLogs.map((log,i)=>(
            <div key={log.id} style={{marginBottom:12,padding:'12px',background:'#25252f',borderRadius:10,border:'1px solid #2a2a36'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:'#ff6b9d'}}>診断 #{diagLogs.length-i}</div>
                <div style={{fontSize:10,color:'#666'}}>{new Date(log.created_at).toLocaleDateString('ja-JP')}</div>
              </div>
              {log.user_type&&(
                <div style={{padding:'6px 10px',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',borderRadius:8,marginBottom:8}}>
                  <div style={{fontSize:10,color:'#ffd60a',fontWeight:700,marginBottom:2}}>AI判定タイプ</div>
                  <div style={{fontSize:12}}>{log.user_type}</div>
                  {log.type_reason&&<div style={{fontSize:11,color:'#666',marginTop:2}}>{log.type_reason}</div>}
                </div>
              )}
              {log.posture&&log.posture.length>0&&(
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:'#cc44ff',fontWeight:700,marginBottom:4}}>姿勢の問題</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {log.posture.map((p:string,j:number)=>(
                      <span key={j} style={{fontSize:10,background:'rgba(204,68,255,0.1)',border:'1px solid #cc44ff44',color:'#cc44ff',borderRadius:6,padding:'2px 8px'}}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {log.answers&&(
                <div>
                  <div style={{fontSize:10,color:'#666',fontWeight:700,marginBottom:4}}>診断回答</div>
                  {Object.entries(log.answers).map(([k,v])=>(
                    <div key={k} style={{display:'flex',gap:8,fontSize:11,padding:'4px 0',borderBottom:'1px solid #2a2a36'}}>
                      <span style={{color:'#555',minWidth:60}}>{k}</span>
                      <span style={{color:'#aaa'}}>{v as string}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* トレーニング履歴 */}
        <div style={{background:'#1e1e26',borderRadius:12,padding:'16px',border:'1px solid #2a2a36'}}>
          <div style={{fontSize:10,color:'#39ff14',fontWeight:700,letterSpacing:1,marginBottom:12}}>
            提案メニュー履歴（{trainingLogs.length}回）
          </div>
          {trainingLogs.length===0&&(
            <div style={{color:'#444',fontSize:12,textAlign:'center',padding:'20px 0'}}>まだ履歴がありません</div>
          )}
          {trainingLogs.map((log,i)=>(
            <div key={log.id} style={{marginBottom:10,padding:'12px',background:'#25252f',borderRadius:10,border:'1px solid #2a2a36'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div style={{fontSize:13,fontWeight:700}}>{log.menu_name}</div>
                <div style={{fontSize:10,color:'#666'}}>{new Date(log.created_at).toLocaleDateString('ja-JP')}</div>
              </div>
              {log.user_type&&(
                <span style={{fontSize:10,background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',color:'#ffd60a',borderRadius:6,padding:'2px 8px'}}>{log.user_type}</span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}