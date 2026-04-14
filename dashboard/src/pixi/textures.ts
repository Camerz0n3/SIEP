import { Graphics } from 'pixi.js'
import { toIso, TILE_W, TILE_H } from './iso'
import { C } from './colors'

// Draw a base iso tile shape
function isoTile(g: Graphics, x: number, y: number, hw: number, hh: number, color: number) {
  g.fill({ color })
  g.moveTo(x, y - hh)
  g.lineTo(x + hw, y)
  g.lineTo(x, y + hh)
  g.lineTo(x - hw, y)
  g.closePath()
  g.fill()
}

export function drawTexturedFloor(
  g: Graphics,
  col: number,
  row: number,
  baseColor: number,
  type: 'wood' | 'carpet' | 'hallway' | 'marble'
) {
  const { x, y } = toIso(col, row)
  const hw = TILE_W / 2
  const hh = TILE_H / 2

  if (type === 'marble') {
    // Marble tile — alternating light/mid checkerboard with veins
    const isLight = (col + row) % 2 === 0
    const tileColor = isLight ? C.marbleLight : C.marbleMid
    isoTile(g, x, y, hw, hh, tileColor)

    // Marble veins — subtle diagonal lines
    const veinAlpha = 0.15
    const seed = (col * 17 + row * 31) % 7
    if (seed < 3) {
      g.stroke({ color: C.marbleVein, width: 0.3, alpha: veinAlpha })
      const ox = (seed - 1) * 3
      g.moveTo(x - hw * 0.5 + ox, y - hh * 0.3)
      g.lineTo(x + hw * 0.3 + ox, y + hh * 0.5)
      g.stroke()
    }
    if (seed === 0 || seed === 4) {
      g.stroke({ color: C.marbleDark, width: 0.2, alpha: veinAlpha * 0.7 })
      g.moveTo(x + hw * 0.2, y - hh * 0.5)
      g.lineTo(x - hw * 0.4, y + hh * 0.2)
      g.stroke()
    }

    // Subtle tile edge highlight
    g.stroke({ color: 0xffffff, width: 0.2, alpha: 0.06 })
    g.moveTo(x, y - hh)
    g.lineTo(x + hw, y)
    g.stroke()
    g.moveTo(x, y - hh)
    g.lineTo(x - hw, y)
    g.stroke()

    return
  }

  // Base tile
  const shade = (col + row) % 2 === 0 ? baseColor : baseColor + 0x080808
  isoTile(g, x, y, hw, hh, shade)

  if (type === 'wood') {
    const grainColor = baseColor - 0x040404
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * (hh / 2)
      g.stroke({ color: grainColor, width: 0.3, alpha: 0.4 })
      g.moveTo(x - hw * 0.6, y + offset - hh * 0.15)
      g.lineTo(x + hw * 0.6, y + offset + hh * 0.15)
      g.stroke()
    }
    if ((col * 7 + row * 13) % 11 === 0) {
      g.fill({ color: baseColor - 0x080808, alpha: 0.3 })
      g.circle(x + ((col % 3) - 1) * 3, y + ((row % 2) - 0.5) * 2, 1)
      g.fill()
    }
  } else if (type === 'carpet') {
    const threadColor = baseColor + 0x0c0a0a
    g.stroke({ color: threadColor, width: 0.2, alpha: 0.35 })
    g.moveTo(x - hw * 0.4, y - hh * 0.4)
    g.lineTo(x + hw * 0.4, y + hh * 0.4)
    g.stroke()
    g.moveTo(x + hw * 0.4, y - hh * 0.4)
    g.lineTo(x - hw * 0.4, y + hh * 0.4)
    g.stroke()
    if (col % 4 === 0 || row % 4 === 0) {
      g.stroke({ color: C.goldDim, width: 0.3, alpha: 0.2 })
      g.moveTo(x - hw * 0.8, y)
      g.lineTo(x, y - hh * 0.8)
      g.stroke()
    }
  } else {
    // Hallway marble
    const hlColor = (col + row) % 2 === 0 ? C.marbleMid : C.marbleDark
    isoTile(g, x, y, hw, hh, hlColor)
    g.stroke({ color: 0xffffff, width: 0.2, alpha: 0.04 })
    g.moveTo(x, y - hh)
    g.lineTo(x + hw, y)
    g.stroke()
  }
}

export function drawTexturedWall(
  g: Graphics,
  col: number,
  row: number,
  wallH: number,
  side: 'left' | 'right'
) {
  const { x, y } = toIso(col, row)
  const hw = TILE_W / 2

  const baseColor = side === 'left' ? C.wallDark : C.wallMid
  const panelColor = side === 'left' ? C.wallPanelDark : C.wallPanelLight

  // Main wall face
  g.fill({ color: baseColor })
  g.moveTo(x - hw, y)
  g.lineTo(x, y - TILE_H / 2)
  g.lineTo(x, y - TILE_H / 2 - wallH)
  g.lineTo(x - hw, y - wallH)
  g.closePath()
  g.fill()

  // Panel lines
  const panelCount = side === 'left' ? 3 : 3
  for (let i = 1; i < panelCount; i++) {
    const frac = i / panelCount
    let lx: number, ly: number
    if (side === 'left') {
      lx = x - hw + (hw * frac)
      ly = y - (TILE_H / 2) * frac
    } else {
      lx = x - hw * (1 - frac)
      ly = y - TILE_H / 4 - (TILE_H / 4) * frac
    }
    g.stroke({ color: panelColor, width: 0.4, alpha: 0.5 })
    g.moveTo(lx, ly)
    g.lineTo(lx, ly - wallH)
    g.stroke()
  }

  // Wainscoting (bottom third)
  const wainH = wallH / 3
  g.fill({ color: baseColor - 0x060606, alpha: 0.35 })
  g.moveTo(x - hw, y)
  g.lineTo(x, y - TILE_H / 2)
  g.lineTo(x, y - TILE_H / 2 - wainH)
  g.lineTo(x - hw, y - wainH)
  g.closePath()
  g.fill()

  // Chair rail (gold accent)
  g.stroke({ color: C.gold, width: 0.4, alpha: 0.25 })
  g.moveTo(x - hw, y - wainH)
  g.lineTo(x, y - TILE_H / 2 - wainH)
  g.stroke()

  // Crown moulding (top)
  g.stroke({ color: C.gold, width: 0.3, alpha: 0.15 })
  g.moveTo(x - hw, y - wallH)
  g.lineTo(x, y - TILE_H / 2 - wallH)
  g.stroke()
}
