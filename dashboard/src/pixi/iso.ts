// Isometric coordinate helpers
// 2:1 isometric ratio — each tile is a diamond

export const TILE_W = 32
export const TILE_H = 16

// Convert grid (col, row) to screen (x, y) in isometric space
export function toIso(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  }
}

// Draw a filled isometric tile (diamond shape)
export function drawIsoTile(
  g: import('pixi.js').Graphics,
  col: number,
  row: number,
  color: number,
  alpha = 1
) {
  const { x, y } = toIso(col, row)
  const hw = TILE_W / 2
  const hh = TILE_H / 2
  g.fill({ color, alpha })
  g.moveTo(x, y - hh)
  g.lineTo(x + hw, y)
  g.lineTo(x, y + hh)
  g.lineTo(x - hw, y)
  g.closePath()
  g.fill()
}

// Draw an isometric box (tile with height — for walls, furniture)
export function drawIsoBox(
  g: import('pixi.js').Graphics,
  col: number,
  row: number,
  height: number,
  topColor: number,
  leftColor: number,
  rightColor: number,
  alpha = 1
) {
  const { x, y } = toIso(col, row)
  const hw = TILE_W / 2
  const hh = TILE_H / 2

  // Top face
  g.fill({ color: topColor, alpha })
  g.moveTo(x, y - hh - height)
  g.lineTo(x + hw, y - height)
  g.lineTo(x, y + hh - height)
  g.lineTo(x - hw, y - height)
  g.closePath()
  g.fill()

  // Left face
  g.fill({ color: leftColor, alpha })
  g.moveTo(x - hw, y - height)
  g.lineTo(x, y + hh - height)
  g.lineTo(x, y + hh)
  g.lineTo(x - hw, y)
  g.closePath()
  g.fill()

  // Right face
  g.fill({ color: rightColor, alpha })
  g.moveTo(x + hw, y - height)
  g.lineTo(x, y + hh - height)
  g.lineTo(x, y + hh)
  g.lineTo(x + hw, y)
  g.closePath()
  g.fill()
}
