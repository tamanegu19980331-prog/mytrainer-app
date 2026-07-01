'use client'

interface AvatarProps {
  level: number
  gender: 'male' | 'female'
  skin: 'light' | 'medium' | 'dark' | 'deep'
  bmi?: number
  size?: number
}

const SKIN_COLORS: Record<string, { base: string; shadow: string; cheek: string }> = {
  light:  { base: '#f5d5b0', shadow: '#d4a574', cheek: '#ffb3ba' },
  medium: { base: '#c8a882', shadow: '#a07850', cheek: '#e8948a' },
  dark:   { base: '#8d6340', shadow: '#6b4828', cheek: '#c07060' },
  deep:   { base: '#5c3d2e', shadow: '#3d2518', cheek: '#8a4840' },
}

function getOutfitColors(level: number) {
  if (level >= 7) return { body: '#44337a', accent: '#ffd60a', leg: '#322659', shoe: '#ffd60a', cape: '#553c9a' }
  if (level >= 5) return { body: '#7b341e', accent: '#ff8c00', leg: '#652b19', shoe: '#ff8c00', cape: null }
  if (level >= 3) return { body: '#276749', accent: '#39ff14', leg: '#1c4532', shoe: '#39ff14', cape: null }
  return { body: '#4a5568', accent: '#718096', leg: '#2d3748', shoe: '#2d3748', cape: null }
}

function getBodyShape(bmi?: number) {
  if (!bmi) return 'normal'
  if (bmi < 18.5) return 'slim'
  if (bmi > 25) return 'chubby'
  return 'normal'
}

export default function Avatar({ level, gender, skin, bmi, size = 160 }: AvatarProps) {
  const skinColor = SKIN_COLORS[skin] || SKIN_COLORS.light
  const outfit = getOutfitColors(level)
  const bodyShape = getBodyShape(bmi)
  const isFemale = gender === 'female'

  const bodyWidth = bodyShape === 'chubby' ? 52 : bodyShape === 'slim' ? 38 : isFemale ? 42 : 46
  const bodyX = 80 - bodyWidth / 2
  const headRx = bodyShape === 'chubby' ? 36 : bodyShape === 'slim' ? 30 : isFemale ? 33 : 34
  const headRy = isFemale ? headRx + 4 : headRx + 2
  const headCy = level >= 7 ? 74 : 68

  const hairColorMale = skin === 'light' ? '#2d1a0e' : skin === 'medium' ? '#1a1a2e' : '#0d0d0d'
  const hairColorFemale = skin === 'light' ? '#8b4513' : skin === 'medium' ? '#c8860a' : skin === 'dark' ? '#3d1a00' : '#0d0d0d'
  const hairColor = isFemale ? hairColorFemale : hairColorMale

  const eyeCy = headCy + 2
  const noseCy = headCy + 12
  const mouthCy = headCy + 22

  return (
    <svg width={size} height={size} viewBox="0 0 160 200" style={{ display: 'block' }}>

      {/* マント (Lv7-8) */}
      {outfit.cape && (
        <>
          <rect x="10" y="108" width="18" height="72" rx="8" fill={outfit.cape} opacity="0.9"/>
          <rect x="132" y="108" width="18" height="72" rx="8" fill={outfit.cape} opacity="0.9"/>
        </>
      )}

      {/* 王冠 (Lv7-8) */}
      {level >= 7 && (
        <polygon points="80,6 88,20 104,14 96,28 112,25 104,40 56,40 48,25 64,28 56,14 72,20" fill="#ffd60a"/>
      )}

      {/* オーラ */}
      {level >= 5 && (
        <ellipse cx="80" cy="120" rx="65" ry="80" fill={outfit.accent} opacity="0.06"/>
      )}

      {/* 女性: スカート風ライン */}
      {isFemale && (
        <ellipse cx="80" cy={headCy + headRy - 4} rx={headRx + 10} ry="10" fill={hairColor} opacity="0.6"/>
      )}

      {/* 頭 */}
      <ellipse cx="80" cy={headCy} rx={headRx} ry={headRy} fill={skinColor.base}/>

      {/* 髪 */}
      {isFemale ? (
        <>
          {/* 前髪・トップ */}
          <ellipse cx="80" cy={headCy - headRy + 10} rx={headRx} ry="16" fill={hairColor}/>
          {/* サイド(長い) */}
          <rect x={80 - headRx - 6} y={headCy - 10} width="14" height={headRy + 30} rx="7" fill={hairColor}/>
          <rect x={80 + headRx - 8} y={headCy - 10} width="14" height={headRy + 30} rx="7" fill={hairColor}/>
          {/* ポニーテール風 */}
          <ellipse cx="80" cy={headCy + headRy + 10} rx={headRx - 4} ry="12" fill={hairColor}/>
          {/* お団子 */}
          <circle cx={80 + headRx - 4} cy={headCy - headRy + 4} r="10" fill={hairColor}/>
        </>
      ) : (
        <>
          <ellipse cx="80" cy={headCy - headRy + 8} rx={headRx} ry="14" fill={hairColor}/>
          <rect x={80 - headRx - 2} y={headCy - headRy + 4} width="10" height="20" rx="5" fill={hairColor}/>
          <rect x={80 + headRx - 8} y={headCy - headRy + 4} width="10" height="20" rx="5" fill={hairColor}/>
        </>
      )}

      {/* 目 */}
      <ellipse cx="66" cy={eyeCy} rx={isFemale ? 10 : 9} ry={isFemale ? 11 : 10} fill="white"/>
      <ellipse cx="94" cy={eyeCy} rx={isFemale ? 10 : 9} ry={isFemale ? 11 : 10} fill="white"/>

      {/* 瞳 */}
      {level >= 7 ? (
        <>
          <ellipse cx="66" cy={eyeCy + 1} rx="7" ry="8" fill="#ffd60a"/>
          <ellipse cx="94" cy={eyeCy + 1} rx="7" ry="8" fill="#ffd60a"/>
          <ellipse cx="66" cy={eyeCy} rx="4" ry="5" fill="#1a1a2e"/>
          <ellipse cx="94" cy={eyeCy} rx="4" ry="5" fill="#1a1a2e"/>
        </>
      ) : (
        <>
          <ellipse cx="66" cy={eyeCy + 1} rx="7" ry="8" fill={isFemale ? '#9b59b6' : '#2d5be3'}/>
          <ellipse cx="94" cy={eyeCy + 1} rx="7" ry="8" fill={isFemale ? '#9b59b6' : '#2d5be3'}/>
          <ellipse cx="66" cy={eyeCy} rx="4" ry="5" fill="#1a1a2e"/>
          <ellipse cx="94" cy={eyeCy} rx="4" ry="5" fill="#1a1a2e"/>
        </>
      )}
      <circle cx="68" cy={eyeCy - 2} r="2.5" fill="white"/>
      <circle cx="96" cy={eyeCy - 2} r="2.5" fill="white"/>

      {/* まつ毛 (女性) */}
      {isFemale && (
        <>
          <line x1="58" y1={eyeCy - 9} x2="54" y2={eyeCy - 14} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="63" y1={eyeCy - 11} x2="61" y2={eyeCy - 16} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="68" y1={eyeCy - 11} x2="68" y2={eyeCy - 16} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="74" y1={eyeCy - 9} x2="76" y2={eyeCy - 14} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="86" y1={eyeCy - 9} x2="84" y2={eyeCy - 14} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="91" y1={eyeCy - 11} x2="89" y2={eyeCy - 16} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="96" y1={eyeCy - 11} x2="96" y2={eyeCy - 16} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="102" y1={eyeCy - 9} x2="106" y2={eyeCy - 14} stroke={hairColor} strokeWidth="1.5" strokeLinecap="round"/>
        </>
      )}

      {/* 眉毛 */}
      {isFemale ? (
        <>
          <path d={`M${58} ${eyeCy - 14} Q${66} ${eyeCy - 18} ${74} ${eyeCy - 14}`}
            fill="none" stroke={hairColor} strokeWidth="2" strokeLinecap="round"/>
          <path d={`M${86} ${eyeCy - 14} Q${94} ${eyeCy - 18} ${102} ${eyeCy - 14}`}
            fill="none" stroke={hairColor} strokeWidth="2" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <path d={`M${60} ${eyeCy - 12} Q${68} ${eyeCy - 16} ${76} ${eyeCy - 12}`}
            fill="none" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round"/>
          <path d={`M${84} ${eyeCy - 12} Q${92} ${eyeCy - 16} ${100} ${eyeCy - 12}`}
            fill="none" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round"/>
        </>
      )}

      {/* 鼻 */}
      <ellipse cx="80" cy={noseCy} rx={isFemale ? 3 : 4} ry="3" fill={skinColor.shadow}/>

      {/* 口 */}
      {isFemale ? (
        <>
          <path d={`M${72} ${mouthCy} Q${80} ${mouthCy + 6} ${88} ${mouthCy}`}
            fill="none" stroke="#e88080" strokeWidth="2" strokeLinecap="round"/>
          <ellipse cx="80" cy={mouthCy + 3} rx="6" ry="3" fill="#ffaaaa" opacity="0.4"/>
        </>
      ) : level >= 5 ? (
        <path d={`M${68} ${mouthCy} Q${80} ${mouthCy + 8} ${92} ${mouthCy}`}
          fill="none" stroke={skinColor.shadow} strokeWidth="2.5" strokeLinecap="round"/>
      ) : (
        <path d={`M${70} ${mouthCy} Q${80} ${mouthCy + 6} ${90} ${mouthCy}`}
          fill="none" stroke={skinColor.shadow} strokeWidth="2" strokeLinecap="round"/>
      )}

      {/* ほっぺ */}
      <ellipse cx="52" cy={noseCy + 2} rx={isFemale ? 12 : 10} ry={isFemale ? 8 : 7} fill={skinColor.cheek} opacity={isFemale ? 0.6 : 0.5}/>
      <ellipse cx="108" cy={noseCy + 2} rx={isFemale ? 12 : 10} ry={isFemale ? 8 : 7} fill={skinColor.cheek} opacity={isFemale ? 0.6 : 0.5}/>

      {/* 体 */}
      {isFemale ? (
        <>
          {/* 上半身 */}
          <rect x={bodyX} y={headCy + headRy - 2} width={bodyWidth} height="36" rx="10" fill={outfit.body}/>
          <rect x={bodyX + 4} y={headCy + headRy - 2} width={bodyWidth - 8} height="10" rx="5" fill={outfit.accent}/>
          {/* スカート風 */}
          <ellipse cx="80" cy={headCy + headRy + 40} rx={bodyWidth / 2 + 10} ry="20" fill={outfit.body}/>
          <rect x={bodyX - 8} y={headCy + headRy + 24} width={bodyWidth + 16} height="24" rx="6" fill={outfit.body}/>
        </>
      ) : (
        <>
          <rect x={bodyX} y={headCy + headRy - 2} width={bodyWidth} height="52" rx="12" fill={outfit.body}/>
          <rect x={bodyX + 6} y={headCy + headRy - 2} width={bodyWidth - 12} height="12" rx="6" fill={outfit.accent}/>
          {level >= 3 && (
            <rect x={bodyX + 10} y={headCy + headRy + 10} width={bodyWidth - 20} height="28" rx="4" fill={outfit.accent} opacity="0.2"/>
          )}
        </>
      )}

      {/* 腕 */}
      <rect x={bodyX - 18} y={headCy + headRy} width={isFemale ? 16 : 18} height={isFemale ? 38 : 44} rx="8" fill={outfit.body}/>
      <rect x={bodyX + bodyWidth + 2} y={headCy + headRy} width={isFemale ? 16 : 18} height={isFemale ? 38 : 44} rx="8" fill={outfit.body}/>

      {/* 手 */}
      <ellipse cx={bodyX - 10} cy={headCy + headRy + (isFemale ? 42 : 48)} rx="9" ry="7" fill={level >= 5 ? outfit.accent : skinColor.base}/>
      <ellipse cx={bodyX + bodyWidth + 10} cy={headCy + headRy + (isFemale ? 42 : 48)} rx="9" ry="7" fill={level >= 5 ? outfit.accent : skinColor.base}/>

      {/* 足 */}
      {isFemale ? (
        <>
          <rect x={bodyX + 2} y={headCy + headRy + 52} width={bodyWidth / 2 - 4} height="30" rx="7" fill={outfit.leg}/>
          <rect x={bodyX + bodyWidth / 2 + 2} y={headCy + headRy + 52} width={bodyWidth / 2 - 4} height="30" rx="7" fill={outfit.leg}/>
        </>
      ) : (
        <>
          <rect x={bodyX + 2} y={headCy + headRy + 50} width={bodyWidth / 2 - 4} height="34" rx="8" fill={outfit.leg}/>
          <rect x={bodyX + bodyWidth / 2 + 2} y={headCy + headRy + 50} width={bodyWidth / 2 - 4} height="34" rx="8" fill={outfit.leg}/>
        </>
      )}

      {/* 靴 */}
      <ellipse cx={bodyX + bodyWidth / 4} cy={headCy + headRy + (isFemale ? 84 : 88)} rx="16" ry="7" fill={outfit.shoe}/>
      <ellipse cx={bodyX + bodyWidth * 3 / 4} cy={headCy + headRy + (isFemale ? 84 : 88)} rx="16" ry="7" fill={outfit.shoe}/>

      {/* 女性: ヒール風 */}
      {isFemale && (
        <>
          <rect x={bodyX + bodyWidth / 4 + 8} cy={headCy + headRy + 84} width="4" height="8" rx="2" fill={outfit.shoe} y={headCy + headRy + 84}/>
          <rect x={bodyX + bodyWidth * 3 / 4 + 8} cy={headCy + headRy + 84} width="4" height="8" rx="2" fill={outfit.shoe} y={headCy + headRy + 84}/>
        </>
      )}

    </svg>
  )
}