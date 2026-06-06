'use client'

export function TemplatePreview({ layoutType, bgFrom, bgTo }: {
  layoutType: string
  bgFrom: string
  bgTo: string
}) {
  const gradId = `grad-${layoutType}`

  const defs = (
    <defs>
      <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={bgFrom} />
        <stop offset="100%" stopColor={bgTo} />
      </linearGradient>
    </defs>
  )

  const bg = <rect width="160" height="120" fill={`url(#${gradId})`} />

  const renderContent = () => {
    switch (layoutType) {
      case 'photo-overlay':
        return (
          <>
            <rect x="0" y="0" width="160" height="82" fill="rgba(0,0,0,0.25)" rx="0" />
            <rect x="0" y="82" width="160" height="38" fill="rgba(0,0,0,0.7)" />
            <rect x="12" y="91" width="90" height="6" rx="3" fill="rgba(255,255,255,0.9)" />
            <rect x="12" y="102" width="60" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
          </>
        )

      case 'color-text':
        return (
          <>
            <rect x="20" y="30" width="120" height="14" rx="7" fill="rgba(255,255,255,0.9)" />
            <rect x="36" y="52" width="88" height="8" rx="4" fill="rgba(255,255,255,0.6)" />
            <rect x="52" y="68" width="56" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
          </>
        )

      case 'grid-2x2':
        return (
          <>
            <rect x="4" y="4" width="73" height="54" rx="4" fill="rgba(255,255,255,0.3)" />
            <rect x="83" y="4" width="73" height="54" rx="4" fill="rgba(255,255,255,0.3)" />
            <rect x="4" y="63" width="73" height="53" rx="4" fill="rgba(255,255,255,0.3)" />
            <rect x="83" y="63" width="73" height="53" rx="4" fill="rgba(255,255,255,0.3)" />
          </>
        )

      case 'story-vertical':
        return (
          <>
            <rect x="20" y="10" width="120" height="40" rx="6" fill="rgba(255,255,255,0.3)" />
            <rect x="20" y="56" width="120" height="8" rx="4" fill="rgba(255,255,255,0.8)" />
            <rect x="20" y="70" width="80" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
            <rect x="20" y="82" width="100" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
            <rect x="40" y="96" width="80" height="16" rx="8" fill="rgba(255,255,255,0.8)" />
          </>
        )

      case 'number-big':
        return (
          <>
            <text x="80" y="72" textAnchor="middle" fontSize="52" fontWeight="bold" fill="rgba(255,255,255,0.9)" fontFamily="sans-serif">%</text>
            <rect x="30" y="90" width="100" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
          </>
        )

      case 'banner-limit':
        return (
          <>
            <circle cx="26" cy="22" r="14" fill="rgba(255,255,255,0.3)" />
            <text x="26" y="27" textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.9)" fontFamily="sans-serif">⏰</text>
            <rect x="48" y="16" width="100" height="5" rx="2.5" fill="rgba(255,255,255,0.7)" />
            <rect x="48" y="25" width="70" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
            <rect x="10" y="44" width="140" height="1" fill="rgba(255,255,255,0.3)" />
            <rect x="10" y="52" width="140" height="8" rx="4" fill="rgba(255,255,255,0.8)" />
            <rect x="10" y="66" width="110" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
          </>
        )

      case 'stamp':
        return (
          <>
            <circle cx="80" cy="58" r="44" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="4" strokeDasharray="8 4" />
            <circle cx="80" cy="58" r="36" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <rect x="44" y="50" width="72" height="10" rx="5" fill="rgba(255,255,255,0.9)" />
            <rect x="54" y="65" width="52" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
          </>
        )

      case 'product-card':
        return (
          <>
            <rect x="0" y="0" width="160" height="78" fill="rgba(0,0,0,0.15)" />
            <rect x="0" y="78" width="160" height="42" fill="rgba(255,255,255,0.95)" />
            <rect x="10" y="86" width="90" height="7" rx="3.5" fill="rgba(0,0,0,0.7)" />
            <rect x="10" y="99" width="55" height="6" rx="3" fill="rgba(0,0,0,0.4)" />
            <rect x="120" y="96" width="30" height="8" rx="4" fill="rgba(230,0,35,0.8)" />
          </>
        )

      case 'menu-list':
        return (
          <>
            {[0, 1, 2].map(i => (
              <g key={i} transform={`translate(0, ${i * 34})`}>
                <rect x="8" y="8" width="28" height="24" rx="4" fill="rgba(255,255,255,0.3)" />
                <rect x="44" y="12" width="80" height="6" rx="3" fill="rgba(255,255,255,0.8)" />
                <rect x="44" y="22" width="55" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
                <rect x="8" y="35" width="144" height="1" fill="rgba(255,255,255,0.2)" />
              </g>
            ))}
          </>
        )

      case 'before-after':
        return (
          <>
            <rect x="0" y="0" width="79" height="120" fill="rgba(0,0,0,0.2)" />
            <rect x="81" y="0" width="79" height="120" fill="rgba(255,255,255,0.2)" />
            <rect x="2" y="4" width="36" height="6" rx="3" fill="rgba(255,255,255,0.7)" />
            <rect x="82" y="4" width="36" height="6" rx="3" fill="rgba(255,255,255,0.7)" />
            <rect x="76" y="0" width="8" height="120" fill="rgba(255,255,255,0.9)" />
            <text x="80" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill={bgFrom} fontFamily="sans-serif">→</text>
          </>
        )

      case 'calendar':
        return (
          <>
            <rect x="8" y="8" width="144" height="18" rx="4" fill="rgba(255,255,255,0.4)" />
            <rect x="14" y="12" width="50" height="8" rx="4" fill="rgba(255,255,255,0.8)" />
            {Array.from({ length: 5 }).map((_, row) =>
              Array.from({ length: 7 }).map((_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={8 + col * 21}
                  y={30 + row * 18}
                  width="17"
                  height="14"
                  rx="2"
                  fill="rgba(255,255,255,0.25)"
                />
              ))
            )}
          </>
        )

      case 'event-banner':
        return (
          <>
            <rect x="0" y="0" width="160" height="26" fill="rgba(0,0,0,0.4)" />
            <rect x="10" y="8" width="80" height="8" rx="4" fill="rgba(255,255,255,0.8)" />
            <rect x="0" y="26" width="160" height="68" fill="rgba(255,255,255,0.15)" />
            <rect x="10" y="38" width="140" height="10" rx="5" fill="rgba(255,255,255,0.8)" />
            <rect x="10" y="54" width="100" height="7" rx="3.5" fill="rgba(255,255,255,0.5)" />
            <rect x="10" y="67" width="80" height="7" rx="3.5" fill="rgba(255,255,255,0.5)" />
            <rect x="0" y="94" width="160" height="26" fill="rgba(0,0,0,0.4)" />
            <rect x="40" y="101" width="80" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
          </>
        )

      case 'steps-3':
        return (
          <>
            {[0, 1, 2].map(i => (
              <g key={i}>
                <circle cx={28 + i * 52} cy="52" r="20" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                <text x={28 + i * 52} y="57" textAnchor="middle" fontSize="14" fontWeight="bold" fill="rgba(255,255,255,0.9)" fontFamily="sans-serif">{i + 1}</text>
                <rect x={12 + i * 52} y="78" width="32" height="5" rx="2.5" fill="rgba(255,255,255,0.6)" />
                {i < 2 && <text x={52 + i * 52} y="56" textAnchor="middle" fontSize="16" fill="rgba(255,255,255,0.7)" fontFamily="sans-serif">→</text>}
              </g>
            ))}
          </>
        )

      case 'qr-code':
        return (
          <>
            <rect x="44" y="14" width="72" height="72" rx="6" fill="rgba(255,255,255,0.95)" />
            {/* QRパターン */}
            <rect x="50" y="20" width="18" height="18" rx="2" fill={bgFrom} />
            <rect x="52" y="22" width="14" height="14" rx="1" fill="white" />
            <rect x="54" y="24" width="10" height="10" rx="1" fill={bgFrom} />
            <rect x="92" y="20" width="18" height="18" rx="2" fill={bgFrom} />
            <rect x="94" y="22" width="14" height="14" rx="1" fill="white" />
            <rect x="96" y="24" width="10" height="10" rx="1" fill={bgFrom} />
            <rect x="50" y="62" width="18" height="18" rx="2" fill={bgFrom} />
            <rect x="52" y="64" width="14" height="14" rx="1" fill="white" />
            <rect x="54" y="66" width="10" height="10" rx="1" fill={bgFrom} />
            {/* 中心ドット */}
            {[72, 78, 84].map(x => [40, 46, 52, 58].map(y => (
              <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill={bgFrom} opacity="0.6" />
            )))}
            <rect x="44" y="93" width="72" height="6" rx="3" fill="rgba(255,255,255,0.7)" />
          </>
        )

      case 'quote-card':
        return (
          <>
            <text x="18" y="38" fontSize="36" fontWeight="bold" fill="rgba(255,255,255,0.3)" fontFamily="serif">&ldquo;</text>
            <rect x="18" y="42" width="124" height="7" rx="3.5" fill="rgba(255,255,255,0.8)" />
            <rect x="18" y="54" width="95" height="7" rx="3.5" fill="rgba(255,255,255,0.6)" />
            <rect x="18" y="68" width="110" height="7" rx="3.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="26" cy="96" r="12" fill="rgba(255,255,255,0.4)" />
            <rect x="46" y="90" width="60" height="6" rx="3" fill="rgba(255,255,255,0.7)" />
            <rect x="46" y="100" width="40" height="5" rx="2.5" fill="rgba(255,255,255,0.4)" />
          </>
        )

      case 'person-info':
        return (
          <>
            <circle cx="80" cy="44" r="32" fill="rgba(255,255,255,0.3)" />
            <circle cx="80" cy="38" r="14" fill="rgba(255,255,255,0.5)" />
            <ellipse cx="80" cy="62" rx="20" ry="10" fill="rgba(255,255,255,0.3)" />
            <rect x="24" y="82" width="112" height="8" rx="4" fill="rgba(255,255,255,0.8)" />
            <rect x="36" y="95" width="88" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
            <rect x="48" y="107" width="64" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
          </>
        )

      case 'info-list':
        return (
          <>
            {[0, 1, 2].map(i => (
              <g key={i} transform={`translate(0, ${i * 36})`}>
                <circle cx="24" cy="22" r="14" fill="rgba(255,255,255,0.4)" />
                <rect x="46" y="14" width="100" height="7" rx="3.5" fill="rgba(255,255,255,0.8)" />
                <rect x="46" y="25" width="70" height="5" rx="2.5" fill="rgba(255,255,255,0.5)" />
              </g>
            ))}
          </>
        )

      case 'shop-hero':
        return (
          <>
            <circle cx="80" cy="52" r="34" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <circle cx="80" cy="52" r="24" fill="rgba(255,255,255,0.2)" />
            <rect x="60" y="46" width="40" height="8" rx="4" fill="rgba(255,255,255,0.9)" />
            <rect x="24" y="92" width="112" height="7" rx="3.5" fill="rgba(255,255,255,0.7)" />
            <rect x="44" y="104" width="72" height="5" rx="2.5" fill="rgba(255,255,255,0.4)" />
          </>
        )

      case 'hero-wide':
        return (
          <>
            <rect x="0" y="0" width="96" height="120" fill="rgba(0,0,0,0.1)" />
            <rect x="96" y="0" width="64" height="120" fill="rgba(255,255,255,0.2)" />
            <rect x="10" y="24" width="76" height="12" rx="6" fill="rgba(255,255,255,0.9)" />
            <rect x="10" y="42" width="60" height="8" rx="4" fill="rgba(255,255,255,0.6)" />
            <rect x="10" y="56" width="50" height="8" rx="4" fill="rgba(255,255,255,0.6)" />
            <rect x="10" y="78" width="54" height="18" rx="9" fill="rgba(255,255,255,0.8)" />
          </>
        )

      case 'lp-stack':
        return (
          <>
            <rect x="0" y="0" width="160" height="36" fill="rgba(255,255,255,0.3)" />
            <rect x="10" y="12" width="100" height="8" rx="4" fill="rgba(255,255,255,0.8)" />
            <rect x="0" y="42" width="160" height="36" fill="rgba(255,255,255,0.15)" />
            <rect x="10" y="54" width="80" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
            <rect x="0" y="84" width="160" height="36" fill="rgba(255,255,255,0.25)" />
            <rect x="10" y="96" width="90" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
          </>
        )

      case 'pop-border':
        return (
          <>
            <rect x="4" y="4" width="152" height="112" rx="8" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="4" />
            <rect x="10" y="10" width="140" height="100" rx="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="6 3" />
            <rect x="24" y="38" width="112" height="12" rx="6" fill="rgba(255,255,255,0.9)" />
            <rect x="36" y="56" width="88" height="8" rx="4" fill="rgba(255,255,255,0.6)" />
            <rect x="48" y="70" width="64" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
          </>
        )

      case 'youtube-thumb':
        return (
          <>
            <rect x="0" y="0" width="60" height="120" fill="rgba(0,0,0,0.3)" />
            <ellipse cx="30" cy="52" rx="20" ry="28" fill="rgba(255,255,255,0.2)" />
            <rect x="68" y="18" width="84" height="12" rx="6" fill="rgba(255,255,255,0.9)" />
            <rect x="68" y="36" width="65" height="9" rx="4.5" fill="rgba(255,255,255,0.7)" />
            <rect x="68" y="52" width="74" height="9" rx="4.5" fill="rgba(255,255,255,0.7)" />
            <rect x="68" y="78" width="40" height="16" rx="8" fill="rgba(230,0,35,0.9)" />
            <text x="88" y="90" textAnchor="middle" fontSize="10" fill="white" fontFamily="sans-serif">▶</text>
          </>
        )

      case 'natural':
        return (
          <>
            <path d="M0 80 Q40 60 80 75 Q120 90 160 70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
            <path d="M0 95 Q40 75 80 90 Q120 105 160 85" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <circle cx="34" cy="42" r="18" fill="rgba(255,255,255,0.3)" />
            <circle cx="80" cy="32" r="14" fill="rgba(255,255,255,0.25)" />
            <circle cx="126" cy="44" r="16" fill="rgba(255,255,255,0.3)" />
            <rect x="20" y="100" width="120" height="7" rx="3.5" fill="rgba(255,255,255,0.7)" />
          </>
        )

      default:
        return (
          <>
            <rect x="20" y="20" width="120" height="80" rx="8" fill="rgba(255,255,255,0.3)" />
            <rect x="36" y="48" width="88" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
            <rect x="48" y="62" width="64" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
          </>
        )
    }
  }

  return (
    <svg
      viewBox="0 0 160 120"
      width="160"
      height="120"
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-t-xl w-full h-auto"
    >
      {defs}
      {bg}
      {renderContent()}
    </svg>
  )
}
