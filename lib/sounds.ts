// Web Audio APIを使った音声生成
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

function beep(freq: number, duration: number, volume: number = 0.3, type: OscillatorType = 'sine') {
  try {
    const ctx = getCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration / 1000)
  } catch (e) {}
}

// カウントダウン音（ピッ）
export function playCountdown() {
  beep(440, 150, 0.3)
}

// 最後のカウントダウン音（ピッ・高め）
export function playCountdownLast() {
  beep(660, 200, 0.4)
}

// スタート音（ドーン）
export function playStart() {
  beep(880, 400, 0.4, 'square')
  setTimeout(() => beep(1100, 300, 0.3, 'square'), 150)
}

// 終了音（ブザー）
export function playFinish() {
  beep(440, 200, 0.4)
  setTimeout(() => beep(330, 200, 0.4), 200)
  setTimeout(() => beep(220, 400, 0.4), 400)
}

// 休憩終了・次の種目（ポン）
export function playNextSet() {
  beep(660, 150, 0.3)
  setTimeout(() => beep(880, 200, 0.3), 150)
}

// レベルアップ（ファンファーレ）
export function playLevelUp() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => beep(freq, 300, 0.4, 'square'), i * 150)
  })
}

// EXP獲得（チャリン）
export function playExpGain() {
  beep(880, 100, 0.2)
  setTimeout(() => beep(1100, 150, 0.2), 100)
}

// 残り3秒警告音
export function playWarning() {
  beep(550, 100, 0.35, 'square')
}

// AudioContextを起動（ユーザーのタップ後に呼ぶ）
export function initAudio() {
  getCtx()
}