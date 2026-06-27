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

const POSTURE_EXERCISES: Record<string, any[]> = {
  anterior_tilt: [
    {name:"ハーフニーリングストレッチ",muscle:"腸腰筋",sets:3,reps:"30秒（両側）",durationSec:30,restSec:20,why:"硬くなった腸腰筋をほぐす"},
    {name:"ヒップリフト",muscle:"臀部・ハムスト",sets:3,reps:"15回",durationSec:35,restSec:30,why:"弱くなった臀部を強化"},
  ],
  posterior_tilt: [
    {name:"ハムストリングスストレッチ",muscle:"ハムスト",sets:3,reps:"30秒（両側）",durationSec:30,restSec:20,why:"硬くなったハムストリングスをほぐす"},
    {name:"バードドッグ",muscle:"脊柱起立筋",sets:3,reps:"10回（両側）",durationSec:35,restSec:30,why:"腰背部を強化"},
  ],
  rounded_shoulders: [
    {name:"胸筋ストレッチ",muscle:"大胸筋",sets:3,reps:"30秒（両側）",durationSec:30,restSec:20,why:"縮こまった胸筋をほぐす"},
    {name:"YTWL（肩甲骨安定）",muscle:"菱形筋・僧帽筋",sets:3,reps:"各10回",durationSec:40,restSec:30,why:"肩甲骨周りを4方向から鍛える"},
  ],
  kyphosis: [
    {name:"スーパーマン",muscle:"脊柱起立筋",sets:3,reps:"12回",durationSec:30,restSec:30,why:"背中全体の筋肉を強化"},
    {name:"YTWL（胸椎伸展）",muscle:"脊柱起立筋・菱形筋",sets:3,reps:"各8回",durationSec:40,restSec:30,why:"猫背の逆方向で胸椎を伸展"},
  ],
  straight_neck: [
    {name:"チンタック",muscle:"深頸屈筋",sets:5,reps:"10回（5秒キープ）",durationSec:25,restSec:15,why:"前に出た頭を正しい位置に戻す"},
    {name:"YTWL（壁立ち版）",muscle:"菱形筋・僧帽筋",sets:3,reps:"各8回",durationSec:35,restSec:30,why:"首・肩甲骨を正しい位置で安定させる"},
  ],
  elevated_shoulders: [
    {name:"ネックストレッチ（側屈）",muscle:"僧帽筋上部",sets:3,reps:"30秒（両側）",durationSec:30,restSec:20,why:"過緊張した僧帽筋上部をほぐす"},
    {name:"YTWL（肩甲骨下制）",muscle:"僧帽筋下部・菱形筋",sets:3,reps:"各10回",durationSec:40,restSec:30,why:"肩を下げる筋肉を強化"},
  ],
  o_legs: [
    {name:"内転筋スクイーズ",muscle:"内転筋",sets:3,reps:"15回（10秒キープ）",durationSec:30,restSec:20,why:"弱くなった内転筋を強化"},
    {name:"スモウスクワット",muscle:"内転筋・臀部",sets:3,reps:"15回",durationSec:35,restSec:30,why:"内転筋と臀部を同時に強化"},
  ],
  x_legs: [
    {name:"サイドライングレッグレイズ",muscle:"中臀筋",sets:3,reps:"15回（両側）",durationSec:30,restSec:20,why:"弱くなった中臀筋を強化"},
    {name:"ヒップアブダクション",muscle:"中臀筋・小臀筋",sets:3,reps:"15回（両側）",durationSec:30,restSec:20,why:"股関節外転筋を強化"},
  ],
  xo_legs: [
    {name:"タオルグリップ（足指強化）",muscle:"足内在筋",sets:3,reps:"30秒",durationSec:30,restSec:20,why:"足部アーチを支える筋肉を強化"},
    {name:"カーフレイズ（内外バランス）",muscle:"ふくらはぎ・足部",sets:3,reps:"15回",durationSec:25,restSec:20,why:"足首のバランスを整える"},
  ],
}

export async function POST(req: NextRequest) {
  try {
    const { profile, diag, goal, posture, fitness } = await req.json()

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

    const { data: scheduleData } = await supabase
      .from('weekly_schedule')
      .select('*')
      .eq('day_of_week', today)
      .single()
    const todayCategory = scheduleData?.category || null
    const isRestDay = scheduleData?.is_rest || false

    const bmi = profile?.height && profile?.weight
      ? (Number(profile.weight) / ((Number(profile.height) / 100) ** 2)).toFixed(1)
      : '22'
    const bmiNum = Number(bmi)
    const bmiLabel = bmiNum < 18.5 ? '低体重' : bmiNum < 25 ? '標準' : bmiNum < 30 ? '過体重' : '肥満'

    const filteredMenuDB = todayCategory && !isRestDay
      ? menuDB?.filter(m => m.category === todayCategory || m.category === '姿勢改善')
      : menuDB
    const menuList = (filteredMenuDB?.length ? filteredMenuDB : menuDB)?.map(m => ({
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

    const tutGuide = `
TUT目安:
- 筋力向上: 10〜20秒/セット（テンポ: 2秒下げ・1秒止め・1秒上げ）
- 筋肥大: 30〜60秒/セット（テンポ: 4秒下げ・1秒止め・2秒上げ）
- 筋持久力: 60秒以上/セット（テンポ: 2秒下げ・0秒止め・2秒上げ）
- 引き締め: 20〜40秒/セット（テンポ: 3秒下げ・1秒止め・1秒上げ）
- 健康維持: 20〜30秒/セット（テンポ: 2秒下げ・0秒止め・2秒上げ）`

    const prompt = `
あなたは現役パーソナルトレーナー監修AIです。
以下のユーザー情報を分析し、用意されたメニューDBから最適なメニューを選択してJSONで返してください。

【ユーザー情報】
名前: ${profile?.name}
性別: ${profile?.gender}
身長: ${profile?.height}cm
体重: ${profile?.weight}kg
BMI: ${bmi}（${bmiLabel}）
年齢: ${profile?.age || '不明'}歳
目標体型: ${goal}
姿勢の問題: ${postureText}
体力テスト: ${fitnessText}
今日: ${dayNames[todayIdx]}曜日
今日のカテゴリ: ${isRestDay ? '休養日（軽めのストレッチのみ）' : todayCategory || '制限なし'}

【診断回答】
${diagText}

【利用可能なメニューDB】
${JSON.stringify(menuList, null, 2)}

${tutGuide}

【指示】
1. ユーザーの性別・BMI・年齢・目標・診断結果・体力テスト結果を総合的に分析する
2. 今日のカテゴリに合ったメニューを1つ選択する
3. 姿勢の問題がある場合は姿勢改善メニューも1つ選択する
4. 体力テスト結果に基づいて難易度を調整する
5. ユーザーの目標に合ったTUTを決定する
6. whyThisMenuは必ずユーザーの体力テスト結果・姿勢問題・BMI・目標体型を具体的な数値や種目名を入れて説明する
以下のJSON形式のみで返してください（マークダウン記号不要）:
{
  "selectedMenuId": "選択したメニューのuuid",
  "selectedPostureMenuId": "選択した姿勢改善メニューのuuid（姿勢問題がない場合はnull）",
  "userType": "このユーザーのタイプ",
  "typeReason": "タイプ判定の理由50字",
  "greeting": "トレーナーからの一言",
"whyThisMenu": "ユーザーの具体的なデータ（体力テスト結果・姿勢問題・BMI・目標）を明示しながらこのメニューを選んだ理由を80字で。例：腕立てBランク・巻き肩があるため〇〇を選択。△△種目はあなたの肩甲骨改善に特化しています",  "closingTip": "トレーニング後のアドバイス",
  "tutSeconds": 40,
  "tutTempo": "4秒下げ・1秒止め・2秒上げ",
  "tutGoal": "筋肥大"
}
`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    const selectedMenu = menuDB?.find(m => m.id === parsed.selectedMenuId)
    const selectedPostureMenu = parsed.selectedPostureMenuId
      ? menuDB?.find(m => m.id === parsed.selectedPostureMenuId)
      : null

    if (!selectedMenu) {
      throw new Error('メニューが選択されませんでした')
    }

    const postureExercises: any[] = []
    if (posture && posture.length > 0) {
      posture.slice(0, 3).forEach((id: string) => {
        const exs = POSTURE_EXERCISES[id]
        if (exs) postureExercises.push(...exs)
      })
    }

    return NextResponse.json({
      theme: selectedMenu.name,
      level: selectedMenu.difficulty,
      totalDuration: 30,
      totalCalories: 200,
      whyThisMenu: parsed.whyThisMenu,
      exercises: selectedMenu.exercises || [],
      postureExercises: selectedPostureMenu?.exercises || postureExercises,
      greeting: parsed.greeting,
      closingTip: parsed.closingTip,
      userType: parsed.userType,
      typeReason: parsed.typeReason,
      menuId: selectedMenu.id,
      postureMenuId: selectedPostureMenu?.id || null,
      tutSeconds: parsed.tutSeconds || 30,
      tutTempo: parsed.tutTempo || '',
      tutGoal: parsed.tutGoal || '',
    })

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}