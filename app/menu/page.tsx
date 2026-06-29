'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { initAudio, playCountdown, playCountdownLast, playStart, playFinish, playNextSet, playExpGain, playLevelUp, playWarning } from '@/lib/sounds'

const LEVELS = [
  {lv:1,title:'入門者',minExp:0},
  {lv:2,title:'見習い',minExp:100},
  {lv:3,title:'トレーニー',minExp:250},
  {lv:4,title:'戦士',minExp:500},
  {lv:5,title:'猛者',minExp:900},
  {lv:6,title:'エース',minExp:1500},
  {lv:7,title:'マスター',minExp:2500},
  {lv:8,title:'レジェンド',minExp:4000},
]

function getLevel(exp: number) {
  let cur = LEVELS[0]
  for (const lv of LEVELS) { if (exp >= lv.minExp) cur = lv }
  return cur
}

const NO_TUT_KEYWORDS = ['プランク','キープ','ホールド','ストレッチ','ドローイン','ウォールシット','ジャンプ','ステップ','ハイニー','クラムシェル','レッグレイズ','バードドッグ','キャット','ウォーク','ジョグ','マーチ','タオル','チン']

const EXERCISE_TIPS: Record<string, { steps: string[], points: string[], youtube: string }> = {
  'スクワット': {
    steps: ['足を肩幅に開いて立つ', 'つま先を少し外側に向ける', '膝がつま先の方向に曲がるように下げる', '太ももが床と平行になるまで下げる', 'ゆっくり元に戻す'],
    points: ['膝が内側に入らないように注意', '背筋をまっすぐに保つ', 'かかとが浮かないように'],
    youtube: 'https://www.youtube.com/results?search_query=スクワット+やり方+フォーム',
  },
  'ヒップリフト': {
    steps: ['仰向けに寝て膝を曲げる', '足を腰幅に開く', 'お尻を締めながら持ち上げる', '肩から膝まで一直線にする', 'ゆっくり下ろす'],
    points: ['腰を反りすぎない', 'お尻をしっかり締める', '上げた位置で1秒キープ'],
    youtube: 'https://www.youtube.com/results?search_query=ヒップリフト+やり方+フォーム',
  },
  'プランク': {
    steps: ['肘を肩の真下につく', 'つま先を立てて体を持ち上げる', '頭からかかとまで一直線にする', 'その姿勢をキープする'],
    points: ['お尻が上がらないように', '腰が落ちないように', '呼吸を止めない'],
    youtube: 'https://www.youtube.com/results?search_query=プランク+やり方+フォーム',
  },
  'デッドバッグ': {
    steps: ['仰向けに寝て腕を天井に向ける', '膝を90度に曲げて持ち上げる', '対角線の腕と脚を同時に伸ばす', 'ゆっくり元に戻す', '反対側も同様に行う'],
    points: ['腰が床から離れないように', '呼吸を整えながら行う', 'ゆっくり動作する'],
    youtube: 'https://www.youtube.com/results?search_query=デッドバッグ+やり方+フォーム',
  },
  'バードドッグ': {
    steps: ['四つん這いになる', '背中をまっすぐに保つ', '対角線の腕と脚を同時に伸ばす', '3秒キープしてゆっくり戻す'],
    points: ['腰が回転しないように', '体幹を安定させる', '視線は床に向ける'],
    youtube: 'https://www.youtube.com/results?search_query=バードドッグ+やり方+フォーム',
  },
  'ドローイン': {
    steps: ['楽な姿勢で立つか座る', 'お腹をへこませるように力を入れる', 'その状態を10〜30秒キープ', 'ゆっくり緩める'],
    points: ['息を止めない', '横隔膜を使って呼吸する', '毎日継続することが大切'],
    youtube: 'https://www.youtube.com/results?search_query=ドローイン+やり方',
  },
  'チンタック': {
    steps: ['背筋を伸ばして座るか立つ', '顎を引いて頭を後ろに引く', '5秒キープする', 'ゆっくり元に戻す'],
    points: ['痛みを感じたら中止', '首を傾けない', '呼吸を止めない'],
    youtube: 'https://www.youtube.com/results?search_query=チンタック+やり方',
  },
  'YTWL': {
    steps: ['うつ伏せになる', 'Y字→T字→W字→L字の順に腕を動かす', '各ポジションで2秒キープ'],
    points: ['肩甲骨を意識して動かす', '首に力を入れない', 'ゆっくり丁寧に行う'],
    youtube: 'https://www.youtube.com/results?search_query=YTWL+肩甲骨+やり方',
  },
  'ランジ': {
    steps: ['足を肩幅に開いて立つ', '片足を大きく前に踏み出す', '後ろの膝が床につくギリギリまで下げる', '前足で蹴り上げて元に戻す'],
    points: ['前膝がつま先より前に出ないように', '上体をまっすぐに保つ', '体幹に力を入れる'],
    youtube: 'https://www.youtube.com/results?search_query=ランジ+やり方+フォーム',
  },
  'ブルガリアンスクワット': {
    steps: ['後ろの足をベンチや椅子に乗せる', '前足を大きく踏み出す', '後ろ膝を下げていく', '前足で蹴り上げて元に戻す'],
    points: ['前膝がつま先より前に出ないように', '上体をまっすぐに保つ', 'バランスに注意'],
    youtube: 'https://www.youtube.com/results?search_query=ブルガリアンスクワット+やり方',
  },
  'レッグレイズ': {
    steps: ['仰向けに寝る', '両脚をまっすぐ伸ばす', '床と垂直になるまで持ち上げる', 'ゆっくり下ろす（床につけない）'],
    points: ['腰が浮かないように', '下ろす時もゆっくり', '呼吸を止めない'],
    youtube: 'https://www.youtube.com/results?search_query=レッグレイズ+やり方+フォーム',
  },
  'クランチ': {
    steps: ['仰向けに寝て膝を曲げる', '手を頭の後ろか胸の前に置く', '肩甲骨が浮くまで上体を起こす', 'ゆっくり元に戻す'],
    points: ['首に力を入れない', '反動を使わない', 'お腹を意識して動かす'],
    youtube: 'https://www.youtube.com/results?search_query=クランチ+やり方+フォーム',
  },
  'マウンテンクライマー': {
    steps: ['腕立て伏せの姿勢になる', '片膝を胸に引きつける', '素早く左右交互に行う'],
    points: ['お尻が上がらないように', '体幹を安定させる', 'リズムよく行う'],
    youtube: 'https://www.youtube.com/results?search_query=マウンテンクライマー+やり方',
  },
  '腕立て': {
    steps: ['手を肩幅より少し広めにつく', '体をまっすぐに保つ', '胸が床につくまで下げる', '腕を伸ばして元に戻す'],
    points: ['お尻が上がらないように', '肘は45度程度外に向ける', '体幹に力を入れる'],
    youtube: 'https://www.youtube.com/results?search_query=腕立て伏せ+やり方+フォーム',
  },
  'プッシュアップ': {
    steps: ['手を肩幅より少し広めにつく', '体をまっすぐに保つ', '胸が床につくまで下げる', '腕を伸ばして元に戻す'],
    points: ['お尻が上がらないように', '肘は45度程度外に向ける', '体幹に力を入れる'],
    youtube: 'https://www.youtube.com/results?search_query=腕立て伏せ+やり方+フォーム',
  },
  'スーパーマン': {
    steps: ['うつ伏せに寝る', '両手を前に伸ばす', '腕と脚を同時に持ち上げる', '3秒キープしてゆっくり下ろす'],
    points: ['首に力を入れない', '無理に高く上げない', '背中全体を意識する'],
    youtube: 'https://www.youtube.com/results?search_query=スーパーマン+背筋+やり方',
  },
  'サイドプランク': {
    steps: ['横向きに寝て肘をつく', '体を持ち上げて一直線にする', '腰が落ちないようにキープする'],
    points: ['肩に力が入りすぎないように', '体が前後に傾かないように', '呼吸を止めない'],
    youtube: 'https://www.youtube.com/results?search_query=サイドプランク+やり方+フォーム',
  },
  'ヒップアブダクション': {
    steps: ['横向きに寝る', '上側の脚をまっすぐ伸ばす', '脚を45度程度持ち上げる', 'ゆっくり下ろす'],
    points: ['体が前後に傾かないように', '股関節を意識する', 'ゆっくり動作する'],
    youtube: 'https://www.youtube.com/results?search_query=ヒップアブダクション+やり方',
  },
  'カーフレイズ': {
    steps: ['足を腰幅に開いて立つ', 'かかとをゆっくり持ち上げる', '一番上で1秒キープ', 'ゆっくり下ろす'],
    points: ['反動を使わない', 'バランスを崩さないように', 'ふくらはぎを意識する'],
    youtube: 'https://www.youtube.com/results?search_query=カーフレイズ+やり方',
  },
  'ネックストレッチ': {
    steps: ['背筋を伸ばして座る', '頭をゆっくり横に傾ける', '15〜30秒キープする', '反対側も同様に行う'],
    points: ['痛みを感じたら中止', '肩が上がらないように', 'ゆっくり丁寧に行う'],
    youtube: 'https://www.youtube.com/results?search_query=ネックストレッチ+やり方',
  },
  '胸筋ストレッチ': {
    steps: ['壁や柱に腕をつける', '体を前に向けてひねる', '胸が伸びる感覚を確認する', '15〜30秒キープする'],
    points: ['痛みを感じたら中止', '呼吸を止めない', 'ゆっくり伸ばす'],
    youtube: 'https://www.youtube.com/results?search_query=胸筋ストレッチ+やり方',
  },
  'ハムストリングス': {
    steps: ['床に座って脚を伸ばす', '背筋を伸ばしたまま前に倒れる', '太ももの裏が伸びる感覚を確認', '20〜30秒キープする'],
    points: ['膝を曲げない', '反動をつけない', '痛みを感じたら中止'],
    youtube: 'https://www.youtube.com/results?search_query=ハムストリングスストレッチ+やり方',
  },
  'ハーフニーリング': {
    steps: ['片膝をついてひざまずく', '後ろ脚の股関節を前に押し出す', '腸腰筋が伸びる感覚を確認', '20〜30秒キープする', '反対側も同様に行う'],
    points: ['上体をまっすぐに保つ', '腰を反らさない', '痛みを感じたら中止'],
    youtube: 'https://www.youtube.com/results?search_query=ハーフニーリングストレッチ+やり方',
  },
  'スモウスクワット': {
    steps: ['足を肩幅の1.5倍に開く', 'つま先を45度外に向ける', '膝をつま先方向に曲げながら下げる', '太ももが床と平行になるまで下げる', 'ゆっくり元に戻す'],
    points: ['膝が内側に入らないように', '背筋をまっすぐに保つ', '内ももを意識する'],
    youtube: 'https://www.youtube.com/results?search_query=スモウスクワット+やり方',
  },
  'ウォールシット': {
    steps: ['壁に背中をつける', '膝を90度に曲げてスクワットの姿勢をとる', 'その姿勢をキープする'],
    points: ['膝がつま先より前に出ないように', '背中を壁から離さない', '呼吸を止めない'],
    youtube: 'https://www.youtube.com/results?search_query=ウォールシット+やり方',
  },
  'タオル': {
    steps: ['タオルを足の指にかける', '指でタオルをつかむように力を入れる', '10〜15回繰り返す'],
    points: ['痛みを感じたら中止', '足の指全体を使う', '毎日継続することが大切'],
    youtube: 'https://www.youtube.com/results?search_query=足指トレーニング+タオル+やり方',
  },
  'ウォールエンジェル': {
    steps: ['壁に背中をつけて立つ', '両腕を壁につけたままバンザイする', '腕が壁から離れないようにゆっくり上げ下げする'],
    points: ['腰が壁から離れないように', '肩甲骨を意識して動かす', '痛みを感じたら中止'],
    youtube: 'https://www.youtube.com/results?search_query=ウォールエンジェル+やり方',
  },
  '頸部後面ストレッチ': {
    steps: ['背筋を伸ばして座る', '両手を頭の後ろに置く', '頭をゆっくり前に倒す', '首の後ろが伸びる感覚を確認', '20〜30秒キープする'],
    points: ['痛みを感じたら中止', '呼吸を止めない', 'ゆっくり丁寧に行う'],
    youtube: 'https://www.youtube.com/results?search_query=頸部ストレッチ+やり方',
  },
  '肩甲骨ほぐし': {
    steps: ['背筋を伸ばして座る', '両腕を前に伸ばして肩甲骨を広げる', '次に両肘を引いて肩甲骨を寄せる', '10〜15回繰り返す'],
    points: ['肩甲骨の動きを意識する', '首に力を入れない', 'ゆっくり丁寧に行う'],
    youtube: 'https://www.youtube.com/results?search_query=肩甲骨ほぐし+やり方',
  },
  'ストレッチ': {
    steps: ['対象の筋肉をゆっくり伸ばす', '痛みのない範囲で伸ばす', '20〜30秒キープする', 'ゆっくり元に戻す'],
    points: ['反動をつけない', '呼吸を止めない', '痛みを感じたら中止'],
    youtube: 'https://www.youtube.com/results?search_query=ストレッチ+やり方',
  },
  '内転筋': {
    steps: ['足を腰幅に開いて立つ', '内ももを意識して締める', '10秒キープする', 'ゆっくり緩める'],
    points: ['お尻に力が入りすぎないように', '内ももを意識する', '呼吸を止めない'],
    youtube: 'https://www.youtube.com/results?search_query=内転筋トレーニング+やり方',
  },
  'バーピー': {
    steps: ['立った状態から手を床につく', '足を後ろに引いてプランクの姿勢になる', '腕立て伏せを1回行う', '足を手の横に引き寄せる', '勢いよくジャンプして両手を上げる'],
    points: ['着地は膝を曲げてやわらかく', 'テンポよくリズミカルに行う', '体幹を常に締めておく'],
    youtube: 'https://www.youtube.com/results?search_query=バーピー+やり方+フォーム',
  },
  'バイシクルクランチ': {
    steps: ['仰向けに寝て手を頭の後ろに置く', '膝を90度に曲げて持ち上げる', '右肘と左膝を近づけながら上体をひねる', '左右交互にリズムよく行う'],
    points: ['首に力を入れない', 'ゆっくり丁寧に行う方が効果的', 'お腹を常に意識する'],
    youtube: 'https://www.youtube.com/results?search_query=バイシクルクランチ+やり方+フォーム',
  },
  'ダイヤモンドプッシュアップ': {
    steps: ['手を胸の前でダイヤモンド形に置く', '体をまっすぐに保つ', '胸が手につくまで下げる', '腕を伸ばして元に戻す'],
    points: ['肘が外に開かないように', '体幹を締めておく', '最初はゆっくり行う'],
    youtube: 'https://www.youtube.com/results?search_query=ダイヤモンドプッシュアップ+やり方',
  },
  'パイクプッシュアップ': {
    steps: ['お尻を高く上げて逆V字の姿勢になる', '肘を曲げて頭を床に近づける', '腕を伸ばして元に戻す'],
    points: ['お尻が下がらないように', '肩を意識して動かす', '首に負担をかけない'],
    youtube: 'https://www.youtube.com/results?search_query=パイクプッシュアップ+やり方',
  },
  'シングルレッグスクワット': {
    steps: ['片足で立つ', '軸足の膝を曲げてゆっくり下げる', '太ももが床と平行になるまで下げる', 'ゆっくり元に戻す'],
    points: ['膝が内側に入らないように', 'バランスを崩さないよう体幹を締める', '最初は浅くてOK'],
    youtube: 'https://www.youtube.com/results?search_query=シングルレッグスクワット+やり方',
  },
  'リバースプッシュアップ': {
    steps: ['椅子や床に手をついて後ろ向きに座る', '膝を90度に曲げる', '肘を曲げてお尻を下げる', '腕を伸ばして元に戻す'],
    points: ['肘が外に開かないように', '肩に力が入りすぎないように', 'ゆっくり丁寧に行う'],
    youtube: 'https://www.youtube.com/results?search_query=リバースプッシュアップ+やり方',
  },
  'アームサークル': {
    steps: ['足を肩幅に開いて立つ', '両腕を横に広げる', '小さな円から大きな円へと回す', '前回し・後ろ回しを各20回行う'],
    points: ['肩をしっかり回す', '背筋を伸ばして行う', '痛みを感じたら中止'],
    youtube: 'https://www.youtube.com/results?search_query=アームサークル+肩甲骨+やり方',
  },
  'ジャンプスクワット': {
    steps: ['足を肩幅に開いて立つ', 'スクワットの姿勢まで下げる', '勢いよくジャンプする', '膝を曲げてやわらかく着地する'],
    points: ['着地時に膝が内側に入らないように', '着地音を小さくする', '腰を痛めないよう無理しない'],
    youtube: 'https://www.youtube.com/results?search_query=ジャンプスクワット+やり方+フォーム',
  },
  'その場ジョギング': {
    steps: ['その場で軽くジョギングする', '膝を少し高めに上げる', 'リズムよく腕を振る', '呼吸を整えながら続ける'],
    points: ['かかとから着地しない', 'つま先で軽く着地する', '無理のないペースで行う'],
    youtube: 'https://www.youtube.com/results?search_query=その場ジョギング+やり方',
  },
  'インターバル': {
    steps: ['高強度の運動を20〜40秒行う', '10〜20秒休憩する', 'これを繰り返す'],
    points: ['呼吸を整えながら行う', '無理しすぎない', '体調に合わせてペースを調整'],
    youtube: 'https://www.youtube.com/results?search_query=インターバルトレーニング+やり方',
  },
  'バックエクステンション': {
    steps: ['うつ伏せに寝て両手を頭の後ろか前に伸ばす', '上体と脚を同時または片方ずつ持ち上げる', '背中が伸びる感覚を確認する', '3秒キープしてゆっくり下ろす'],
    points: ['首に力を入れない', '無理に高く上げない', '腰を痛めないようゆっくり行う'],
    youtube: 'https://www.youtube.com/results?search_query=バックエクステンション+やり方+フォーム',
  },
}

function getExerciseTip(name: string) {
  // 完全一致優先
  for (const key of Object.keys(EXERCISE_TIPS)) {
    if (name.includes(key)) return EXERCISE_TIPS[key]
  }
  // キーワード部分一致
  const keywords: Record<string, string> = {
    'バックエクステンション': 'バックエクステンション',
    'バック': 'バックエクステンション',
    'バーピー': 'バーピー',
    'バイシクル': 'バイシクルクランチ',
    'ダイヤモンド': 'ダイヤモンドプッシュアップ',
    'パイク': 'パイクプッシュアップ',
    'シングルレッグ': 'シングルレッグスクワット',
    'リバース': 'リバースプッシュアップ',
    'アームサークル': 'アームサークル',
    'ジャンプスクワット': 'ジャンプスクワット',
    'その場': 'その場ジョギング',
    'ジョギング': 'その場ジョギング',
    'インターバル': 'インターバル',
    '膝つき': '腕立て',
    'ワイドスクワット': 'スクワット',
    'スクワット': 'スクワット',
    'プランク': 'プランク',
    'プッシュ': '腕立て',
    'ヒップ': 'ヒップリフト',
    'ランジ': 'ランジ',
    'ストレッチ': 'ストレッチ',
    'ほぐし': 'ストレッチ',
    'クランチ': 'クランチ',
    '腹筋': 'クランチ',
    'バードドッグ': 'バードドッグ',
    'デッドバッグ': 'デッドバッグ',
    'ドローイン': 'ドローイン',
    'サイドプランク': 'サイドプランク',
    'レッグレイズ': 'レッグレイズ',
    'ヒップアブダクション': 'ヒップアブダクション',
    'カーフレイズ': 'カーフレイズ',
    'スーパーマン': 'スーパーマン',
    'マウンテンクライマー': 'マウンテンクライマー',
    'ウォールエンジェル': 'ウォールエンジェル',
    'YTWL': 'YTWL',
    'チンタック': 'チンタック',
    '頸部': '頸部後面ストレッチ',
    '肩甲骨': '肩甲骨ほぐし',
  }
  for (const [keyword, tipKey] of Object.entries(keywords)) {
    if (name.includes(keyword) && EXERCISE_TIPS[tipKey]) {
      return EXERCISE_TIPS[tipKey]
    }
  }
  return null
}

const shouldShowTut = (name: string) => !NO_TUT_KEYWORDS.some(k => name.includes(k))

const isBothSidesReps = (reps: string) =>
  reps?.includes('両側') || reps?.includes('両手') || reps?.includes('左右')

function calcTutSec(ex: any, tutTempo: string): number {
  const repsText = ex.reps || ''
  const bothSides = isBothSidesReps(repsText)
  if (repsText.includes('秒')) {
    const base = ex.durationSec || 30
    return bothSides ? base * 2 : base
  }
  const repsNum = parseInt(repsText) || 0
  if (shouldShowTut(ex.name) && tutTempo && repsNum > 0) {
    const nums = tutTempo.match(/\d+/g)?.map(Number) || []
    const secPerRep = nums.reduce((a, b) => a + b, 0)
    if (secPerRep > 0) {
      const multiplier = bothSides ? 2 : 1
      return Math.max(secPerRep * repsNum * multiplier, ex.durationSec || 30)
    }
  }
  const base = ex.durationSec || 30
  return bothSides ? base * 2 : base
}

export default function MenuPage() {
  const [status, setStatus] = useState<'loading'|'done'|'error'>('loading')
  const [menu, setMenu] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'view'|'training'>('view')
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [phase, setPhase] = useState<'countdown'|'exercise'|'rest'|'done'>('countdown')
  const [timer, setTimer] = useState(5)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [expandedTip, setExpandedTip] = useState<string|null>(null)
  const [completed, setCompleted] = useState(false)
  const [expGained, setExpGained] = useState(0)
  const [levelUp, setLevelUp] = useState<any>(null)
  const [newStreak, setNewStreak] = useState(0)
  const intervalRef = useRef<any>(null)
  const menuRef = useRef<any>(null)
  const exercisesRef = useRef<any[]>([])
  const router = useRouter()

  const steps = [
    '📅 データを分析中...',
    '💪 体力レベルを判定中...',
    '🤖 最適メニューを生成中...',
    '✅ 完了！',
  ]

  useEffect(() => { generateMenu() }, [])
  useEffect(() => {
    if (status !== 'loading') return
    const iv = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1200)
    return () => clearInterval(iv)
  }, [status])
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const generateMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const today = new Date().toISOString().slice(0, 10)
      const { data: todayLog } = await supabase
        .from('training_logs').select('*')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1).single()
      if (todayLog?.menu_data && todayLog.menu_name !== '体力テスト') {
        menuRef.current = todayLog.menu_data
        setMenu(todayLog.menu_data)
        setStatus('done')
        return
      }
      const diag = JSON.parse(localStorage.getItem('mt_diag') || '{}')
      const posture = JSON.parse(localStorage.getItem('mt_posture') || '[]')
      let goal = localStorage.getItem('mt_goal') || ''
      if (!goal) {
        const { data: diagLog } = await supabase
          .from('diagnosis_logs').select('goal')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1).single()
        if (diagLog?.goal) goal = diagLog.goal
      }
      let fitness = JSON.parse(localStorage.getItem('mt_fitness') || '{}')
      if (!fitness || Object.keys(fitness).length === 0) {
        const { data: fitnessLog } = await supabase
          .from('fitness_logs').select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1).single()
        if (fitnessLog) {
          fitness = {
            pushup: { value: fitnessLog.pushup_value, rank: { rank: fitnessLog.pushup_rank } },
            situp: { value: fitnessLog.situp_value, rank: { rank: fitnessLog.situp_rank } },
            plank: { value: fitnessLog.plank_value, rank: { rank: fitnessLog.plank_rank } },
          }
        }
      }
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, diag, goal, posture, fitness }),
      })
      const data = await res.json()
      menuRef.current = data
      setMenu(data)
      setStatus('done')
      await supabase.from('diagnosis_logs').insert({
        user_id: user.id, goal, posture, answers: diag,
        user_type: data.userType || '', type_reason: data.typeReason || '',
      })
      await supabase.from('training_logs').insert({
        user_id: user.id, menu_id: data.menuId || null,
        menu_name: data.theme, menu_data: data,
        user_type: data.userType || '', completed: false,
      })
    } catch (e) { console.error(e); setStatus('error') }
  }

  const getAllExercises = (m: any) => [
    ...(m?.exercises?.filter((ex: any) => !ex.isSeparator) || []),
    ...(m?.postureExercises || []),
  ]

  const allExercises = getAllExercises(menu)
  const toggleCheck = (key: string) => setChecked(c => ({ ...c, [key]: !c[key] }))
  const allChecked = allExercises.length > 0 && allExercises.every((_: any, i: number) => checked[i])

  const startTraining = () => {
    initAudio()
    const exercises = getAllExercises(menuRef.current)
    exercisesRef.current = exercises
    const firstUnchecked = exercises.findIndex((_: any, i: number) => !checked[i])
    const startIdx = firstUnchecked >= 0 ? firstUnchecked : 0
    setMode('training')
    setCurrentExIdx(startIdx)
    setCurrentSet(1)
    setPhase('countdown')
    startCountdown(5, startIdx)
  }

  const startCountdown = (sec: number, exIdx: number) => {
    clearInterval(intervalRef.current)
    setTimer(sec)
    let t = sec
    intervalRef.current = setInterval(() => {
      t--; setTimer(t)
      if (t <= 3 && t > 0) playCountdownLast()
      else if (t > 3) playCountdown()
      if (t <= 0) {
        clearInterval(intervalRef.current)
        playStart()
        setPhase('exercise')
        startExerciseTimer(exIdx)
      }
    }, 1000)
  }

  const startExerciseTimer = (exIdx: number) => {
    const ex = exercisesRef.current[exIdx]
    if (!ex) return
    const sec = calcTutSec(ex, menuRef.current?.tutTempo || '')
    setTimer(sec)
    let t = sec
    intervalRef.current = setInterval(() => {
      t--; setTimer(t)
      if (t <= 3 && t > 0) playWarning()
      if (t <= 0) { clearInterval(intervalRef.current); playFinish(); setPhase('rest'); startRestTimer(exIdx) }
    }, 1000)
  }

  const startRestTimer = (exIdx: number) => {
    const restSec = exercisesRef.current[exIdx]?.restSec || 60
    setTimer(restSec)
    let t = restSec
    intervalRef.current = setInterval(() => {
      t--; setTimer(t)
      if (t <= 0) { clearInterval(intervalRef.current); playNextSet(); nextSet(exIdx) }
    }, 1000)
  }

  const nextSet = (exIdx: number) => {
    const totalSets = exercisesRef.current[exIdx]?.sets || 3
    setCurrentSet(s => {
      const next = s + 1
      if (next <= totalSets) { setPhase('exercise'); startExerciseTimer(exIdx); return next }
      const nextIdx = exIdx + 1
      if (nextIdx < exercisesRef.current.length) {
        setCurrentExIdx(nextIdx); setPhase('countdown'); startCountdown(5, nextIdx); return 1
      }
      setPhase('done'); clearInterval(intervalRef.current)
      const nc: Record<string,boolean> = {}
      exercisesRef.current.forEach((_:any,i:number)=>{nc[i]=true})
      setChecked(nc); return s
    })
  }

  const skipRest = () => { clearInterval(intervalRef.current); playNextSet(); nextSet(currentExIdx) }

  const completeTraining = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const exercises = getAllExercises(menuRef.current)
      const m = menuRef.current
      const baseExp = m.level==='上級'?60:m.level==='中級'?40:25
      const totalExp = baseExp + exercises.length * 5
      setExpGained(totalExp)
      const { data: prof } = await supabase.from('users').select('exp,level,streak,best_streak,last_trained').eq('id',user.id).single()
      const currentExp = prof?.exp || 0
      const newExp = currentExp + totalExp
      const oldLv = getLevel(currentExp), newLv = getLevel(newExp)
      if (newLv.lv > oldLv.lv) { setLevelUp(newLv); playLevelUp() } else { playExpGain() }
      const today = new Date().toISOString().slice(0,10)
      const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10)
      let streak = 1
      if (prof?.last_trained===yesterday) streak=(prof?.streak||0)+1
      else if (prof?.last_trained===today) streak=prof?.streak||1
      setNewStreak(streak)
      await supabase.from('users').update({exp:newExp,level:newLv.lv,streak,best_streak:Math.max(streak,prof?.best_streak||0),last_trained:today}).eq('id',user.id)
      await supabase.from('training_logs').update({completed:true}).eq('user_id',user.id).eq('menu_name',m.theme).eq('completed',false)
      const exData = exercises.map((ex:any)=>({user_id:user.id,menu_name:m.theme,exercise_name:ex.name,sets:ex.sets||3,reps:ex.reps||'',duration_sec:ex.durationSec||0,completed:true}))
      if (exData.length>0) await supabase.from('exercise_logs').insert(exData)
      setCompleted(true)
    } catch(e){console.error(e)}
  }

  if (status==='loading') return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',justifyContent:'center',alignItems:'center'}}>
      <div style={{width:'100%',maxWidth:480,padding:'0 24px',textAlign:'center'}}>
        <div style={{fontSize:56,marginBottom:20}}>⚡</div>
        <div style={{fontSize:20,fontWeight:800,color:'#39ff14',marginBottom:8}}>メニューを生成中</div>
        <div style={{fontSize:13,color:'#555',marginBottom:32}}>AIがあなたに最適なメニューを分析しています</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {steps.map((s,i)=>(
            <div key={i} style={{padding:'14px 18px',background:i<=step?'#1e1e26':'transparent',border:'1px solid '+(i===step?'#39ff14':'#2a2a36'),borderRadius:12,fontSize:13,color:i<step?'#39ff14':i===step?'#e8e8e8':'#444',display:'flex',alignItems:'center',gap:10,transition:'all 0.3s'}}>
              <span style={{fontSize:16}}>{i<step?'✅':i===step?'⚡':'○'}</span>{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (status==='error') return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'0 24px'}}>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:800,color:'#ff4455',marginBottom:8}}>生成に失敗しました</div>
        <div style={{fontSize:13,color:'#555',marginBottom:24}}>ネットワークを確認して再試行してください</div>
        <button onClick={generateMenu} style={{padding:'16px 32px',background:'#39ff14',color:'#000',border:'none',borderRadius:14,fontSize:15,fontWeight:800,cursor:'pointer'}}>再試行する</button>
      </div>
    </div>
  )

  if (!menu) return null

  const normalExercises = menu.exercises?.filter((ex:any)=>!ex.isSeparator)||[]
  const postureExercises = menu.postureExercises||[]
  let exerciseIndex = 0

  if (levelUp) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'0 24px'}}>
        <div style={{fontSize:80,marginBottom:16}}>🎉</div>
        <div style={{fontSize:32,fontWeight:800,color:'#ffd60a',marginBottom:8}}>LEVEL UP!</div>
        <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Lv.{levelUp.lv}</div>
        <div style={{fontSize:16,color:'#888',marginBottom:32}}>{levelUp.title} になりました！</div>
        <button onClick={()=>router.push('/dashboard')} style={{padding:'18px 40px',background:'#ffd60a',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer'}}>
          ダッシュボードへ →
        </button>
      </div>
    </div>
  )

  if (completed) return (
    <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'0 24px',maxWidth:400,width:'100%'}}>
        <div style={{fontSize:72,marginBottom:16}}>💪</div>
        <div style={{fontSize:28,fontWeight:800,color:'#39ff14',marginBottom:8}}>トレーニング完了！</div>
        <div style={{display:'inline-block',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.3)',borderRadius:12,padding:'10px 20px',marginBottom:12}}>
          <span style={{fontSize:20,fontWeight:800,color:'#ffd60a'}}>+{expGained} EXP</span>
        </div>
        {newStreak>1&&<div style={{fontSize:14,color:'#ff8c00',fontWeight:700,marginBottom:8}}>🔥 {newStreak}日連続トレーニング！</div>}
        <div style={{fontSize:13,color:'#555',marginBottom:24}}>お疲れ様でした。継続が力です！</div>
  
        {/* シェアカード */}
        <div style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',borderRadius:16,padding:'16px',border:'1px solid rgba(57,255,20,0.2)',marginBottom:16,textAlign:'left'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#39ff14,#00c8ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>💪</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'#e8e8e8'}}>{menu?.userName || 'トレーニー'}</div>
              <div style={{fontSize:10,color:'#555'}}>MyTrainer</div>
            </div>
            <div style={{fontSize:10,color:'#39ff14',fontWeight:700}}>MyTrainer</div>
          </div>
          <div style={{fontSize:14,color:'#39ff14',fontWeight:700,marginBottom:4}}>
            🔥 {menu?.theme} 完了！
          </div>
          <div style={{fontSize:11,color:'#888',marginBottom:10}}>{new Date().toLocaleDateString('ja-JP')} 達成</div>
          <div style={{display:'flex',gap:8}}>
            <div style={{background:'rgba(57,255,20,0.2)',borderRadius:6,padding:'4px 10px',fontSize:11,color:'#39ff14',fontWeight:700}}>+{expGained} EXP</div>
            {newStreak>1&&<div style={{background:'rgba(255,140,0,0.2)',borderRadius:6,padding:'4px 10px',fontSize:11,color:'#ff8c00',fontWeight:700}}>{newStreak}日連続🔥</div>}
          </div>
        </div>
  
        {/* シェアボタン */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <button onClick={async()=>{
            const text = `今日のトレーニング完了！💪\n${menu?.theme}\n+${expGained} EXP獲得${newStreak>1?`\n🔥${newStreak}日連続`:''}\n#MyTrainer #筋トレ`
            if(navigator.share){
              await navigator.share({title:'トレーニング完了！',text})
            } else {
              await navigator.clipboard.writeText(text)
              alert('テキストをコピーしました！')
            }
          }}
            style={{padding:'12px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',border:'none',borderRadius:12,fontSize:13,fontWeight:700,color:'#000',cursor:'pointer'}}>
            📤 シェアする
          </button>
          <button onClick={async()=>{
            const { data:{user} } = await supabase.auth.getUser()
            if(!user) return
            const { data:profile } = await supabase.from('users').select('name').eq('id',user.id).single()
            const content = `🔥 ${menu?.theme} 完了！\n+${expGained} EXP獲得${newStreak>1?` · ${newStreak}日連続🔥`:''}`
            await supabase.from('posts').insert({
              user_id: user.id,
              user_name: profile?.name || 'トレーニー',
              content,
              category: '達成報告',
            })
            alert('広場に投稿しました！')
          }}
            style={{padding:'12px',background:'rgba(204,68,255,0.15)',border:'1px solid rgba(204,68,255,0.4)',borderRadius:12,fontSize:13,fontWeight:700,color:'#cc44ff',cursor:'pointer'}}>
            💬 広場に投稿
          </button>
        </div>
  
        <button onClick={()=>router.push('/dashboard')} style={{width:'100%',padding:'18px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer'}}>
          ダッシュボードへ →
        </button>
      </div>
    </div>
  )

  if (mode==='training') {
    const currentEx = allExercises[currentExIdx]
    const currentTutSec = currentEx?calcTutSec(currentEx,menu?.tutTempo||''):30
    const currentBothSides = isBothSidesReps(currentEx?.reps||'')
    const currentShowTut = shouldShowTut(currentEx?.name||'')

    if (phase==='done') return (
      <div style={{background:'#16161a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center',padding:'0 24px'}}>
          <div style={{fontSize:72,marginBottom:16}}>🏆</div>
          <div style={{fontSize:28,fontWeight:800,color:'#39ff14',marginBottom:8}}>全種目完了！</div>
          <div style={{fontSize:14,color:'#555',marginBottom:32}}>素晴らしい！EXPを獲得しましょう</div>
          <button onClick={completeTraining} style={{width:'100%',padding:'18px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',marginBottom:12}}>
            ✅ EXPを獲得する
          </button>
          <button onClick={()=>setMode('view')} style={{width:'100%',padding:'16px',background:'transparent',color:'#666',border:'1px solid #2a2a36',borderRadius:14,fontSize:14,cursor:'pointer'}}>
            メニューに戻る
          </button>
        </div>
      </div>
    )

    return (
      <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
        <div style={{maxWidth:480,margin:'0 auto',padding:'24px 24px 120px'}}>
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',marginBottom:8}}>
              <span>種目 {currentExIdx+1} / {allExercises.length}</span>
              <span>セット {currentSet} / {currentEx?.sets||3}</span>
            </div>
            <div style={{background:'#2a2a36',borderRadius:8,height:6,overflow:'hidden'}}>
              <div style={{height:'100%',background:'linear-gradient(to right,#39ff14,#00c8ff)',borderRadius:8,transition:'width 0.3s',width:`${((currentExIdx*3+currentSet-1)/(allExercises.length*3))*100}%`}}/>
            </div>
          </div>
          <div style={{background:'#1e1e26',borderRadius:24,padding:'32px 24px',border:'1px solid #2a2a36',marginBottom:16,textAlign:'center'}}>
            {phase==='countdown'&&(
              <>
                <div style={{fontSize:13,color:'#555',marginBottom:12}}>次の種目まで</div>
                <div style={{fontSize:24,fontWeight:800,color:'#39ff14',marginBottom:4}}>{currentEx?.name}</div>
                <div style={{fontSize:14,color:'#888',marginBottom:8}}>{currentEx?.reps}</div>
                {currentShowTut&&menu.tutTempo&&<div style={{fontSize:12,color:'#ffd60a',marginBottom:4}}>⏱ {menu.tutTempo}</div>}
                {currentBothSides&&<div style={{display:'inline-block',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.2)',borderRadius:10,padding:'8px 16px',marginBottom:16,fontSize:12,color:'#ffd60a'}}>右{Math.round(currentTutSec/2)}秒 → 左{Math.round(currentTutSec/2)}秒</div>}
                <div style={{fontSize:96,fontWeight:800,color:timer<=3?'#ff4455':'#ffd60a',lineHeight:1,marginBottom:8,fontVariantNumeric:'tabular-nums'}}>{timer}</div>
                <div style={{fontSize:14,color:'#555'}}>秒後にスタート</div>
              </>
            )}
            {phase==='exercise'&&(
              <>
                <div style={{display:'inline-block',background:'rgba(57,255,20,0.1)',border:'1px solid rgba(57,255,20,0.2)',borderRadius:20,padding:'6px 16px',marginBottom:16,fontSize:12,color:'#39ff14',fontWeight:700}}>
                  SET {currentSet} / {currentEx?.sets||3}
                </div>
                <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>{currentEx?.name}</div>
                <div style={{fontSize:15,color:'#ffd60a',fontWeight:700,marginBottom:4}}>{currentEx?.reps}</div>
                {currentShowTut&&menu.tutTempo&&<div style={{fontSize:12,color:'#ffd60a',marginBottom:4}}>⏱ {menu.tutTempo}</div>}
                {currentBothSides&&<div style={{display:'inline-block',background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.2)',borderRadius:10,padding:'6px 14px',marginBottom:12,fontSize:12,color:'#ffd60a'}}>右{Math.round(currentTutSec/2)}秒 → 左{Math.round(currentTutSec/2)}秒</div>}
                <div style={{fontSize:11,color:'#555',marginBottom:12}}>{currentEx?.muscle}</div>
                <div style={{fontSize:96,fontWeight:800,color:timer<=10?'#ff4455':'#39ff14',lineHeight:1,marginBottom:4,fontVariantNumeric:'tabular-nums'}}>{timer}</div>
                <div style={{fontSize:14,color:'#555'}}>秒</div>
              </>
            )}
            {phase==='rest'&&(
              <>
                <div style={{fontSize:32,marginBottom:8}}>😮‍💨</div>
                <div style={{fontSize:20,fontWeight:800,color:'#555',marginBottom:20}}>休憩中</div>
                <div style={{fontSize:96,fontWeight:800,color:'#00c8ff',lineHeight:1,marginBottom:4,fontVariantNumeric:'tabular-nums'}}>{timer}</div>
                <div style={{fontSize:14,color:'#555',marginBottom:20}}>秒</div>
                <div style={{fontSize:13,color:'#444',marginBottom:20}}>
                  次: {currentSet<(currentEx?.sets||3)?`セット${currentSet+1}`:allExercises[currentExIdx+1]?.name||'完了'}
                </div>
                <button onClick={skipRest} style={{padding:'12px 28px',background:'transparent',color:'#39ff14',border:'1px solid #39ff14',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer'}}>
                  スキップ →
                </button>
              </>
            )}
          </div>
          {currentEx?.why&&(
            <div style={{background:'rgba(0,200,255,0.06)',borderRadius:14,padding:'14px 18px',border:'1px solid rgba(0,200,255,0.15)',marginBottom:16}}>
              <div style={{fontSize:11,color:'#00c8ff',fontWeight:700,marginBottom:4}}>📌 トレーナーのポイント</div>
              <div style={{fontSize:13,lineHeight:1.7,color:'#888'}}>{currentEx.why}</div>
            </div>
          )}

          {/* タイマー中のやり方ボタン */}
          {getExerciseTip(currentEx?.name||'')&&(()=>{
            const tip = getExerciseTip(currentEx?.name||'')!
            return (
              <div style={{marginBottom:16}}>
                <button onClick={()=>setExpandedTip(expandedTip==='timer'?null:'timer')}
                  style={{
                    width:'100%',padding:'12px',
                    background:'rgba(0,200,255,0.08)',
                    border:'1px solid rgba(0,200,255,0.3)',
                    borderRadius:12,color:'#00c8ff',
                    fontSize:13,fontWeight:700,cursor:'pointer',
                  }}>
                  {expandedTip==='timer'?'▲ やり方を閉じる':'📖 やり方を確認する'}
                </button>
                {expandedTip==='timer'&&(
                  <div style={{marginTop:8,padding:'14px 16px',background:'#1e1e26',borderRadius:12,border:'1px solid #2a2a36'}}>
                    <div style={{fontSize:11,color:'#39ff14',fontWeight:700,marginBottom:8}}>やり方</div>
                    {tip.steps.map((s,si)=>(
                      <div key={si} style={{fontSize:12,color:'#888',marginBottom:4,display:'flex',gap:8}}>
                        <span style={{color:'#39ff14',flexShrink:0,fontWeight:700}}>{si+1}.</span>{s}
                      </div>
                    ))}
                    <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,marginTop:10,marginBottom:6}}>⚠️ ポイント</div>
                    {tip.points.map((p,pi)=>(
                      <div key={pi} style={{fontSize:12,color:'#888',marginBottom:4,display:'flex',gap:8}}>
                        <span style={{color:'#ffd60a',flexShrink:0}}>・</span>{p}
                      </div>
                    ))}
                    <a href={tip.youtube} target="_blank" rel="noopener noreferrer"
                      style={{display:'block',marginTop:12,padding:'10px',background:'rgba(255,0,0,0.1)',border:'1px solid rgba(255,0,0,0.3)',borderRadius:10,color:'#ff4455',fontSize:12,fontWeight:700,textAlign:'center',textDecoration:'none'}}>
                      ▶ YouTubeで動画を確認
                    </a>
                  </div>
                )}
              </div>
            )
          })()}
          <button onClick={()=>{clearInterval(intervalRef.current);setMode('view')}}
            style={{width:'100%',padding:'16px',background:'transparent',color:'#444',border:'1px solid #2a2a36',borderRadius:14,fontSize:13,cursor:'pointer'}}>
            中断する（EXPなし）
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'#16161a',minHeight:'100vh',color:'#e8e8e8'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 120px'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #1e1e26',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11,color:'#39ff14',fontWeight:700,letterSpacing:2,marginBottom:2}}>TODAY'S MENU</div>
            <div style={{fontSize:20,fontWeight:800}}>{menu.theme}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
            <span style={{background:'rgba(57,255,20,0.1)',border:'1px solid rgba(57,255,20,0.2)',color:'#39ff14',fontSize:11,padding:'4px 12px',borderRadius:20,fontWeight:700}}>{menu.level}</span>
            {menu.tutGoal&&<span style={{background:'rgba(255,215,10,0.1)',border:'1px solid rgba(255,215,10,0.2)',color:'#ffd60a',fontSize:11,padding:'4px 12px',borderRadius:20,fontWeight:700}}>{menu.tutGoal}</span>}
          </div>
        </div>

        <div style={{padding:'20px 24px 0'}}>
          {menu.whyThisMenu&&(
            <div style={{background:'rgba(204,68,255,0.06)',border:'1px solid rgba(204,68,255,0.15)',borderRadius:16,padding:'16px 18px',marginBottom:20}}>
              <div style={{fontSize:11,color:'#cc44ff',fontWeight:700,marginBottom:6}}>🧠 このメニューを提案した理由</div>
              <div style={{fontSize:13,color:'#888',lineHeight:1.7}}>{menu.whyThisMenu}</div>
            </div>
          )}

          <div style={{marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <div style={{width:3,height:18,background:'#39ff14',borderRadius:2}}/>
              <div style={{fontSize:14,fontWeight:800,color:'#39ff14'}}>トレーニングメニュー</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {normalExercises.map((ex:any,i:number)=>{
                const idx = exerciseIndex++
                const tutSec = calcTutSec(ex,menu?.tutTempo||'')
                const exBothSides = isBothSidesReps(ex.reps||'')
                const exShowTut = shouldShowTut(ex.name)
                const tip = getExerciseTip(ex.name)
                return (
                  <div key={i} onClick={()=>toggleCheck(String(idx))}
                    style={{background:checked[idx]?'rgba(57,255,20,0.04)':'#1e1e26',borderRadius:16,padding:'16px 18px',border:'1px solid '+(checked[idx]?'rgba(57,255,20,0.2)':'#2a2a36'),cursor:'pointer',transition:'all 0.2s',opacity:checked[idx]?0.6:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                      <div style={{display:'flex',gap:12,flex:1}}>
                        <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,marginTop:2,background:checked[idx]?'#39ff14':'#25252f',border:'2px solid '+(checked[idx]?'#39ff14':'#333'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,transition:'all 0.2s'}}>
                          {checked[idx]?'✓':''}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,marginBottom:4,textDecoration:checked[idx]?'line-through':'none',color:checked[idx]?'#555':'#e8e8e8'}}>{i+1}. {ex.name}</div>
                          <div style={{fontSize:12,color:'#555',marginBottom:4}}>{ex.muscle} · 休憩 {ex.restSec}秒</div>
                          <div style={{fontSize:12,color:'#00c8ff',lineHeight:1.5}}>📌 {ex.why}</div>
                          {exShowTut&&menu.tutTempo&&<div style={{fontSize:11,color:'#ffd60a',marginTop:4}}>⏱ {menu.tutTempo}</div>}
                          {tip&&(
                            <button onClick={e=>{e.stopPropagation();setExpandedTip(expandedTip===`n${i}`?null:`n${i}`)}}
                              style={{marginTop:6,padding:'4px 10px',background:'rgba(0,200,255,0.1)',border:'1px solid rgba(0,200,255,0.3)',borderRadius:8,color:'#00c8ff',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                              {expandedTip===`n${i}`?'▲ 閉じる':'📖 やり方'}
                            </button>
                          )}
                          {expandedTip===`n${i}`&&tip&&(
                            <div style={{marginTop:8,padding:'10px 12px',background:'#25252f',borderRadius:10,border:'1px solid #2a2a36'}}>
                              <div style={{fontSize:11,color:'#39ff14',fontWeight:700,marginBottom:6}}>やり方</div>
                              {tip.steps.map((s,si)=>(
                                <div key={si} style={{fontSize:11,color:'#888',marginBottom:3,display:'flex',gap:6}}>
                                  <span style={{color:'#39ff14',flexShrink:0}}>{si+1}.</span>{s}
                                </div>
                              ))}
                              <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,marginTop:8,marginBottom:4}}>⚠️ ポイント</div>
                              {tip.points.map((p,pi)=>(
                                <div key={pi} style={{fontSize:11,color:'#888',marginBottom:3,display:'flex',gap:6}}>
                                  <span style={{color:'#ffd60a',flexShrink:0}}>・</span>{p}
                                </div>
                              ))}
                              <a href={tip.youtube} target="_blank" rel="noopener noreferrer"
                                onClick={e=>e.stopPropagation()}
                                style={{display:'block',marginTop:10,padding:'8px',background:'rgba(255,0,0,0.1)',border:'1px solid rgba(255,0,0,0.3)',borderRadius:8,color:'#ff4455',fontSize:11,fontWeight:700,textAlign:'center',textDecoration:'none'}}>
                                ▶ YouTubeで動画を確認
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:12,color:'#39ff14',fontWeight:700,marginBottom:4}}>{ex.sets}セット</div>
                        <div style={{fontSize:14,fontWeight:800}}>{ex.reps}</div>
                        {exShowTut&&exBothSides&&menu.tutTempo&&parseInt(ex.reps)>0&&<div style={{fontSize:11,color:'#ffd60a',marginTop:2}}>片側{Math.round(tutSec/2)}秒</div>}
                        {exShowTut&&!exBothSides&&menu.tutTempo&&parseInt(ex.reps)>0&&<div style={{fontSize:11,color:'#ffd60a',marginTop:2}}>約{tutSec}秒</div>}
                        {!exShowTut&&exBothSides&&<div style={{fontSize:11,color:'#ffd60a',marginTop:2}}>片側{ex.durationSec||30}秒</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {postureExercises.length>0&&(
            <div style={{marginBottom:8,marginTop:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:3,height:18,background:'#cc44ff',borderRadius:2}}/>
                <div style={{fontSize:14,fontWeight:800,color:'#cc44ff'}}>姿勢改善メニュー</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {postureExercises.map((ex:any,i:number)=>{
                  const idx = exerciseIndex++
                  const exBothSides = isBothSidesReps(ex.reps||'')
                  const tutSec = calcTutSec(ex,menu?.tutTempo||'')
                  const tip = getExerciseTip(ex.name)
                  return (
                    <div key={i} onClick={()=>toggleCheck(String(idx))}
                      style={{background:checked[idx]?'rgba(204,68,255,0.04)':'#1e1e26',borderRadius:16,padding:'16px 18px',border:'1px solid '+(checked[idx]?'rgba(204,68,255,0.2)':'#2a2a36'),cursor:'pointer',transition:'all 0.2s',opacity:checked[idx]?0.6:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                        <div style={{display:'flex',gap:12,flex:1}}>
                          <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,marginTop:2,background:checked[idx]?'#cc44ff':'#25252f',border:'2px solid '+(checked[idx]?'#cc44ff':'#333'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,transition:'all 0.2s'}}>
                            {checked[idx]?'✓':''}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:15,fontWeight:700,marginBottom:4,color:checked[idx]?'#555':'#cc44ff',textDecoration:checked[idx]?'line-through':'none'}}>{i+1}. {ex.name}</div>
                            <div style={{fontSize:12,color:'#555',marginBottom:4}}>{ex.muscle} · 休憩 {ex.restSec}秒</div>
                            <div style={{fontSize:12,color:'#cc44ff',lineHeight:1.5}}>🧍 {ex.why}</div>
                            {tip&&(
                              <button onClick={e=>{e.stopPropagation();setExpandedTip(expandedTip===`p${i}`?null:`p${i}`)}}
                                style={{marginTop:6,padding:'4px 10px',background:'rgba(204,68,255,0.1)',border:'1px solid rgba(204,68,255,0.3)',borderRadius:8,color:'#cc44ff',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                                {expandedTip===`p${i}`?'▲ 閉じる':'📖 やり方'}
                              </button>
                            )}
                            {expandedTip===`p${i}`&&tip&&(
                              <div style={{marginTop:8,padding:'10px 12px',background:'#25252f',borderRadius:10,border:'1px solid #2a2a36'}}>
                                <div style={{fontSize:11,color:'#cc44ff',fontWeight:700,marginBottom:6}}>やり方</div>
                                {tip.steps.map((s,si)=>(
                                  <div key={si} style={{fontSize:11,color:'#888',marginBottom:3,display:'flex',gap:6}}>
                                    <span style={{color:'#cc44ff',flexShrink:0}}>{si+1}.</span>{s}
                                  </div>
                                ))}
                                <div style={{fontSize:11,color:'#ffd60a',fontWeight:700,marginTop:8,marginBottom:4}}>⚠️ ポイント</div>
                                {tip.points.map((p,pi)=>(
                                  <div key={pi} style={{fontSize:11,color:'#888',marginBottom:3,display:'flex',gap:6}}>
                                    <span style={{color:'#ffd60a',flexShrink:0}}>・</span>{p}
                                  </div>
                                ))}
                                <a href={tip.youtube} target="_blank" rel="noopener noreferrer"
                                  onClick={e=>e.stopPropagation()}
                                  style={{display:'block',marginTop:10,padding:'8px',background:'rgba(255,0,0,0.1)',border:'1px solid rgba(255,0,0,0.3)',borderRadius:8,color:'#ff4455',fontSize:11,fontWeight:700,textAlign:'center',textDecoration:'none'}}>
                                  ▶ YouTubeで動画を確認
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:12,color:'#cc44ff',fontWeight:700,marginBottom:4}}>{ex.sets}セット</div>
                          <div style={{fontSize:14,fontWeight:800}}>{ex.reps}</div>
                          {!shouldShowTut(ex.name)&&exBothSides&&<div style={{fontSize:11,color:'#ffd60a',marginTop:2}}>片側{ex.durationSec||30}秒</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {menu.closingTip&&(
            <div style={{background:'rgba(57,255,20,0.06)',borderRadius:14,padding:'16px 18px',marginTop:20,border:'1px solid rgba(57,255,20,0.15)'}}>
              <div style={{fontSize:11,color:'#39ff14',fontWeight:700,marginBottom:6}}>💡 トレーニング後のアドバイス</div>
              <div style={{fontSize:13,lineHeight:1.7,color:'#888'}}>{menu.closingTip}</div>
            </div>
          )}

          <div style={{marginTop:24}}>
            <button onClick={startTraining}
              style={{width:'100%',padding:'20px',background:'linear-gradient(135deg,#39ff14,#00c8ff)',color:'#000',border:'none',borderRadius:18,fontSize:17,fontWeight:800,cursor:'pointer',marginBottom:12,boxShadow:'0 4px 20px rgba(57,255,20,0.2)'}}>
              ▶ トレーニング開始
            </button>
            <div style={{background:'#1e1e26',borderRadius:16,padding:'16px 18px',marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#555',marginBottom:8}}>
                <span>進捗</span>
                <span>{Object.values(checked).filter(Boolean).length} / {allExercises.length} 完了</span>
              </div>
              <div style={{background:'#2a2a36',borderRadius:6,height:6,overflow:'hidden',marginBottom:12}}>
                <div style={{height:'100%',width:`${allExercises.length>0?(Object.values(checked).filter(Boolean).length/allExercises.length)*100:0}%`,background:'#39ff14',transition:'width 0.3s'}}/>
              </div>
              <button onClick={completeTraining} disabled={!allChecked}
                style={{width:'100%',padding:'14px',background:allChecked?'rgba(57,255,20,0.1)':'transparent',color:allChecked?'#39ff14':'#333',border:'1px solid '+(allChecked?'rgba(57,255,20,0.3)':'#2a2a36'),borderRadius:12,fontSize:14,fontWeight:700,cursor:allChecked?'pointer':'not-allowed',transition:'all 0.2s'}}>
                {allChecked?'✅ 手動完了・EXP獲得':'全種目チェックで完了'}
              </button>
            </div>
            <button onClick={()=>router.push('/dashboard')}
              style={{width:'100%',padding:'16px',background:'transparent',color:'#555',border:'1px solid #2a2a36',borderRadius:14,fontSize:13,cursor:'pointer',marginBottom:10}}>
              後でやる → ダッシュボード
            </button>
            
          </div>
        </div>
      </div>
    </div>
  )
}