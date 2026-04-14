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

// Remove near-black pixels (background), then trim to tight bounding box
function processSprite(
  img: HTMLImageElement,
  cropX = 0,
  cropY = 0,
  cropW = img.naturalWidth,
  cropH = img.naturalHeight,
  threshold = 30,
): Texture {
  const tmp = document.createElement('canvas')
  tmp.width = cropW
  tmp.height = cropH
  const ctx = tmp.getContext('2d')!
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

  const imgData = ctx.getImageData(0, 0, cropW, cropH)
  const d = imgData.data
  let minX = cropW, maxX = 0, minY = cropH, maxY = 0
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] + d[i + 1] + d[i + 2] < threshold) {
      d[i + 3] = 0
    } else {
      const px = (i / 4) % cropW
      const py = Math.floor(i / 4 / cropW)
      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
    }
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

let cameronTex: Texture
let siepTex: Texture
let guardTex: Texture
let guardLeftTex: Texture
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
    camImg, siepImg, guardImg, guardLeftImg, mansionImg, bgImg,
    lolaMonImg, lolaTueImg, lolaWedImg, lolaThuImg, lolaFriImg, lolaSatImg, lolaSunImg,
    lolaStandImg,
    siepWalkImg, siepOfficeImg, siepBoardImg, siepCorkImg, siepMailImg, siepReadImg,
  ] = await Promise.all([
    loadImage('/assets/sprites/cameron.png'),
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

  cameronTex = processSprite(camImg)
  siepTex = processSprite(siepImg)
  guardTex = processSprite(guardImg, 0, 0, Math.floor(guardImg.naturalWidth / 2), guardImg.naturalHeight)
  guardLeftTex = processSprite(guardLeftImg)
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

  // Siep walk: slice horizontal strip into 4 equal frames
  siepWalkFrames.length = 0
  const fw = Math.floor(siepWalkImg.naturalWidth / 4)
  const fh = siepWalkImg.naturalHeight
  for (let i = 0; i < 4; i++) {
    siepWalkFrames.push(processSprite(siepWalkImg, i * fw, 0, fw, fh))
  }

  // Siep room poses
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
export function getGuardLeftTexture(): Texture { return guardLeftTex }

function charSprite(texture: Texture): Sprite {
  const s = new Sprite(texture)
  s.anchor.set(0.5, 1) // bottom-center (feet)
  s.scale.set(CHAR_HEIGHT / texture.height)
  return s
}

// === DRAW FUNCTIONS ===

export function drawCameron(container: Container) {
  container.addChild(charSprite(cameronTex))
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
