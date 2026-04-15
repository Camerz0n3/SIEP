import { Container, Sprite, Texture } from 'pixi.js'

// Character PNG sprites loaded from /assets/sprites/
// Black backgrounds are removed and images are auto-trimmed at load time

const CHAR_HEIGHT = 48 // target display height in pixels (fits ~3 iso tiles)

// === TEXTURE PROCESSING ===

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Remove background using edge-connected flood fill — only dark pixels reachable
// from the image border are removed, preserving dark clothing/hair inside characters
function processSprite(
  img: HTMLImageElement,
  cropX = 0,
  cropY = 0,
  cropW = img.naturalWidth,
  cropH = img.naturalHeight,
  threshold = 15,
  stripBrown = false,
): Texture {
  const tmp = document.createElement('canvas')
  tmp.width = cropW
  tmp.height = cropH
  const ctx = tmp.getContext('2d')!
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

  const imgData = ctx.getImageData(0, 0, cropW, cropH)
  const d = imgData.data
  const total = cropW * cropH

  // Step 1: Mark dark pixels (candidates for background)
  const isDark = new Uint8Array(total)
  for (let i = 0; i < total; i++) {
    const idx = i * 4
    if (d[idx] + d[idx + 1] + d[idx + 2] < threshold) isDark[i] = 1
  }

  // Step 2: Flood-fill from all 4 edges to find background
  const isBg = new Uint8Array(total)
  const stack: number[] = []
  for (let x = 0; x < cropW; x++) {
    const top = x
    if (isDark[top]) { isBg[top] = 1; stack.push(top) }
    const bot = (cropH - 1) * cropW + x
    if (isDark[bot]) { isBg[bot] = 1; stack.push(bot) }
  }
  for (let y = 1; y < cropH - 1; y++) {
    const left = y * cropW
    if (isDark[left]) { isBg[left] = 1; stack.push(left) }
    const right = y * cropW + cropW - 1
    if (isDark[right]) { isBg[right] = 1; stack.push(right) }
  }
  while (stack.length > 0) {
    const pos = stack.pop()!
    const x = pos % cropW
    const y = (pos - x) / cropW
    if (y > 0)          { const n = pos - cropW;     if (isDark[n] && !isBg[n]) { isBg[n] = 1; stack.push(n) } }
    if (y < cropH - 1)  { const n = pos + cropW;     if (isDark[n] && !isBg[n]) { isBg[n] = 1; stack.push(n) } }
    if (x > 0)          { const n = pos - 1;         if (isDark[n] && !isBg[n]) { isBg[n] = 1; stack.push(n) } }
    if (x < cropW - 1)  { const n = pos + 1;         if (isDark[n] && !isBg[n]) { isBg[n] = 1; stack.push(n) } }
  }

  // Step 3: Make only background pixels transparent, find content bounding box
  let minX = cropW, maxX = 0, minY = cropH, maxY = 0
  for (let i = 0; i < total; i++) {
    if (isBg[i]) {
      d[i * 4 + 3] = 0
    } else {
      const x = i % cropW
      const y = (i - x) / cropW
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  // Step 4 (optional): Strip brown/wood chair pixels via flood-fill from edges
  if (stripBrown) {
    const isBrown = new Uint8Array(total)
    for (let i = 0; i < total; i++) {
      if (d[i * 4 + 3] === 0) continue // already transparent
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]
      // Dark leather brown only: R 60-140, G 30-90, B < 50, not skin (skin has higher G relative to R)
      if (r >= 55 && r <= 150 && g >= 25 && g <= 90 && b < 55 && g < r * 0.7 && r - b > 30) isBrown[i] = 1
    }
    // Flood-fill brown from edges to remove chair but not brown on the body
    const isBrownBg = new Uint8Array(total)
    const brownStack: number[] = []
    for (let x = 0; x < cropW; x++) {
      if (isBrown[x]) { isBrownBg[x] = 1; brownStack.push(x) }
      const bot = (cropH - 1) * cropW + x
      if (isBrown[bot]) { isBrownBg[bot] = 1; brownStack.push(bot) }
    }
    for (let y = 1; y < cropH - 1; y++) {
      const left = y * cropW
      if (isBrown[left]) { isBrownBg[left] = 1; brownStack.push(left) }
      const right = y * cropW + cropW - 1
      if (isBrown[right]) { isBrownBg[right] = 1; brownStack.push(right) }
    }
    // Also seed from any pixel adjacent to already-transparent background
    for (let i = 0; i < total; i++) {
      if (!isBrown[i] || isBrownBg[i]) continue
      const x = i % cropW, y = (i - x) / cropW
      const neighbors = []
      if (y > 0) neighbors.push(i - cropW)
      if (y < cropH - 1) neighbors.push(i + cropW)
      if (x > 0) neighbors.push(i - 1)
      if (x < cropW - 1) neighbors.push(i + 1)
      for (const n of neighbors) {
        if (d[n * 4 + 3] === 0) { isBrownBg[i] = 1; brownStack.push(i); break }
      }
    }
    while (brownStack.length > 0) {
      const pos = brownStack.pop()!
      const x = pos % cropW, y = (pos - x) / cropW
      if (y > 0)         { const n = pos - cropW;  if (isBrown[n] && !isBrownBg[n]) { isBrownBg[n] = 1; brownStack.push(n) } }
      if (y < cropH - 1) { const n = pos + cropW;  if (isBrown[n] && !isBrownBg[n]) { isBrownBg[n] = 1; brownStack.push(n) } }
      if (x > 0)         { const n = pos - 1;      if (isBrown[n] && !isBrownBg[n]) { isBrownBg[n] = 1; brownStack.push(n) } }
      if (x < cropW - 1) { const n = pos + 1;      if (isBrown[n] && !isBrownBg[n]) { isBrownBg[n] = 1; brownStack.push(n) } }
    }
    // Recalculate bounds after removing brown
    minX = cropW; maxX = 0; minY = cropH; maxY = 0
    for (let i = 0; i < total; i++) {
      if (isBrownBg[i]) { d[i * 4 + 3] = 0; continue }
      if (d[i * 4 + 3] === 0) continue
      const x = i % cropW, y = (i - x) / cropW
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
    ctx.putImageData(imgData, 0, 0)
  }
  ctx.putImageData(imgData, 0, 0)

  if (maxX < minX) return Texture.EMPTY
  const tw = maxX - minX + 1
  const th = maxY - minY + 1
  const out = document.createElement('canvas')
  out.width = tw
  out.height = th
  out.getContext('2d')!.drawImage(tmp, minX, minY, tw, th, 0, 0, tw, th)

  const texture = Texture.from(out)
  texture.source.scaleMode = 'nearest'
  return texture
}

// === LOADED TEXTURES ===

let cameronSittingTex: Texture
let siepTex: Texture
let guardTex: Texture
let mansionTex: Texture
let backgroundTex: Texture
let lolaStandingTex: Texture

// Lola daily wardrobe: index 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const lolaOutfits: Texture[] = []

// Siep walk cycle: 4 frames from horizontal sprite sheet
const siepWalkFrames: Texture[] = []

// Siep room-specific idle poses
const siepRoomPoses: Record<string, Texture> = {}

export async function loadCharacterTextures(): Promise<void> {
  const [
    , camSitImg, siepImg, guardImg, , mansionImg, bgImg,
    lolaMonImg, lolaTueImg, lolaWedImg, lolaThuImg, lolaFriImg, lolaSatImg, lolaSunImg,
    lolaStandImg,
    siepWalkImg, siepOfficeImg, siepBoardImg, siepCorkImg, siepMailImg, siepReadImg,
  ] = await Promise.all([
    loadImage('/assets/sprites/cameron.png'),
    loadImage('/assets/sprites/cameron-sitting.png'),
    loadImage('/assets/sprites/siep.png'),
    loadImage('/assets/sprites/guard.png'),
    loadImage('/assets/sprites/guard-left.png'),
    loadImage('/assets/sprites/mansion.png'),
    loadImage('/assets/sprites/background.png'),
    // Lola outfits
    loadImage('/assets/sprites/lola.png'),
    loadImage('/assets/sprites/lola-tue.png'),
    loadImage('/assets/sprites/lola-wed.png'),
    loadImage('/assets/sprites/lola-thu.png'),
    loadImage('/assets/sprites/lola-fri.png'),
    loadImage('/assets/sprites/lola-sat.png'),
    loadImage('/assets/sprites/lola-sun.png'),
    // Lola standing
    loadImage('/assets/sprites/lola-standing.png'),
    // Siep walk + room poses
    loadImage('/assets/sprites/siep-walk-right.png'),
    loadImage('/assets/sprites/siep-office.png'),
    loadImage('/assets/sprites/siep-board.png'),
    loadImage('/assets/sprites/siep-cork.png'),
    loadImage('/assets/sprites/siep-mail.png'),
    loadImage('/assets/sprites/siep-reading.png'),
  ])

  // Flood-fill background removal — low threshold (6) for dark-suited characters
  cameronSittingTex = processSprite(camSitImg)
  siepTex = processSprite(siepImg, 0, 0, siepImg.naturalWidth, siepImg.naturalHeight, 6)
  guardTex = processSprite(guardImg, 0, 0, Math.floor(guardImg.naturalWidth * 0.42), guardImg.naturalHeight, 6)
  mansionTex = processSprite(mansionImg, 0, 0, mansionImg.naturalWidth, mansionImg.naturalHeight, 20)
  backgroundTex = processSprite(bgImg, 0, 0, bgImg.naturalWidth, bgImg.naturalHeight, 20)
  lolaStandingTex = processSprite(lolaStandImg)

  // Lola outfits: JS getDay() → 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  lolaOutfits.length = 0
  lolaOutfits.push(
    processSprite(lolaSunImg),   // 0 = Sunday (evening gown)
    processSprite(lolaMonImg),   // 1 = Monday (red — original)
    processSprite(lolaTueImg),   // 2 = Tuesday (black)
    processSprite(lolaWedImg),   // 3 = Wednesday (white)
    processSprite(lolaThuImg),   // 4 = Thursday (burgundy)
    processSprite(lolaFriImg),   // 5 = Friday (gold)
    processSprite(lolaSatImg),   // 6 = Saturday (blue)
  )

  // Siep walk: slice horizontal strip into 4 frames
  // Process without trimming first to find the UNION bounding box across all frames,
  // then trim all frames to the same size so he doesn't jump around
  siepWalkFrames.length = 0
  const fw = Math.floor(siepWalkImg.naturalWidth / 4)
  const fh = siepWalkImg.naturalHeight
  // Pass 1: find max bounds across all frames
  const frameBounds: { minX: number; maxX: number; minY: number; maxY: number }[] = []
  let unionMinX = fw, unionMaxX = 0, unionMinY = fh, unionMaxY = 0
  for (let i = 0; i < 4; i++) {
    const tmp = document.createElement('canvas')
    tmp.width = fw; tmp.height = fh
    const ctx = tmp.getContext('2d')!
    ctx.drawImage(siepWalkImg, i * fw, 0, fw, fh, 0, 0, fw, fh)
    const d = ctx.getImageData(0, 0, fw, fh).data
    let mnX = fw, mxX = 0, mnY = fh, mxY = 0
    for (let j = 0; j < d.length; j += 4) {
      if (d[j] + d[j+1] + d[j+2] >= 4) {
        const px = (j/4) % fw, py = Math.floor(j/4/fw)
        if (px < mnX) mnX = px; if (px > mxX) mxX = px
        if (py < mnY) mnY = py; if (py > mxY) mxY = py
      }
    }
    frameBounds.push({ minX: mnX, maxX: mxX, minY: mnY, maxY: mxY })
    if (mnX < unionMinX) unionMinX = mnX
    if (mxX > unionMaxX) unionMaxX = mxX
    if (mnY < unionMinY) unionMinY = mnY
    if (mxY > unionMaxY) unionMaxY = mxY
  }
  // Pass 2: crop all frames to the union bounding box
  const uw = unionMaxX - unionMinX + 1, uh = unionMaxY - unionMinY + 1
  for (let i = 0; i < 4; i++) {
    const tmp = document.createElement('canvas')
    tmp.width = fw; tmp.height = fh
    const ctx = tmp.getContext('2d')!
    ctx.drawImage(siepWalkImg, i * fw, 0, fw, fh, 0, 0, fw, fh)
    const imgData = ctx.getImageData(0, 0, fw, fh)
    const dd = imgData.data
    for (let j = 0; j < dd.length; j += 4) {
      if (dd[j] + dd[j+1] + dd[j+2] < 15) dd[j+3] = 0
    }
    ctx.putImageData(imgData, 0, 0)
    const out = document.createElement('canvas')
    out.width = uw; out.height = uh
    out.getContext('2d')!.drawImage(tmp, unionMinX, unionMinY, uw, uh, 0, 0, uw, uh)
    const tex = Texture.from(out)
    tex.source.scaleMode = 'nearest'
    siepWalkFrames.push(tex)
  }

  // Siep room poses (threshold 15)
  siepRoomPoses['office'] = processSprite(siepOfficeImg)
  siepRoomPoses['calendar'] = processSprite(siepBoardImg)
  siepRoomPoses['tasks'] = processSprite(siepCorkImg)
  siepRoomPoses['emails'] = processSprite(siepMailImg)
  siepRoomPoses['briefings'] = processSprite(siepReadImg)
}

export function getMansionTexture(): Texture { return mansionTex }
export function getBackgroundTexture(): Texture { return backgroundTex }
export function getSiepWalkFrames(): Texture[] { return siepWalkFrames }
export function getSiepRoomPose(roomId: string): Texture | null { return siepRoomPoses[roomId] || null }
export function getLolaStandingTexture(): Texture { return lolaStandingTex }

function charSprite(texture: Texture): Sprite {
  const s = new Sprite(texture)
  s.anchor.set(0.5, 1) // bottom-center (feet)
  s.scale.set(CHAR_HEIGHT / texture.height)
  return s
}

// === DRAW FUNCTIONS ===

export function drawCameron(container: Container) {
  container.addChild(charSprite(cameronSittingTex))
}

export function drawLola(container: Container, dayOfWeek: number) {
  const tex = lolaOutfits[dayOfWeek] || lolaOutfits[1] // fallback to Monday
  container.addChild(charSprite(tex))
}

export function drawSiep(container: Container) {
  container.addChild(charSprite(siepTex))
}

export function drawGuard(container: Container) {
  container.addChild(charSprite(guardTex))
}
