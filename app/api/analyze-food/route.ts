import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `あなたは優秀な栄養士AIです。この食事の写真を詳しく分析してください。

【重要ルール】
- パッケージ・ラベル・ロゴ・商品名の文字を全て読み取って正確に識別する
- カップ麺・パック飯・缶飲料・コンビニ食品は商品名から正確なカロリーを算出する
- パッケージに記載のカロリー・栄養成分を優先する
- 写真に写っている全ての食品・飲み物を漏れなく1品ずつ分析する
- 食べかけ・飲みかけのものも分析対象に含める

以下のJSON形式のみで返してください（マークダウン記号・説明文は絶対に不要）:
{
  "items": [
    {
      "name": "商品名または料理名",
      "calories": 355,
      "protein": 10,
      "carbs": 50,
      "fat": 12,
      "ingredients": ["主な食材1", "食材2"]
    }
  ],
  "totalCalories": 636,
  "totalProtein": 14,
  "totalCarbs": 112,
  "totalFat": 12,
  "advice": "この食事とトレーニングの関係についての具体的なアドバイス（60字以内）",
  "rating": "良い/普通/改善推奨"
}`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}