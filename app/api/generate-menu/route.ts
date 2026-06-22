import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { profile, diag, goal, posture } = await req.json()

    const diagText = Object.entries(diag).map(([k,v]) => `${k}:${v}`).join('\n')
    const postureText = posture?.join('・') || 'なし'

    const today = new Date().getDay()
    const todayIdx = today === 0 ? 6 : today - 1
    const dayNames = ['月','火','水','木','金','土','日']

    const prompt = `
以下のユーザー情報からトレーニングメニューをJSONで返してください。

名前: ${profile?.name}
性別: ${profile?.gender}
身長: ${profile?.height}cm
体重: ${profile?.weight}kg
目標体型: ${goal}
姿勢の問題: ${postureText}
今日: ${dayNames[todayIdx]}曜日

診断回答:
${diagText}

以下のJSON形式のみで返してください（マークダウン記号不要）:
{
  "theme": "メニューのテーマ",
  "level": "初級/中級/上級",
  "totalDuration": 30,
  "totalCalories": 200,
  "whyThisMenu": "このメニューを提案した理由60字",
  "exercises": [
    {
      "name": "種目名",
      "muscle": "対象筋肉",
      "sets": 3,
      "reps": "回数or秒",
      "durationSec": 30,
      "restSec": 60,
      "trainerTip": "アドバイス",
      "why": "理由"
    }
  ],
  "greeting": "トレーナーからの一言",
  "closingTip": "アドバイス"
}
`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    return NextResponse.json(parsed)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}