'use client'

import { useEffect, useRef, useCallback } from 'react'

interface DesignCanvasProps {
  layoutType: string
  bgFrom: string
  bgTo: string
  textContent: string
  templateName: string
  imageSize: string
  companyName?: string
  materialFile?: File | null
  onGenerated?: (dataUrl: string) => void
}

function parseSize(imageSize: string): { width: number; height: number } {
  if (imageSize.includes('1080x1350')) return { width: 1080, height: 1350 }
  if (imageSize.includes('1080x1920')) return { width: 1080, height: 1920 }
  if (imageSize.includes('1200x628')) return { width: 1200, height: 628 }
  return { width: 1080, height: 1080 }
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  // Japanese-aware word wrap
  const chars = text.split('')
  let line = ''
  let currentY = y
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    if (chars[i] === '\n') {
      ctx.fillText(line, x, currentY)
      line = ''
      currentY += lineHeight
      continue
    }
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY)
      line = chars[i]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
    currentY += lineHeight
  }
  return currentY
}

function renderDesign(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  layoutType: string,
  bgFrom: string,
  bgTo: string,
  textContent: string,
  templateName: string,
  companyName: string,
) {
  const lines = (textContent || '').split('\n').map(l => l.trim()).filter(Boolean)
  const mainText = lines[0] || templateName
  const subText = lines[1] || ''
  const U = Math.min(W, H) / 20 // base unit

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, bgFrom)
  grad.addColorStop(1, bgTo)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Helper: draw decorative dots pattern
  const drawDots = () => {
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    for (let i = 0; i < W; i += U * 2.5) {
      for (let j = 0; j < H; j += U * 2.5) {
        ctx.beginPath()
        ctx.arc(i, j, U * 0.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  switch (layoutType) {
    case 'photo-overlay': {
      // Photo placeholder area
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, 0, W, H * 0.65)
      // Camera icon placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      const cx = W / 2, cy = H * 0.32
      ctx.beginPath()
      ctx.arc(cx, cy, U * 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `${U * 2.5}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('📷', cx, cy + U * 0.9)
      // Text overlay bar
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(0, H * 0.65, W, H * 0.35)
      // Accent line
      const rgb = hexToRgb(bgFrom)
      ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`
      ctx.fillRect(W * 0.06, H * 0.67, U * 0.4, H * 0.28)
      // Main text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.font = `bold ${U * 1.6}px sans-serif`
      wrapText(ctx, mainText, W * 0.1, H * 0.73, W * 0.82, U * 2.2)
      if (subText) {
        ctx.font = `${U * 0.9}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.fillText(subText, W * 0.1, H * 0.88)
      }
      // Company
      ctx.font = `bold ${U * 0.75}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.textAlign = 'right'
      ctx.fillText(companyName, W * 0.94, H * 0.97)
      break
    }

    case 'color-text': {
      drawDots()
      // Large circle decoration
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath()
      ctx.arc(W * 0.85, H * 0.15, U * 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.beginPath()
      ctx.arc(W * 0.1, H * 0.85, U * 5, 0, Math.PI * 2)
      ctx.fill()
      // Main text
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 2.2}px sans-serif`
      wrapText(ctx, mainText, W / 2, H * 0.38, W * 0.82, U * 2.8)
      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(W * 0.3, H * 0.62)
      ctx.lineTo(W * 0.7, H * 0.62)
      ctx.stroke()
      if (subText) {
        ctx.font = `${U * 1.0}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillText(subText, W / 2, H * 0.72)
      }
      ctx.font = `bold ${U * 0.75}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText(companyName, W / 2, H * 0.93)
      break
    }

    case 'grid-2x2': {
      const gap = U * 0.8
      const cW = (W - gap * 3) / 2
      const cH = (H - gap * 3 - U * 3) / 2
      const startY = U * 3
      const labels = lines.length >= 4 ? lines : ['メニュー 1', 'メニュー 2', 'メニュー 3', 'メニュー 4']
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const x = gap + col * (cW + gap)
          const y = startY + gap + row * (cH + gap)
          ctx.fillStyle = 'rgba(255,255,255,0.12)'
          drawRoundRect(ctx, x, y, cW, cH, U * 0.6)
          ctx.fill()
          // Price placeholder
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
          ctx.fillRect(x + U, y + cH - U * 2.5, cW - U * 2, U * 1.5)
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${U * 0.85}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(labels[row * 2 + col] || '', x + cW / 2, y + cH - U * 1.2)
        }
      }
      // Header
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 1.4}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(mainText, W / 2, U * 2)
      break
    }

    case 'story-vertical': {
      // Gradient overlay
      const vGrad = ctx.createLinearGradient(0, 0, 0, H)
      vGrad.addColorStop(0, 'rgba(0,0,0,0.1)')
      vGrad.addColorStop(0.5, 'rgba(0,0,0,0)')
      vGrad.addColorStop(1, 'rgba(0,0,0,0.5)')
      ctx.fillStyle = vGrad
      ctx.fillRect(0, 0, W, H)
      drawDots()
      // Center content
      ctx.textAlign = 'center'
      // Logo circle
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.35, U * 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${U * 3.5}px sans-serif`
      ctx.fillText('✨', W / 2, H * 0.35 + U * 1.3)
      ctx.font = `black ${U * 2}px sans-serif`
      ctx.fillStyle = '#ffffff'
      wrapText(ctx, mainText, W / 2, H * 0.58, W * 0.82, U * 2.8)
      if (subText) {
        ctx.font = `${U * 1.0}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fillText(subText, W / 2, H * 0.76)
      }
      ctx.font = `bold ${U * 0.8}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText(companyName, W / 2, H * 0.93)
      break
    }

    case 'number-big': {
      drawDots()
      // Big circle
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.42, Math.min(W, H) * 0.32, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.42, Math.min(W, H) * 0.28, 0, Math.PI * 2)
      ctx.fill()
      // Big number
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 4.5}px sans-serif`
      ctx.fillText(mainText, W / 2, H * 0.48 + U * 1.5)
      if (subText) {
        ctx.font = `bold ${U * 1.5}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillText(subText, W / 2, H * 0.65)
      }
      // Bottom bar
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, H * 0.8, W, H * 0.2)
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${U * 0.9}px sans-serif`
      ctx.fillText(lines[2] || companyName, W / 2, H * 0.92)
      break
    }

    case 'banner-limit': {
      // Timer/clock at top
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.22, U * 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${U * 2.5}px sans-serif`
      ctx.fillText('⏰', W / 2, H * 0.22 + U * 0.9)
      // Date/period
      ctx.font = `bold ${U * 1.2}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText(subText || '期間限定', W / 2, H * 0.47)
      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(W * 0.2, H * 0.52)
      ctx.lineTo(W * 0.8, H * 0.52)
      ctx.stroke()
      ctx.font = `black ${U * 1.8}px sans-serif`
      ctx.fillStyle = '#ffffff'
      wrapText(ctx, mainText, W / 2, H * 0.62, W * 0.82, U * 2.3)
      ctx.font = `bold ${U * 0.75}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText(companyName, W / 2, H * 0.93)
      break
    }

    case 'stamp': {
      drawDots()
      // Outer circle (dashed effect)
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = U * 0.3
      ctx.setLineDash([U * 0.5, U * 0.3])
      const r = Math.min(W, H) * 0.38
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.48, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      // Inner circle
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = U * 0.15
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.48, r * 0.85, 0, Math.PI * 2)
      ctx.stroke()
      // Text
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 1.8}px sans-serif`
      wrapText(ctx, mainText, W / 2, H * 0.4, W * 0.65, U * 2.4)
      if (subText) {
        ctx.font = `bold ${U * 1.0}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillText(subText, W / 2, H * 0.62)
      }
      ctx.font = `${U * 0.75}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText(companyName, W / 2, H * 0.9)
      break
    }

    case 'product-card': {
      // Light theme
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      // Photo area
      const pGrad = ctx.createLinearGradient(0, 0, W, H * 0.62)
      pGrad.addColorStop(0, bgFrom + '40')
      pGrad.addColorStop(1, bgTo + '80')
      ctx.fillStyle = pGrad
      ctx.fillRect(0, 0, W, H * 0.62)
      // Camera icon
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.31, U * 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = `${U * 2.5}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('📦', W / 2, H * 0.31 + U * 0.9)
      // Info area
      ctx.fillStyle = '#f8f8f8'
      ctx.fillRect(0, H * 0.62, W, H * 0.38)
      // Accent bar
      ctx.fillStyle = bgFrom
      ctx.fillRect(W * 0.06, H * 0.64, U * 0.35, H * 0.3)
      ctx.fillStyle = '#111111'
      ctx.font = `bold ${U * 1.3}px sans-serif`
      ctx.textAlign = 'left'
      wrapText(ctx, mainText, W * 0.1, H * 0.71, W * 0.82, U * 1.8)
      if (subText) {
        ctx.fillStyle = bgFrom
        ctx.font = `black ${U * 1.4}px sans-serif`
        ctx.fillText(subText, W * 0.1, H * 0.88)
      }
      ctx.fillStyle = '#999999'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.fillText(companyName, W * 0.1, H * 0.97)
      break
    }

    case 'menu-list': {
      // Light theme
      ctx.fillStyle = '#fffaf5'
      ctx.fillRect(0, 0, W, H)
      // Header
      ctx.fillStyle = bgFrom
      ctx.fillRect(0, 0, W, H * 0.18)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = `black ${U * 1.5}px sans-serif`
      ctx.fillText(mainText, W / 2, H * 0.12)
      // Menu rows
      const rowH = (H * 0.78) / 3
      for (let i = 0; i < 3; i++) {
        const y = H * 0.2 + i * rowH
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.03)'
        ctx.fillRect(0, y, W, rowH - U * 0.2)
        // Thumbnail
        ctx.fillStyle = bgFrom + '30'
        drawRoundRect(ctx, U, y + U * 0.3, U * 4, rowH - U * 1, U * 0.4)
        ctx.fill()
        // Text
        ctx.fillStyle = '#333333'
        ctx.textAlign = 'left'
        ctx.font = `bold ${U * 1.0}px sans-serif`
        ctx.fillText(lines[i + 1] || `メニュー ${i + 1}`, U * 5.5, y + rowH * 0.45)
        ctx.fillStyle = bgFrom
        ctx.font = `bold ${U * 0.95}px sans-serif`
        ctx.textAlign = 'right'
        ctx.fillText('¥---', W - U, y + rowH * 0.45)
      }
      // Footer
      ctx.fillStyle = '#999999'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(companyName, W / 2, H * 0.97)
      break
    }

    case 'before-after': {
      // Split design
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, 0, W / 2, H)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(W / 2 + 2, 0, W / 2, H)
      // Divider
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(W / 2 - 2, 0, 4, H)
      // Arrow circle
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.5, U * 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = bgFrom
      ctx.font = `bold ${U * 1.5}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('→', W / 2, H * 0.5 + U * 0.5)
      // Labels
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 1.1}px sans-serif`
      ctx.fillText('BEFORE', W / 4, H * 0.12)
      ctx.fillText('AFTER', W * 3 / 4, H * 0.12)
      // Bottom text
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, H * 0.82, W, H * 0.18)
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${U * 1.2}px sans-serif`
      ctx.fillText(mainText, W / 2, H * 0.93)
      break
    }

    case 'calendar': {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      // Header
      ctx.fillStyle = bgFrom
      ctx.fillRect(0, 0, W, H * 0.2)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = `black ${U * 1.5}px sans-serif`
      ctx.fillText(mainText, W / 2, H * 0.13)
      // Calendar grid
      const days = ['月', '火', '水', '木', '金', '土', '日']
      const cellW = W / 7
      const cellH = (H * 0.75) / 5
      // Day headers
      days.forEach((d, i) => {
        ctx.fillStyle = i === 6 ? '#e60023' : (i === 5 ? '#4444cc' : '#666666')
        ctx.font = `bold ${U * 0.8}px sans-serif`
        ctx.fillText(d, cellW * i + cellW / 2, H * 0.27)
      })
      // Date cells
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
          const num = row * 7 + col - 1
          if (num < 0 || num > 30) continue
          const x = cellW * col + cellW / 2
          const y = H * 0.32 + row * cellH + cellH * 0.5
          if (num === 14) {
            ctx.fillStyle = bgFrom
            ctx.beginPath()
            ctx.arc(x, y - U * 0.2, U * 0.9, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#ffffff'
          } else {
            ctx.fillStyle = col === 6 ? '#e60023' : (col === 5 ? '#4444cc' : '#333333')
          }
          ctx.font = `${U * 0.8}px sans-serif`
          ctx.fillText(String(num + 1), x, y)
        }
      }
      ctx.fillStyle = '#cccccc'
      ctx.font = `${U * 0.65}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.97)
      break
    }

    case 'event-banner': {
      // Header
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(0, 0, W, H * 0.2)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = `black ${U * 1.1}px sans-serif`
      ctx.fillText('EVENT', W / 2, H * 0.13)
      // Body
      ctx.font = `black ${U * 2}px sans-serif`
      ctx.fillStyle = '#ffffff'
      wrapText(ctx, mainText, W / 2, H * 0.4, W * 0.82, U * 2.6)
      // Info row
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, H * 0.7, W, H * 0.15)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = `bold ${U * 0.9}px sans-serif`
      ctx.fillText(subText || '日時・場所詳細はこちら', W / 2, H * 0.8)
      // Footer
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, H * 0.85, W, H * 0.15)
      ctx.fillStyle = bgFrom
      ctx.font = `bold ${U * 0.8}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.94)
      break
    }

    case 'steps-3': {
      drawDots()
      ctx.textAlign = 'center'
      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 1.6}px sans-serif`
      ctx.fillText(mainText, W / 2, H * 0.2)
      // Steps
      const stepX = [W * 0.18, W * 0.5, W * 0.82]
      const stepColors = ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.35)']
      const stepLabels = lines.length >= 3 ? lines.slice(0, 3) : ['STEP 1', 'STEP 2', 'STEP 3']
      stepX.forEach((x, i) => {
        ctx.fillStyle = stepColors[i]
        ctx.beginPath()
        ctx.arc(x, H * 0.5, U * 2.2, 0, Math.PI * 2)
        ctx.fill()
        const rgb2 = hexToRgb(bgFrom)
        ctx.fillStyle = `rgb(${rgb2.r},${rgb2.g},${rgb2.b})`
        ctx.font = `black ${U * 1.8}px sans-serif`
        ctx.fillText(String(i + 1), x, H * 0.5 + U * 0.65)
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${U * 0.75}px sans-serif`
        ctx.fillText(stepLabels[i] || `STEP ${i + 1}`, x, H * 0.72)
      })
      // Arrows
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = U * 0.2
      ctx.beginPath()
      ctx.moveTo(W * 0.32, H * 0.5)
      ctx.lineTo(W * 0.4, H * 0.5)
      ctx.moveTo(W * 0.64, H * 0.5)
      ctx.lineTo(W * 0.72, H * 0.5)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `bold ${U * 1.2}px sans-serif`
      ctx.fillText('▶', W * 0.36, H * 0.5 + U * 0.4)
      ctx.fillText('▶', W * 0.68, H * 0.5 + U * 0.4)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.93)
      break
    }

    case 'qr-code': {
      // White card
      ctx.fillStyle = '#ffffff'
      drawRoundRect(ctx, W * 0.1, H * 0.1, W * 0.8, H * 0.8, U)
      ctx.fill()
      // QR placeholder
      const qrSize = Math.min(W, H) * 0.42
      const qrX = W / 2 - qrSize / 2
      const qrY = H * 0.2
      ctx.fillStyle = '#000000'
      ctx.fillRect(qrX, qrY, qrSize, qrSize)
      // QR pattern dots
      ctx.fillStyle = '#ffffff'
      const dot = qrSize / 8
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(qrX + c * dot + 1, qrY + r * dot + 1, dot - 1, dot - 1)
          }
        }
      }
      ctx.fillStyle = '#333333'
      ctx.textAlign = 'center'
      ctx.font = `black ${U * 1.1}px sans-serif`
      ctx.fillText(mainText, W / 2, H * 0.73)
      ctx.fillStyle = bgFrom
      ctx.font = `bold ${U * 0.9}px sans-serif`
      ctx.fillText(subText || '友だち追加はこちら', W / 2, H * 0.82)
      ctx.fillStyle = '#999999'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.93)
      break
    }

    case 'quote-card': {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      // Top accent
      ctx.fillStyle = bgFrom
      ctx.fillRect(0, 0, W, H * 0.07)
      // Quote marks
      ctx.fillStyle = bgFrom + '25'
      ctx.font = `black ${U * 8}px serif`
      ctx.textAlign = 'left'
      ctx.fillText('"', W * 0.05, H * 0.45)
      ctx.textAlign = 'right'
      ctx.fillText('"', W * 0.95, H * 0.75)
      // Text
      ctx.fillStyle = '#222222'
      ctx.textAlign = 'center'
      ctx.font = `${U * 1.1}px sans-serif`
      wrapText(ctx, mainText, W / 2, H * 0.38, W * 0.78, U * 1.8)
      // Stars
      ctx.fillStyle = '#f59e0b'
      ctx.font = `${U * 1.2}px sans-serif`
      ctx.fillText('★★★★★', W / 2, H * 0.72)
      // Author
      ctx.fillStyle = bgFrom
      ctx.font = `bold ${U * 0.85}px sans-serif`
      ctx.fillText(subText || 'お客様の声', W / 2, H * 0.82)
      ctx.fillStyle = '#aaaaaa'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.95)
      break
    }

    case 'person-info': {
      // Top half
      const pGrad2 = ctx.createLinearGradient(0, 0, W, H * 0.5)
      pGrad2.addColorStop(0, bgFrom)
      pGrad2.addColorStop(1, bgTo)
      ctx.fillStyle = pGrad2
      ctx.fillRect(0, 0, W, H * 0.5)
      // Avatar circle
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.32, U * 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = `${U * 3.5}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('👤', W / 2, H * 0.32 + U * 1.2)
      // Bottom info
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, H * 0.5, W, H * 0.5)
      ctx.fillStyle = '#111111'
      ctx.font = `black ${U * 1.4}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(mainText, W / 2, H * 0.63)
      if (subText) {
        ctx.fillStyle = bgFrom
        ctx.font = `bold ${U * 0.95}px sans-serif`
        ctx.fillText(subText, W / 2, H * 0.74)
      }
      ctx.fillStyle = '#888888'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.95)
      break
    }

    case 'info-list': {
      drawDots()
      // Title
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.font = `black ${U * 1.8}px sans-serif`
      wrapText(ctx, mainText, W * 0.08, H * 0.18, W * 0.84, U * 2.3)
      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(W * 0.08, H * 0.32)
      ctx.lineTo(W * 0.92, H * 0.32)
      ctx.stroke()
      // List items
      const items = lines.slice(1).length > 0 ? lines.slice(1) : ['時給 〇〇〇〇円', '週3日〜OK', '未経験歓迎']
      items.slice(0, 3).forEach((item, i) => {
        const y = H * 0.45 + i * H * 0.18
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(W * 0.1, y, U * 0.8, 0, Math.PI * 2)
        ctx.fill()
        const rgb3 = hexToRgb(bgFrom)
        ctx.fillStyle = `rgb(${rgb3.r},${rgb3.g},${rgb3.b})`
        ctx.font = `bold ${U * 0.8}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(String(i + 1), W * 0.1, y + U * 0.28)
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.font = `bold ${U * 1.0}px sans-serif`
        ctx.fillText(item, W * 0.16, y + U * 0.35)
      })
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(companyName, W / 2, H * 0.95)
      break
    }

    case 'shop-hero': {
      // Dark overlay
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, W, H)
      drawDots()
      // Logo circle
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.35, U * 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(W / 2, H * 0.35, U * 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = `${U * 3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('🏪', W / 2, H * 0.35 + U)
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 1.7}px sans-serif`
      ctx.fillText(companyName || mainText, W / 2, H * 0.62)
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(W * 0.25, H * 0.67)
      ctx.lineTo(W * 0.75, H * 0.67)
      ctx.stroke()
      if (subText || mainText) {
        ctx.font = `${U * 0.9}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.fillText(subText || mainText, W / 2, H * 0.75)
      }
      break
    }

    case 'hero-wide': {
      // Left text area
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(0, 0, W * 0.52, H)
      // Right color block
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(W * 0.54, 0, W * 0.46, H)
      // Divider
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillRect(W * 0.52, 0, 3, H)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.font = `black ${U * 1.8}px sans-serif`
      wrapText(ctx, mainText, U * 2, H * 0.35, W * 0.46, U * 2.4)
      if (subText) {
        ctx.font = `${U * 0.85}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fillText(subText, U * 2, H * 0.65)
      }
      // CTA button
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      drawRoundRect(ctx, U * 2, H * 0.76, U * 9, U * 2, U)
      ctx.fill()
      ctx.fillStyle = bgFrom
      ctx.font = `bold ${U * 0.9}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('詳しくはこちら', U * 2 + U * 4.5, H * 0.76 + U * 1.35)
      // Right icon
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = `${U * 5}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('🖥️', W * 0.77, H * 0.55)
      break
    }

    case 'lp-stack': {
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, W, H)
      // 3 sections
      const sections = [
        { color: bgFrom, h: 0.25, label: lines[0] || '特徴・強み' },
        { color: bgTo, h: 0.25, label: lines[1] || 'サービス内容' },
        { color: bgFrom + 'aa', h: 0.3, label: lines[2] || 'お問い合わせ' },
      ]
      let yPos = H * 0.08
      sections.forEach((s) => {
        const sH = H * s.h
        ctx.fillStyle = s.color
        drawRoundRect(ctx, W * 0.06, yPos, W * 0.88, sH - U * 0.5, U * 0.5)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.font = `bold ${U * 1.0}px sans-serif`
        ctx.fillText(s.label, W / 2, yPos + sH * 0.55)
        yPos += sH
      })
      ctx.fillStyle = '#888888'
      ctx.font = `${U * 0.65}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(companyName, W / 2, H * 0.97)
      break
    }

    case 'pop-border': {
      // Border frame
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = U * 0.6
      ctx.strokeRect(U * 1.2, U * 1.2, W - U * 2.4, H - U * 2.4)
      ctx.lineWidth = U * 0.2
      ctx.strokeRect(U * 2, U * 2, W - U * 4, H - U * 4)
      // Content
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 2.5}px sans-serif`
      wrapText(ctx, mainText, W / 2, H * 0.38, W * 0.76, U * 3.2)
      if (subText) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = `bold ${U * 1.1}px sans-serif`
        ctx.fillText(subText, W / 2, H * 0.68)
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `bold ${U * 0.75}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.9)
      break
    }

    case 'youtube-thumb': {
      // Photo area left
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(0, 0, W * 0.48, H)
      // Person placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.beginPath()
      ctx.arc(W * 0.24, H * 0.42, U * 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = `${U * 3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('😀', W * 0.24, H * 0.42 + U)
      // Right text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.font = `black ${U * 1.7}px sans-serif`
      wrapText(ctx, mainText, W * 0.53, H * 0.3, W * 0.42, U * 2.3)
      // Play button
      ctx.fillStyle = '#ff0000'
      drawRoundRect(ctx, W * 0.53, H * 0.7, U * 5, U * 1.8, U * 0.4)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${U * 0.9}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('▶ 再生', W * 0.53 + U * 2.5, H * 0.7 + U * 1.2)
      break
    }

    case 'natural': {
      // Wave decoration
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      ctx.moveTo(0, H * 0.6)
      for (let x = 0; x <= W; x += W / 8) {
        ctx.quadraticCurveTo(x + W / 16, H * 0.55, x + W / 8, H * 0.6)
      }
      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.closePath()
      ctx.fill()
      // Leaf decorations
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.font = `${U * 3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('🌿', W * 0.15, H * 0.25)
      ctx.fillText('🌿', W * 0.85, H * 0.2)
      // Main text
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${U * 1.8}px sans-serif`
      ctx.textAlign = 'center'
      wrapText(ctx, mainText, W / 2, H * 0.38, W * 0.78, U * 2.4)
      if (subText) {
        ctx.font = `${U * 0.95}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillText(subText, W / 2, H * 0.66)
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `${U * 0.75}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.9)
      break
    }

    default: {
      drawDots()
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, H * 0.08, W, H * 0.18)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(0, H * 0.08, W, H * 0.18)
      ctx.fillStyle = '#ffffff'
      ctx.font = `black ${U * 1.7}px sans-serif`
      const t = lines[0] || templateName
      ctx.fillText(t.length > 14 ? t.slice(0, 14) + '...' : t, W / 2, H * 0.2)
      if (lines.length > 1) {
        ctx.font = `${U * 0.9}px sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        lines.slice(1, 4).forEach((l, i) => {
          ctx.fillText(l, W / 2, H * 0.42 + i * U * 1.6)
        })
      }
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `${U * 0.7}px sans-serif`
      ctx.fillText(companyName, W / 2, H * 0.93)
      break
    }
  }
}

// 素材画像をcanvas上の指定エリアに描画（cover fit）
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  radius = 0
) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = img.width * scale
  const sh = img.height * scale
  const sx = x + (w - sw) / 2
  const sy = y + (h - sh) / 2
  ctx.save()
  if (radius > 0) {
    drawRoundRect(ctx, x, y, w, h, radius)
    ctx.clip()
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
  }
  ctx.drawImage(img, sx, sy, sw, sh)
  ctx.restore()
}

export function DesignCanvas({
  layoutType,
  bgFrom,
  bgTo,
  textContent,
  templateName,
  imageSize,
  companyName = '',
  materialFile,
  onGenerated,
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { width, height } = parseSize(imageSize || '正方形(1080x1080px)')
  const maxW = 480
  const scale = Math.min(maxW / width, 480 / height)
  const pw = Math.round(width * scale)
  const ph = Math.round(height * scale)

  const draw = useCallback((materialImg?: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = width, H = height
    const U = Math.min(W, H) / 20

    // ベースデザイン描画
    renderDesign(ctx, W, H, layoutType, bgFrom, bgTo, textContent, templateName, companyName)

    // 素材画像を写真プレースホルダー位置に重ね描き
    if (materialImg) {
      const photoLayouts: Record<string, () => void> = {
        'photo-overlay': () => {
          drawImageCover(ctx, materialImg, 0, 0, W, H * 0.65)
        },
        'product-card': () => {
          drawImageCover(ctx, materialImg, 0, 0, W, H * 0.62)
        },
        'before-after': () => {
          // Afterエリアに表示
          drawImageCover(ctx, materialImg, W / 2 + 4, 0, W / 2 - 4, H * 0.82)
        },
        'person-info': () => {
          // アバター円に表示
          ctx.save()
          ctx.beginPath()
          ctx.arc(W / 2, H * 0.32, U * 4, 0, Math.PI * 2)
          ctx.clip()
          drawImageCover(ctx, materialImg, W / 2 - U * 4, H * 0.32 - U * 4, U * 8, U * 8)
          ctx.restore()
        },
        'recruit-person': () => {
          ctx.save()
          ctx.beginPath()
          ctx.arc(W / 2, H * 0.32, U * 4, 0, Math.PI * 2)
          ctx.clip()
          drawImageCover(ctx, materialImg, W / 2 - U * 4, H * 0.32 - U * 4, U * 8, U * 8)
          ctx.restore()
        },
        'shop-hero': () => {
          // 背景全体に薄く
          ctx.save()
          ctx.globalAlpha = 0.35
          drawImageCover(ctx, materialImg, 0, 0, W, H)
          ctx.restore()
        },
        'youtube-thumb': () => {
          drawImageCover(ctx, materialImg, 0, 0, W * 0.48, H)
        },
        'menu-list': () => {
          // 3つのサムネイルに表示
          const rowH = (H * 0.78) / 3
          for (let i = 0; i < 3; i++) {
            const y = H * 0.2 + i * rowH
            drawImageCover(ctx, materialImg, U, y + U * 0.3, U * 4, rowH - U * 1, U * 0.4)
          }
        },
      }
      const fn = photoLayouts[layoutType]
      if (fn) fn()
    }

    onGenerated?.(canvas.toDataURL('image/png'))
  }, [layoutType, bgFrom, bgTo, textContent, templateName, companyName, width, height, onGenerated])

  useEffect(() => {
    if (materialFile) {
      const url = URL.createObjectURL(materialFile)
      const img = new Image()
      img.onload = () => {
        draw(img)
        URL.revokeObjectURL(url)
      }
      img.src = url
    } else {
      draw()
    }
  }, [draw, materialFile])

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: pw, height: ph, maxWidth: '100%', maxHeight: '70vh' }}
        className="rounded-2xl shadow-xl"
      />
    </div>
  )
}
