import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json()

    // ユーザーデータを取得
    const [profile, fitnessLog, trainingLogs, diagLog] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('fitness_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('training_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('diagnosis_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
    ])

    const p = profile.data
    const f = fitnessLog.data
    const t = trainingLogs.data || []
    const d = diagLog.data

    const systemPrompt = `あなたは親切で熱血なAIパーソナルトレーナーです。
ユーザーのデータを把握した上で、具体的で実践的なアドバイスをしてください。
返答は200字以内で簡潔に。絵文字を適度に使って親しみやすく。

【ユーザー情報】
名前: ${p?.name || ''}
性別: ${p?.gender || ''}
年齢: ${p?.age || ''}歳
身長: ${p?.height || ''}cm
体重: ${p?.weight || ''}kg
BMI: ${p?.height && p?.weight ? (Number(p.weight) / ((Number(p.height) / 100) ** 2)).toFixed(1) : ''}
目標: ${d?.goal || ''}
姿勢の問題: ${d?.posture?.join('・') || 'なし'}

【最新体力テスト】
腕立て: ${f?.pushup_value || '未測定'}回 (${f?.pushup_rank || '-'}ランク)
腹筋: ${f?.situp_value || '未測定'}回 (${f?.situp_rank || '-'}ランク)
プランク: ${f?.plank_value || '未測定'}秒 (${f?.plank_rank || '-'}ランク)

【最近のトレーニング】
${t.map(l => `${new Date(l.created_at).toLocaleDateString('ja-JP')}: ${l.menu_name} (${l.completed ? '完了' : '未完了'})`).join('\n') || 'まだ記録なし'}

ユーザーが困っていること・相談に対して、データを参照しながら具体的にアドバイスしてください。
励ましを忘れずに！`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages,
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ message: text })

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}