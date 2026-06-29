'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['すべて', 'トレーニング報告', '食事報告', '質問', '雑談', '達成報告']

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('雑談')
  const [filterCategory, setFilterCategory] = useState('すべて')
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set())
  const [ngWords, setNgWords] = useState<string[]>([])
  const [ngError, setNgError] = useState('')
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUserId(user.id)
    const { data: profile } = await supabase.from('users').select('name, is_admin').eq('id', user.id).single()
    setUserName(profile?.name || '匿名')
    setIsAdmin(profile?.is_admin || false)
    await loadPosts()
    const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
    setLikedPosts(new Set(likes?.map(l => l.post_id) || []))
    const { data: reports } = await supabase.from('post_reports').select('post_id').eq('user_id', user.id)
    setReportedPosts(new Set(reports?.map(r => r.post_id) || []))
    const { data: ng } = await supabase.from('ng_words').select('word')
    setNgWords(ng?.map(n => n.word) || [])
  }

  const loadPosts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('posts').select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts(data || [])
    setLoading(false)
  }

  const checkNgWords = (text: string) => {
    const found = ngWords.find(w => text.includes(w))
    return found || null
  }

  const submitPost = async () => {
    if (!content.trim() || !userId) return
    const ng = checkNgWords(content)
    if (ng) {
      setNgError(`「${ng}」は使用できない言葉が含まれています`)
      return
    }
    setNgError('')
    setPosting(true)
    await supabase.from('posts').insert({
      user_id: userId,
      user_name: userName,
      content: content.trim(),
      category,
    })
    setContent('')
    setShowForm(false)
    await loadPosts()
    setPosting(false)
  }

  const toggleLike = async (post: any) => {
    if (!userId) return
    if (likedPosts.has(post.id)) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId)
      await supabase.from('posts').update({ likes: Math.max(0, post.likes - 1) }).eq('id', post.id)
      setLikedPosts(s => { const n = new Set(s); n.delete(post.id); return n })
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, likes: Math.max(0, p.likes - 1) } : p))
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: userId })
      await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', post.id)
      setLikedPosts(s => new Set([...s, post.id]))
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p))
    }
  }

  const reportPost = async (post: any) => {
    if (!userId || reportedPosts.has(post.id)) return
    if (!confirm('この投稿を通報しますか？')) return
    await supabase.from('post_reports').insert({ post_id: post.id, user_id: userId, reason: '不適切な内容' })
    setReportedPosts(s => new Set([...s, post.id]))
    alert('通報しました。管理者が確認します。')
  }

  const deletePost = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(ps => ps.filter(p => p.id !== postId))
  }

  const categoryColor = (cat: string) => ({
    'トレーニング報告': '#39ff14',
    '食事報告': '#ff8c00',
    '質問': '#00c8ff',
    '雑談': '#888',
    '達成報告': '#ffd60a',
  }[cat] || '#888')

  const categoryEmoji = (cat: string) => ({
    'トレーニング報告': '💪',
    '食事報告': '🍱',
    '質問': '❓',
    '雑談': '💬',
    '達成報告': '🏆',
  }[cat] || '💬')

  const filteredPosts = filterCategory === 'すべて'
    ? posts
    : posts.filter(p => p.category === filterCategory)

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'たった今'
    if (min < 60) return `${min}分前`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}時間前`
    return `${Math.floor(h / 24)}日前`
  }

  return (
    <div style={{ background: '#16161a', minHeight: '100vh', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>

        {/* ヘッダー */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #1e1e26',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#16161a', zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#cc44ff', fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>COMMUNITY</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>みんなの広場</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <button onClick={() => router.push('/admin')}
                style={{ padding: '8px 12px', background: '#ff4455', border: 'none', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                管理
              </button>
            )}
            <button onClick={() => setShowForm(!showForm)}
              style={{
                padding: '10px 16px',
                background: showForm ? '#25252f' : 'linear-gradient(135deg,#cc44ff,#7c3aed)',
                border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              {showForm ? 'キャンセル' : '✏️ 投稿する'}
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 24px 0' }}>

          {/* 投稿フォーム */}
          {showForm && (
            <div style={{ background: '#1e1e26', borderRadius: 20, padding: 20, border: '1px solid #cc44ff', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#cc44ff', fontWeight: 700, marginBottom: 12 }}>新しい投稿</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {CATEGORIES.slice(1).map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    style={{
                      padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: category === cat ? categoryColor(cat) + '22' : '#25252f',
                      border: `1px solid ${category === cat ? categoryColor(cat) : '#2a2a36'}`,
                      borderRadius: 20, color: category === cat ? categoryColor(cat) : '#555',
                    }}>
                    {categoryEmoji(cat)} {cat}
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={e => { setContent(e.target.value); setNgError('') }}
                placeholder="トレーニングの報告や質問を投稿しよう！"
                maxLength={300}
                rows={4}
                style={{
                  width: '100%', background: '#25252f', border: `1px solid ${ngError ? '#ff4455' : '#2a2a36'}`,
                  borderRadius: 12, padding: '12px 14px', color: '#e8e8e8',
                  fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8,
                }}
              />
              {ngError && (
                <div style={{ fontSize: 12, color: '#ff4455', marginBottom: 8 }}>⚠️ {ngError}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#444' }}>{content.length}/300</span>
                <button onClick={submitPost} disabled={!content.trim() || posting}
                  style={{
                    padding: '10px 20px',
                    background: content.trim() ? 'linear-gradient(135deg,#cc44ff,#7c3aed)' : '#25252f',
                    color: content.trim() ? '#fff' : '#444', border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: content.trim() ? 'pointer' : 'not-allowed',
                  }}>
                  {posting ? '投稿中...' : '投稿する'}
                </button>
              </div>
            </div>
          )}

          {/* カテゴリフィルター */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  background: filterCategory === cat ? '#cc44ff22' : '#1e1e26',
                  border: `1px solid ${filterCategory === cat ? '#cc44ff' : '#2a2a36'}`,
                  borderRadius: 20, color: filterCategory === cat ? '#cc44ff' : '#555',
                }}>
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>読み込み中...</div>
          )}

          {!loading && filteredPosts.length === 0 && (
            <div style={{ background: '#1e1e26', borderRadius: 20, padding: '40px 24px', border: '1px solid #2a2a36', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>まだ投稿がありません</div>
              <div style={{ fontSize: 13, color: '#555' }}>最初の投稿をしてみましょう！</div>
            </div>
          )}

          {filteredPosts.map(post => (
            <div key={post.id} style={{
              background: '#1e1e26', borderRadius: 16, padding: '16px 18px',
              border: '1px solid #2a2a36', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#cc44ff,#7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, flexShrink: 0,
                  }}>
                    {post.user_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{post.user_name || '匿名'}</div>
                    <div style={{ fontSize: 10, color: '#444' }}>{timeAgo(post.created_at)}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: categoryColor(post.category) + '22',
                  border: `1px solid ${categoryColor(post.category)}44`,
                  color: categoryColor(post.category),
                  borderRadius: 20, padding: '3px 10px',
                }}>
                  {categoryEmoji(post.category)} {post.category}
                </span>
              </div>

              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#e8e8e8', marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                {post.content}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* 通報ボタン */}
                  {post.user_id !== userId && (
                    <button onClick={() => reportPost(post)}
                      style={{
                        padding: '5px 10px', fontSize: 11, cursor: 'pointer',
                        background: reportedPosts.has(post.id) ? 'rgba(255,140,0,0.1)' : 'transparent',
                        border: `1px solid ${reportedPosts.has(post.id) ? 'rgba(255,140,0,0.3)' : '#2a2a36'}`,
                        borderRadius: 16, color: reportedPosts.has(post.id) ? '#ff8c00' : '#444',
                      }}>
                      {reportedPosts.has(post.id) ? '通報済み' : '🚩 通報'}
                    </button>
                  )}
                  {/* 管理者削除ボタン */}
                  {isAdmin && (
                    <button onClick={() => deletePost(post.id)}
                      style={{
                        padding: '5px 10px', fontSize: 11, cursor: 'pointer',
                        background: 'rgba(255,68,85,0.1)',
                        border: '1px solid rgba(255,68,85,0.3)',
                        borderRadius: 16, color: '#ff4455',
                      }}>
                      🗑 削除
                    </button>
                  )}
                </div>

                {/* いいねボタン */}
                <button onClick={() => toggleLike(post)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px',
                    background: likedPosts.has(post.id) ? 'rgba(255,68,85,0.1)' : 'transparent',
                    border: `1px solid ${likedPosts.has(post.id) ? 'rgba(255,68,85,0.3)' : '#2a2a36'}`,
                    borderRadius: 20, cursor: 'pointer',
                    color: likedPosts.has(post.id) ? '#ff4455' : '#555',
                    fontSize: 13, fontWeight: 700,
                  }}>
                  {likedPosts.has(post.id) ? '❤️' : '🤍'} {post.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}