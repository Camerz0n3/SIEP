import { Texture, Sprite } from 'pixi.js'

// Pixel art sprite generator
// Defines art as a 2D color grid, renders to an offscreen canvas,
// converts to a PixiJS Texture with nearest-neighbour scaling (crisp pixels)

type PixelGrid = (string | null)[][]

// Create a PixiJS Texture from a pixel color grid
// Each cell is a CSS color string or null for transparent
export function createPixelTexture(grid: PixelGrid, pixelSize = 1): Texture {
  const rows = grid.length
  const cols = grid[0].length
  const canvas = document.createElement('canvas')
  canvas.width = cols * pixelSize
  canvas.height = rows * pixelSize
  const ctx = canvas.getContext('2d')!

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize)
    }
  }

  const texture = Texture.from(canvas)
  texture.source.scaleMode = 'nearest'
  return texture
}

// Create a PixiJS Sprite from a pixel grid, anchored at bottom-center
export function createPixelSprite(grid: PixelGrid, scale = 1): Sprite {
  const texture = createPixelTexture(grid)
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 1) // bottom-center anchor (feet position)
  sprite.scale.set(scale)
  return sprite
}

// Shorthand: transparent
export const _ = null

// Hex to CSS color
export function h(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0')
}
