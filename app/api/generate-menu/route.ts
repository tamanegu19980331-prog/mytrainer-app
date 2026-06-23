import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { profile, diag, goal, posture, fitness } = await req.json()

    // DBからメニューを全件取得
    const { data: menuDB } = await supabase
      .from('menus')
      .select('*')
      .eq('is_active', true)

    const diagText = Object.entries(diag).map(([k,v]) => `${k}:${v}`).join('\n')
    const postureText = posture?.join('・') || 'なし'
    const fitnessText = fitness ? Object.entries(fitness).map(([k,v]: any) => k+':'+v.value+(v.level?.label?'('+v.level.label+')':'')).join('・') : 'なし'
    const today = new Date().getDay()
    const todayIdx = today === 0 ? 6 : today - 1
    const dayNames = ['月','火','水','木','金','土','日']

    // BMI計算
    const bmi = profile?.height && profile?.weight
      ? (Number(profile.weight) / ((Number(profile.height) / 100) ** 2)).toFixed(1)
      : '22'
    const bmiNum = Number(bmi)
    const bmiLabel = bmiNum < 18.5 ? '低体重' : bmiNum < 25 ? '標準' : bmiNum < 30 ? '過体重' : '肥満'

    // メニューDBをAIに渡す
    const menuList = menuDB?.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      target_gender: m.target_gender,
      target_age: m.target_age,
      target_bmi: m.target_bmi,
      target_goal: m.target_goal,
      difficulty: m.difficulty,
      tags: m.tags,
      description: m.description,
    })) || []

    const prompt = `
あなたは現役パーソナルトレーナー監修AIです。
以下のユーザー情報を分析し、用意されたメニューDBから最適なメニューを選択してJSONで返してください。

【ユーザー情報】
名前: ${profile?.name}
性別: ${profile?.gender}
身長: ${profile?.height}cm
体重: ${profile?.weight}kg
BMI: ${bmi}（${bmiLabel}）
目標体型: ${goal}
姿勢の問題: ${postureText}
体力テスト結果: ${fitnessText}
今日: ${dayNames[todayIdx]}曜日

【診断回答】
${diagText}

【利用可能なメニューDB】
${JSON.stringify(menuList, null, 2)}

【指示】
1. ユーザーの性別・BMI・目標・診断結果を総合的に分析する
2. メニューDBの中から最適なメニューを1つ選択する（姿勢改善以外）
3. 姿勢の問題がある場合は姿勢改善メニューも1つ選択する
4. 選択したメニューのIDを返す

以下のJSON形式のみで返してください（マークダウン記号不要）:
{
  "selectedMenuId": "選択したメニューのuuid",
  "selectedPostureMenuId": "選択した姿勢改善メニューのuuid（姿勢問題がない場合はnull）",
  "userType": "このユーザーのタイプ（例：三日坊主型、食事変えたくない型など）",
  "typeReason": "タイプ判定の理由50字",
  "greeting": "トレーナーからの一言（ユーザー名を含めて）",
  "whyThisMenu": "このメニューを選んだ理由60字",
  "closingTip": "トレーニング後のアドバイス"
}
`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    // 選択されたメニューの詳細を取得
    const selectedMenu = menuDB?.find(m => m.id === parsed.selectedMenuId)
    const selectedPostureMenu = parsed.selectedPostureMenuId
      ? menuDB?.find(m => m.id === parsed.selectedPostureMenuId)
      : null

    if (!selectedMenu) {
      throw new Error('メニューが選択されませんでした')
    }

    return NextResponse.json({
      theme: selectedMenu.name,
      level: selectedMenu.difficulty,
      totalDuration: 30,
      totalCalories: 200,
      whyThisMenu: parsed.whyThisMenu,
      exercises: selectedMenu.exercises || [],
      postureExercises: selectedPostureMenu?.exercises || [],
      greeting: parsed.greeting,
      closingTip: parsed.closingTip,
      userType: parsed.userType,
      typeReason: parsed.typeReason,
      menuId: selectedMenu.id,
      postureMenuId: selectedPostureMenu?.id || null,
    })

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}