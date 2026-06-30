'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (profile?.is_admin) { router.push('/admin'); return }
        if (profile) { router.push('/dashboard'); return }
        router.push('/onboarding')
      }
      setChecking(false)
    }
    check()
  }, [])

  if (checking) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#39ff14',fontSize:14}}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{background:'#16161a',color:'#e8e8e8',minHeight:'100vh'}}>

      {/* ナビ */}
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(22,22,26,0.95)',borderBottom:'1px solid #1e1e26',padding:'14px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:16,fontWeight:800,color:'#39ff14'}}>⚡ MyTrainer</div>
        <button onClick={()=>router.push('/auth')}
          style={{padding:'8px 20px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:10,fontSize:13,fontWeight:800,cursor:'pointer'}}>
          無料で始める
        </button>
      </div>

      {/* ヒーロー */}
      <div style={{paddingTop:120,paddingBottom:80,textAlign:'center',padding:'120px 24px 80px'}}>
        <div style={{display:'inline-block',background:'rgba(57,255,20,0.1)',border:'1px solid rgba(57,255,20,0.3)',borderRadius:20,padding:'6px 16px',fontSize:12,color:'#39ff14',fontWeight:700,marginBottom:24}}>
          🤖 AI × 👨‍💼 現役トレーナー監修
        </div>
        <div style={{fontSize:36,fontWeight:900,lineHeight:1.3,marginBottom:16,maxWidth:480,margin:'0 auto 16px'}}>
          AIと現役トレーナーが<br/>
          <span style={{color:'#39ff14'}}>あなただけの</span><br/>
          トレーニングを作る
        </div>
        <div style={{fontSize:15,color:'#555',marginBottom:40,lineHeight:1.8,maxWidth:400,margin:'0 auto 40px'}}>
          毎日のメニューを自動生成。<br/>
          姿勢改善・食事管理・AIコーチング。<br/>
          続けられる仕組みがここにある。
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12,maxWidth:360,margin:'0 auto'}}>
          <button onClick={()=>router.push('/auth')}
            style={{width:'100%',padding:'20px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:16,fontSize:17,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 24px rgba(57,255,20,0.3)'}}>
            ⚡ 無料で始める
          </button>
          <div style={{fontSize:12,color:'#444',textAlign:'center'}}>クレジットカード不要 · 登録3分</div>
        </div>
      </div>

      {/* 実績バー */}
      <div style={{background:'#1e1e26',borderTop:'1px solid #2a2a36',borderBottom:'1px solid #2a2a36',padding:'24px',display:'flex',justifyContent:'center',gap:0}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:0,maxWidth:480,width:'100%'}}>
          {[
            {value:'AI生成',label:'毎日最適メニュー',color:'#39ff14'},
            {value:'24時間',label:'いつでも使える',color:'#00c8ff'},
            {value:'無料',label:'まず試せる',color:'#ffd60a'},
          ].map(item=>(
            <div key={item.label} style={{textAlign:'center',padding:'0 12px'}}>
              <div style={{fontSize:20,fontWeight:900,color:item.color,marginBottom:4}}>{item.value}</div>
              <div style={{fontSize:11,color:'#555'}}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

     {/* 4つの強み */}
     <div style={{padding:'60px 24px',maxWidth:480,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:8}}>FEATURES</div>
          <div style={{fontSize:24,fontWeight:800}}>4つの強み</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {[
            {
              emoji:'🤖',
              title:'AIが毎日最適メニューを生成',
              desc:'あなたの体力・姿勢・目標データをもとに、AIが最適なトレーニングメニューを毎日自動生成。同じメニューの繰り返しにならない。',
              color:'#39ff14',
            },
            {
              emoji:'🍱',
              title:'生活スタイルに合わせた食事サポート',
              desc:'コンビニ派・外食多め・自炊できるなど、生活スタイルを診断しプロの管理栄養士監修であなた専用の献立を毎日提案。無理なく続けられる食事管理を徹底サポートします。',
              color:'#ff8c00',
            },
            {
              emoji:'👨‍💼',
              title:'現役トレーナーが直接サポート',
              desc:'NSCA-CPT認定トレーナーによるオンライン面談。AIでは解決できない悩みをプロが直接サポートします。',
              color:'#cc44ff',
            },
            {
              emoji:'📊',
              title:'データで継続をサポート',
              desc:'EXPシステム・連続記録・週間チャレンジで継続が楽しくなる仕組み。トレーニングをゲーム感覚で続けられる。',
              color:'#ffd60a',
            },
          ].map(item=>(
            <div key={item.title} style={{background:'#1e1e26',borderRadius:20,padding:'24px',border:'1px solid #2a2a36'}}>
              <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                <div style={{width:52,height:52,borderRadius:14,background:item.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>
                  {item.emoji}
                </div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,marginBottom:8,color:item.color}}>{item.title}</div>
                  <div style={{fontSize:13,color:'#666',lineHeight:1.7}}>{item.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

     {/* トレーナー監修 */}
     <div style={{background:'#1e1e26',padding:'60px 24px',borderTop:'1px solid #2a2a36',borderBottom:'1px solid #2a2a36'}}>
        <div style={{maxWidth:480,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:11,color:'#cc44ff',fontWeight:700,letterSpacing:2,marginBottom:8}}>TRAINER</div>
          <div style={{fontSize:24,fontWeight:800,marginBottom:24}}>現役トレーナー監修</div>
          <div style={{background:'#25252f',borderRadius:20,padding:'24px',border:'1px solid #2a2a36',marginBottom:24,textAlign:'left'}}>
            <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16}}>
              <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,#cc44ff,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>
                👨‍💼
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>パーソナルトレーナー</div>
                <div style={{fontSize:12,color:'#cc44ff',fontWeight:700}}>NSCA-CPT認定</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                '💪 パーソナルトレーニング指導歴あり',
                '🧬 姿勢改善・体幹トレーニング専門',
                '🍱 食事指導・ダイエットサポート対応',
                '📱 オンライン面談で全国対応',
              ].map(item=>(
                <div key={item} style={{fontSize:13,color:'#888',display:'flex',gap:8,alignItems:'center'}}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <button onClick={()=>window.open('https://calendly.com/tamanegu-19980331/30min','_blank')}
            style={{width:'100%',padding:'16px',background:'linear-gradient(135deg,#cc44ff,#7c3aed)',color:'#fff',border:'none',borderRadius:14,fontSize:15,fontWeight:800,cursor:'pointer'}}>
            📅 初回無料相談を予約する
          </button>
          <div style={{fontSize:11,color:'#444',marginTop:10}}>※ 初回相談は無料です</div>
        </div>
      </div>

      {/* 料金プラン */}
      <div style={{padding:'60px 24px',maxWidth:480,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,letterSpacing:2,marginBottom:8}}>PRICING</div>
          <div style={{fontSize:24,fontWeight:800}}>料金プラン</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* フリープラン */}
          <div style={{background:'#1e1e26',borderRadius:20,padding:'24px',border:'1px solid #2a2a36'}}>
            <div style={{fontSize:14,fontWeight:800,marginBottom:4}}>フリープラン</div>
            <div style={{fontSize:32,fontWeight:900,color:'#39ff14',marginBottom:16}}>¥0<span style={{fontSize:14,color:'#555',fontWeight:400}}>/月</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
              {['✅ AIメニュー自動生成','✅ 姿勢改善メニュー','✅ EXP・レベルシステム','✅ コミュニティ広場','✅ 週間チャレンジ'].map(item=>(
                <div key={item} style={{fontSize:13,color:'#888'}}>{item}</div>
              ))}
            </div>
            <button onClick={()=>router.push('/auth')}
              style={{width:'100%',padding:'14px',background:'transparent',color:'#39ff14',border:'1px solid rgba(57,255,20,0.3)',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer'}}>
              無料で始める
            </button>
          </div>

          {/* プレミアムプラン */}
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',borderRadius:20,padding:'24px',border:'2px solid #ffd60a',position:'relative'}}>
            <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#ffd60a',color:'#000',fontSize:11,fontWeight:800,padding:'4px 16px',borderRadius:20}}>
              おすすめ
            </div>
            <div style={{fontSize:14,fontWeight:800,marginBottom:4,color:'#ffd60a'}}>プレミアムプラン</div>
            <div style={{fontSize:32,fontWeight:900,color:'#ffd60a',marginBottom:4}}>¥2,980<span style={{fontSize:14,color:'#555',fontWeight:400}}>/月</span></div>
            <div style={{fontSize:11,color:'#555',marginBottom:16}}>※ 近日公開予定</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
              {['✅ フリープランの全機能','✅ トレーナーとの月1回面談','✅ 食事プラン作成サポート','✅ 優先サポート対応','✅ 特別トレーニングメニュー'].map(item=>(
                <div key={item} style={{fontSize:13,color:'#888'}}>{item}</div>
              ))}
            </div>
            <button onClick={()=>router.push('/auth')}
              style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#ffd60a,#ff8c00)',color:'#000',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer'}}>
              💎 プレミアムを試す
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{background:'#1e1e26',borderTop:'1px solid #2a2a36',padding:'60px 24px',textAlign:'center'}}>
        <div style={{maxWidth:480,margin:'0 auto'}}>
          <div style={{fontSize:28,fontWeight:900,marginBottom:16,lineHeight:1.4}}>
            今日から<span style={{color:'#39ff14'}}>変わり始める</span>
          </div>
          <div style={{fontSize:14,color:'#555',marginBottom:32,lineHeight:1.8}}>
            登録無料・クレジットカード不要<br/>
            3分で始められます
          </div>
          <button onClick={()=>router.push('/auth')}
            style={{width:'100%',maxWidth:360,padding:'20px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:16,fontSize:17,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 24px rgba(57,255,20,0.3)'}}>
            ⚡ 無料で始める
          </button>
        </div>
      </div>

      {/* フッター */}
      <div style={{padding:'24px',textAlign:'center',borderTop:'1px solid #1e1e26'}}>
        <div style={{fontSize:12,color:'#333'}}>© 2024 MyTrainer. All rights reserved.</div>
      </div>

    </div>
  )
}