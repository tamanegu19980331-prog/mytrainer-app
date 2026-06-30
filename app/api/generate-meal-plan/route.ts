import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const { profile, foodProfile, goal, targetCalories, targetProtein } = await req.json()

    const dietTypeGuide: Record<string, string> = {
      'コンビニ派・時間なし型': 'コンビニやスーパーで買える具体的な商品名（サラダチキン、ゆで卵、プロテインバー、おにぎりなど）を使った提案にしてください。レシピや調理は一切含めないでください。',
      '外食多い・選択型': '外食チェーン（牛丼屋、定食屋、ファミレス、ラーメン屋など）での「何を選ぶべきか」という選び方ガイド中心にしてください。自炊レシピは最小限にしてください。',
      '自炊できる・PFC管理型': '具体的な分量・調理法を含むレシピを提示し、PFCバランスの数値も併記してください。',
      '2食・不規則型': '食べられるタイミングが不規則な前提で、まとめて栄養を摂る工夫や、欠食時のリカバリー方法を含めてください。',
      'まずはカロリーだけ型': 'PFCの細かい数値は前面に出さず、シンプルに「これくらいの量を食べればOK」という分かりやすい提案にしてください。',
    }

    const dietType = foodProfile?.diet_type || 'まずはカロリーだけ型'
    const guide = dietTypeGuide[dietType] || dietTypeGuide['まずはカロリーだけ型']

    const systemPrompt = `あなたは何万人ものクライアントを指導してきたプロの管理栄養士です。
ユーザーの生活スタイルに完全に合わせた、現実的で続けやすい1日の食事提案を行ってください。

# ユーザーの生活スタイル診断結果
- タイプ: ${dietType}
- 食事回数: ${foodProfile?.meal_count || '不明'}
- 自炊レベル: ${foodProfile?.cooking_level || '不明'}
- 外食/コンビニ頻度: ${foodProfile?.eating_out_frequency || '不明'}
- コンビニ利用意向: ${foodProfile?.convenience_store_pref || '不明'}
- PFC関心度: ${foodProfile?.pfc_interest || '不明'}
- 苦手な食品: ${foodProfile?.dislikes || 'なし'}

# 提案方針
${guide}

# 目標
- ゴール: ${goal || '健康維持'}
- 目標カロリー: ${targetCalories || '不明'}kcal/日
- 目標タンパク質: ${targetProtein || '不明'}g/日

# 出力形式
以下のJSON形式のみで出力してください。説明文やマークダウンの \`\`\`json は不要です。

{
  "summary": "この提案の要点を2-3文で",
  "meals": [
    {
      "label": "朝食 など食事回数に応じたラベル",
      "items": ["具体的な食品名や商品名"],
      "calories": 数値,
      "protein": 数値,
      "note": "この食事のポイント（1文）"
    }
  ],
  "tips": ["生活スタイルに合わせた実践的なアドバイス（2-3個）"]
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: '今日の食事提案をお願いします。' }],
    })

    const text = response.content.find(c => c.type === 'text')?.text || '{}'
    const cleaned = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '生成に失敗しました' }, { status: 500 })
  }
}