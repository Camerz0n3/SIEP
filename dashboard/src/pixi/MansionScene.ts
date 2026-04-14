import { Application, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js'
import { toIso, TILE_H } from './iso'
import { C } from './colors'
// Procedural textures/furniture replaced by mansion.png sprite
import { drawCameron, drawLola, drawSiep, drawGuard, loadCharacterTextures, getMansionTexture, getBackgroundTexture, getSiepRoomPose, getGuardLeftTexture, getLolaStandingTexture } from './characters'
import type { RoomId } from '../types'

interface RoomDef {
  id: RoomId; label: string; col: number; row: number; w: number; h: number;
  floorColor: number; floorType: 'wood' | 'carpet' | 'hallway' | 'marble'
}

// Bigger rooms for more detail space
const ROOMS: RoomDef[] = [
  { id: 'calendar', label: 'BOARD ROOM', col: 0, row: 0, w: 7, h: 5, floorColor: C.marbleMid, floorType: 'marble' },
  { id: 'tasks', label: 'CORK BOARD', col: 9, row: 0, w: 7, h: 5, floorColor: C.woodLight, floorType: 'wood' },
  { id: 'office', label: 'THE OFFICE', col: 3, row: 7, w: 9, h: 6, floorColor: C.carpet, floorType: 'carpet' },
  { id: 'emails', label: 'MAIL ROOM', col: 0, row: 15, w: 7, h: 5, floorColor: C.marbleMid, floorType: 'marble' },
  { id: 'briefings', label: 'READING ROOM', col: 9, row: 15, w: 7, h: 5, floorColor: C.carpetLight, floorType: 'carpet' },
]


function roomCenter(id: RoomId): { col: number; row: number } {
  const r = ROOMS.find(rm => rm.id === id)!
  return { col: r.col + r.w / 2, row: r.row + r.h / 2 }
}

const WALK_PATHS: Record<string, { col: number; row: number }[]> = {
  'office->calendar': [{ col: 5, row: 9 }, { col: 4, row: 7 }, { col: 4, row: 5 }, { col: 3, row: 3 }],
  'office->tasks': [{ col: 10, row: 9 }, { col: 13, row: 7 }, { col: 13, row: 5 }, { col: 12, row: 3 }],
  'office->emails': [{ col: 5, row: 12 }, { col: 4, row: 13 }, { col: 4, row: 15 }, { col: 3, row: 17 }],
  'office->briefings': [{ col: 10, row: 12 }, { col: 13, row: 13 }, { col: 13, row: 15 }, { col: 12, row: 17 }],
}

// Room labels removed — backdrop provides visuals
const BUBBLE_STYLE = new TextStyle({ fontFamily: '"DM Sans", sans-serif', fontSize: 7, fill: 0x8a8578, wordWrap: true, wordWrapWidth: 120 })

interface CharSprite { container: Container; col: number; row: number; phase: number }

export class MansionScene {
  private app: Application
  private mansion: Container
  private glowGraphics: Map<RoomId, Graphics> = new Map()
  private onRoomClick: (id: RoomId) => void = () => {}
  private destroyed = false

  private cameron!: CharSprite
  private lola!: CharSprite
  private siep!: CharSprite
  private guard1!: CharSprite
  private guard2!: CharSprite

  private siepTarget: { col: number; row: number }[] = []
  private siepWalking = false
  private siepSpeed = 0.03

  private bubbleContainer: Container | null = null
  private bubbleTimer = 0

  private smokeParticles: { g: Graphics; x: number; y: number; vx: number; vy: number; life: number; alpha: number }[] = []
  private lampGlows: Graphics[] = []
  private glowOverlays: { g: Graphics; char: CharSprite; color: number; offsetX: number; offsetY: number }[] = []
  private time = 0
  private lolaSmoking = false // Lola takes drags periodically
  private lolaSmokeCooldown = 0
  private lolaIdleAction: 'none' | 'phone' | 'hair' = 'none'
  private lolaIdleTimer = 12 // seconds until next idle action
  private lolaActionTimer = 0

  private guardLookTimer = 8 // seconds between head turns
  private guardLooking = false
  private guardLookDuration = 0

  // Lola hug: every ~5 min she walks to Cameron and back
  private lolaHugTimer = 120 + Math.random() * 180 // first hug in 2-5 min
  private lolaHugState: 'idle' | 'walking-to' | 'hugging' | 'walking-back' = 'idle'
  private lolaOrigCol = 0
  private lolaOrigRow = 0
  private lolaHugDuration = 0

  private fountainParticles: { g: Graphics; x: number; y: number; vy: number; life: number }[] = []
  private fireplaceParticles: { g: Graphics; x: number; y: number; vy: number; life: number }[] = []

  // Notification pulse state: room -> remaining seconds
  private pulsingRooms: Map<RoomId, number> = new Map()

  constructor(app: Application) {
    this.app = app
    this.mansion = new Container()
    this.app.stage.addChild(this.mansion)
  }

  async build(onRoomClick: (id: RoomId) => void) {
    this.onRoomClick = onRoomClick

    // Preload PNG sprite textures before creating characters
    await loadCharacterTextures()

    this.drawBackdrop()
    this.drawRooms()

    this.createCharacters()
    this.createAmbientEffects()
    this.centerMansion()
    // Room outlines disabled — backdrop images don't align with the grid
    // this.setActiveRoom('office')

    this.app.ticker.add(this.tick, this)

    setTimeout(() => {
      if (!this.destroyed) {
        const h = new Date().getHours()
        const greet = h < 12 ? 'Morning boss.' : h < 17 ? 'Afternoon boss.' : 'Evening boss.'
        this.showBubble(`${greet} Mansion's all yours.`, 4)
      }
    }, 1500)
  }

  // === ANIMATION LOOP ===

  private tick = () => {
    if (this.destroyed) return
    this.time += this.app.ticker.deltaMS / 1000

    const dt = this.app.ticker.deltaMS / 1000

    // === Character idle animations ===
    this.bob(this.cameron)
    this.bob(this.siep)
    this.bob(this.guard1)
    this.bob(this.guard2)

    // Lola: gentle seated sway + leg dangle (slower, smaller amplitude)
    this.lola.phase += 0.015
    const lolaPos = this.pctToPos(this.lola.col, this.lola.row)
    this.lola.container.position.set(
      lolaPos.x + Math.sin(this.lola.phase * 0.7) * 0.3,
      lolaPos.y - 6 + Math.sin(this.lola.phase) * 0.6
    )
    // Leg dangle: subtle rotation oscillation
    const sprite = this.lola.container.children[0]
    if (sprite) sprite.rotation = Math.sin(this.time * 1.5) * 0.015

    // Guards: periodic lean/sway
    this.guard1.phase += 0.008
    const g1Pos = this.pctToPos(this.guard1.col, this.guard1.row)
    this.guard1.container.position.set(g1Pos.x + Math.sin(this.guard1.phase) * 0.4, g1Pos.y + Math.sin(this.guard1.phase * 0.5) * 0.3)
    this.guard2.phase += 0.009
    const g2Pos = this.pctToPos(this.guard2.col, this.guard2.row)
    this.guard2.container.position.set(g2Pos.x + Math.sin(this.guard2.phase + 1) * 0.4, g2Pos.y + Math.sin(this.guard2.phase * 0.5 + 1) * 0.3)

    // Guards: periodic head turn (swap sprite to left-looking variant)
    this.guardLookTimer -= dt
    if (!this.guardLooking && this.guardLookTimer <= 0) {
      this.guardLooking = true
      this.guardLookDuration = 2 + Math.random()
      // Swap guard1 sprite to left-looking
      const guardLeftTex = getGuardLeftTexture()
      if (guardLeftTex && guardLeftTex.width > 1) {
        const gs = this.guard1.container.children[0] as Sprite
        if (gs) { gs.texture = guardLeftTex; gs.scale.set(48 / guardLeftTex.height) }
      }
    }
    if (this.guardLooking) {
      this.guardLookDuration -= dt
      if (this.guardLookDuration <= 0) {
        this.guardLooking = false
        this.guardLookTimer = 8 + Math.random() * 7
        // Swap back to forward-facing
        const container = this.guard1.container
        if (container.children.length > 0) {
          const old = container.children[0]
          container.removeChildAt(0)
          old.destroy()
        }
        drawGuard(container)
      }
    }

    // === Glow overlays: pulse ===
    for (const ov of this.glowOverlays) {
      ov.g.alpha = 0.25 + Math.sin(this.time * 3 + (ov.color === 0x50b0f0 ? 0 : 1.5)) * 0.2
      ov.g.scale.set(0.9 + Math.sin(this.time * 4) * 0.15)
    }

    // === Siep walk (clean slide — walk frame animation disabled for now) ===
    if (this.siepWalking && this.siepTarget.length > 0) {
      this.moveSiep()
    }

    // === Smoke: Cameron's cigar (constant) + Lola's cigarette (periodic drags) ===
    this.updateSmoke()
    this.updateLolaSmoke(dt)

    // === Lola idle actions (phone, hair) + hug ===
    this.updateLolaHug(dt)
    if (this.lolaHugState === 'idle') this.updateLolaIdle(dt)

    // === Fountain water particles ===
    this.updateFountain(dt)

    // === Fireplace in Reading Room ===
    this.updateFireplace(dt)

    // Lamp pulse
    for (const l of this.lampGlows) l.alpha = 0.3 + Math.sin(this.time * 2) * 0.1

    // Bubble timer
    if (this.bubbleContainer && this.bubbleTimer > 0) {
      this.bubbleTimer -= this.app.ticker.deltaMS / 1000
      if (this.bubbleTimer <= 0) this.dismissBubble()
    }

    // Room notification pulse
    for (const [roomId, remaining] of this.pulsingRooms) {
      const left = remaining - dt
      if (left <= 0) {
        this.pulsingRooms.delete(roomId)
        // Restore to normal state
        const glow = this.glowGraphics.get(roomId)
        const room = ROOMS.find(r => r.id === roomId)!
        if (glow) this.drawRoomOutline(glow, room, 0x000000, 0)
      } else {
        this.pulsingRooms.set(roomId, left)
        const glow = this.glowGraphics.get(roomId)
        const room = ROOMS.find(r => r.id === roomId)!
        // Pulsing glow — sinusoidal alpha between 0.3 and 1.0
        const pulse = 0.5 + Math.sin(this.time * 6) * 0.5
        if (glow) this.drawRoomOutline(glow, room, 0xe8c96e, 0.3 + pulse * 0.7)
      }
    }
  }

  private bob(c: CharSprite) {
    c.phase += 0.02
    const pos = this.pctToPos(c.col, c.row)
    c.container.position.set(pos.x, pos.y + Math.sin(c.phase) * 1.2)
  }

  // === SIEP WALKING ===

  walkSiepTo(roomId: RoomId) {
    this.siepCurrentRoom = roomId
    const pathKey = `office->${roomId}`
    const path = WALK_PATHS[pathKey]
    if (!path || roomId === 'office') {
      const oc = roomCenter('office')
      this.siepTarget = [{ col: oc.col + 1, row: oc.row + 1 }]
    } else {
      this.siepTarget = [...path]
    }
    this.siepWalking = true
  }

  private moveSiep() {
    if (this.siepTarget.length === 0) { this.siepWalking = false; return }
    const t = this.siepTarget[0]
    const dx = t.col - this.siep.col
    const dy = t.row - this.siep.row
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 0.1) {
      this.siep.col = t.col; this.siep.row = t.row
      this.siepTarget.shift()
      if (this.siepTarget.length === 0) {
        this.siepWalking = false
        // Reset to idle sprite
        this.resetSiepSprite()
        // 1-in-30 chance: Siep stumbles on arrival
        if (Math.random() < 0.033) {
          const sprite = this.siep.container.children[0]
          if (sprite) {
            sprite.rotation = 0.15
            setTimeout(() => { if (sprite && !sprite.destroyed) sprite.rotation = -0.08 }, 200)
            setTimeout(() => { if (sprite && !sprite.destroyed) sprite.rotation = 0 }, 500)
          }
        }
      }
      return
    }
    const speed = this.siepSpeed * this.app.ticker.deltaMS / 16
    this.siep.col += (dx / dist) * speed
    this.siep.row += (dy / dist) * speed
  }

  private siepCurrentRoom: RoomId = 'office'

  private resetSiepSprite() {
    const container = this.siep.container
    // Remove the main sprite (index 0), keep glow overlays
    if (container.children.length > 0) {
      const oldSprite = container.children[0]
      container.removeChildAt(0)
      oldSprite.destroy()
    }
    // Use room-specific pose if available, otherwise default
    const roomPose = getSiepRoomPose(this.siepCurrentRoom)
    if (roomPose && roomPose.width > 1) {
      const s = new Sprite(roomPose)
      s.anchor.set(0.5, 1)
      s.scale.set(48 / roomPose.height)
      container.addChildAt(s, 0)
    } else {
      drawSiep(container)
    }
  }

  // === SPEECH BUBBLES ===

  showBubble(text: string, duration = 5) {
    this.dismissBubble()
    const bubble = new Container()
    const bg = new Graphics()
    const txt = new Text({ text, style: BUBBLE_STYLE })
    txt.position.set(8, 6)
    const w = Math.min(txt.width + 16, 140)
    const h = txt.height + 12
    bg.fill({ color: 0x1e1a14 })
    bg.stroke({ color: C.blueCold, width: 1 })
    bg.roundRect(0, 0, w, h, 4)
    bg.fill()
    bg.stroke()
    bg.fill({ color: 0x1e1a14 })
    bg.moveTo(w / 2 - 4, h)
    bg.lineTo(w / 2, h + 5)
    bg.lineTo(w / 2 + 4, h)
    bg.closePath()
    bg.fill()
    bubble.addChild(bg, txt)
    bubble.position.set(-w / 2, -40)
    this.siep.container.addChild(bubble)
    this.bubbleContainer = bubble
    this.bubbleTimer = duration
  }

  private dismissBubble() {
    if (this.bubbleContainer) { this.bubbleContainer.destroy({ children: true }); this.bubbleContainer = null }
  }

  // === AMBIENT ===

  private createAmbientEffects() {
    const officeWin = toIso(6, 5)
    const lg1 = new Graphics()
    lg1.fill({ color: C.lampGlow, alpha: 0.3 })
    lg1.circle(officeWin.x, officeWin.y - 20, 20)
    lg1.fill()
    this.mansion.addChild(lg1)
    this.lampGlows.push(lg1)

    const readLamp = toIso(10.5, 12.5)
    const lg2 = new Graphics()
    lg2.fill({ color: C.lampGlow, alpha: 0.2 })
    lg2.circle(readLamp.x, readLamp.y - 15, 14)
    lg2.fill()
    this.mansion.addChild(lg2)
    this.lampGlows.push(lg2)
  }

  private updateSmoke() {
    if (Math.random() < 0.025) {
      const pos = this.pctToPos(this.cameron.col, this.cameron.row)
      const p = new Graphics()
      p.fill({ color: 0xb4aa9b, alpha: 0.12 })
      p.circle(0, 0, 1 + Math.random() * 2)
      p.fill()
      p.position.set(pos.x + 8 + (Math.random() - 0.5) * 3, pos.y - 26)
      this.mansion.addChild(p)
      this.smokeParticles.push({
        g: p, x: p.x, y: p.y,
        vx: 0.1 + Math.random() * 0.2, vy: -0.3 - Math.random() * 0.3,
        life: 3 + Math.random() * 2, alpha: 0.12,
      })
    }
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const s = this.smokeParticles[i]
      s.life -= this.app.ticker.deltaMS / 1000
      s.x += s.vx; s.y += s.vy; s.alpha *= 0.993
      s.g.position.set(s.x, s.y)
      s.g.alpha = s.alpha
      if (s.life <= 0) { s.g.destroy(); this.smokeParticles.splice(i, 1) }
    }
  }

  // Lola takes a drag every 8-15 seconds, puffs smoke for ~2 seconds
  private updateLolaSmoke(dt: number) {
    this.lolaSmokeCooldown -= dt
    if (this.lolaSmokeCooldown <= 0 && !this.lolaSmoking) {
      this.lolaSmoking = true
      this.lolaSmokeCooldown = 2 // puff duration
    }
    if (this.lolaSmoking) {
      if (this.lolaSmokeCooldown <= 0) {
        this.lolaSmoking = false
        this.lolaSmokeCooldown = 8 + Math.random() * 7 // next drag in 8-15s
        return
      }
      // Emit smoke from Lola's cigarette hand (left hand, offset from center)
      if (Math.random() < 0.06) {
        const pos = this.pctToPos(this.lola.col, this.lola.row)
        const p = new Graphics()
        p.fill({ color: 0xc0b8a8, alpha: 0.10 })
        p.circle(0, 0, 1 + Math.random() * 1.5)
        p.fill()
        p.position.set(pos.x - 6 + (Math.random() - 0.5) * 2, pos.y - 28)
        this.mansion.addChild(p)
        this.smokeParticles.push({
          g: p, x: p.x, y: p.y,
          vx: -0.1 - Math.random() * 0.15, vy: -0.25 - Math.random() * 0.25,
          life: 2.5 + Math.random() * 1.5, alpha: 0.10,
        })
      }
    }
  }

  // Lola blows a kiss — heart particles float up
  private lolaBlowKiss() {
    const pos = this.pctToPos(this.lola.col, this.lola.row)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (this.destroyed) return
        const heart = new Text({ text: '\u{2764}', style: { fontSize: 6 + Math.random() * 4, fill: 0xd84050 } })
        heart.anchor.set(0.5)
        heart.position.set(pos.x + (Math.random() - 0.5) * 10, pos.y - 30)
        this.mansion.addChild(heart)
        const startY = heart.y
        const vx = (Math.random() - 0.5) * 0.4
        const dur = 2000 + Math.random() * 1000
        const start = Date.now()
        const animate = () => {
          if (this.destroyed) { heart.destroy(); return }
          const elapsed = Date.now() - start
          const t = elapsed / dur
          if (t >= 1) { heart.destroy(); return }
          heart.y = startY - t * 30
          heart.x += vx
          heart.alpha = 1 - t * t
          heart.rotation = Math.sin(t * 6) * 0.2
          requestAnimationFrame(animate)
        }
        animate()
      }, i * 150)
    }
  }

  // Lola hug: periodically walks to Cameron, hugs, walks back
  private updateLolaHug(dt: number) {
    if (this.lolaHugState === 'idle') {
      this.lolaHugTimer -= dt
      if (this.lolaHugTimer <= 0) {
        // Start hug sequence — swap to standing sprite
        this.lolaHugState = 'walking-to'
        this.lolaOrigCol = this.lola.col
        this.lolaOrigRow = this.lola.row
        const standTex = getLolaStandingTexture()
        if (standTex && standTex.width > 1) {
          const s = this.lola.container.children[0] as Sprite
          if (s) { s.texture = standTex; s.scale.set(48 / standTex.height); s.rotation = 0 }
        }
      }
      return
    }

    const speed = 0.02 * this.app.ticker.deltaMS / 16

    if (this.lolaHugState === 'walking-to') {
      const dx = this.cameron.col - this.lola.col
      const dy = this.cameron.row - this.lola.row
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 0.01) {
        this.lolaHugState = 'hugging'
        this.lolaHugDuration = 3 + Math.random() * 2
        this.lolaBlowKiss()
        return
      }
      this.lola.col += (dx / dist) * speed * 0.3
      this.lola.row += (dy / dist) * speed * 0.3
      const pos = this.pctToPos(this.lola.col, this.lola.row)
      this.lola.container.position.set(pos.x, pos.y)
    }

    if (this.lolaHugState === 'hugging') {
      this.lolaHugDuration -= dt
      const pos = this.pctToPos(this.lola.col, this.lola.row)
      this.lola.container.position.set(pos.x + Math.sin(this.time * 2) * 0.5, pos.y)
      if (this.lolaHugDuration <= 0) {
        this.lolaHugState = 'walking-back'
      }
    }

    if (this.lolaHugState === 'walking-back') {
      const dx = this.lolaOrigCol - this.lola.col
      const dy = this.lolaOrigRow - this.lola.row
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 0.01) {
        // Arrived back — swap to sitting sprite
        this.lola.col = this.lolaOrigCol
        this.lola.row = this.lolaOrigRow
        this.lolaHugState = 'idle'
        this.lolaHugTimer = 240 + Math.random() * 120 // next hug in 4-6 min
        // Rebuild sitting sprite
        const container = this.lola.container
        if (container.children.length > 0) {
          const old = container.children[0]
          container.removeChildAt(0)
          old.destroy()
        }
        drawLola(container, new Date().getDay())
        return
      }
      this.lola.col += (dx / dist) * speed * 0.3
      this.lola.row += (dy / dist) * speed * 0.3
      const pos = this.pctToPos(this.lola.col, this.lola.row)
      this.lola.container.position.set(pos.x, pos.y)
    }
  }

  // Lola idle actions: checks phone or fixes hair every 12-25 seconds
  private updateLolaIdle(dt: number) {
    if (this.lolaIdleAction !== 'none') {
      this.lolaActionTimer -= dt
      const sprite = this.lola.container.children[0]
      if (this.lolaIdleAction === 'phone') {
        // Phone: slight tilt + glow on face
        if (sprite) sprite.rotation = -0.03
      } else if (this.lolaIdleAction === 'hair') {
        // Hair: slight opposite tilt
        if (sprite) sprite.rotation = 0.04
      }
      if (this.lolaActionTimer <= 0) {
        if (sprite) sprite.rotation = 0
        this.lolaIdleAction = 'none'
        this.lolaIdleTimer = 12 + Math.random() * 13
      }
      return
    }
    this.lolaIdleTimer -= dt
    if (this.lolaIdleTimer <= 0) {
      this.lolaIdleAction = Math.random() < 0.5 ? 'phone' : 'hair'
      this.lolaActionTimer = 2 + Math.random() * 1.5 // action lasts 2-3.5s
    }
  }

  // Fountain: water droplets rising from courtyard center
  private updateFountain(_dt: number) {
    // Fountain is roughly at grid (8, 18) based on the background image
    const fPos = toIso(8, 18.5)
    if (Math.random() < 0.08) {
      const p = new Graphics()
      const blue = 0x60a0c0
      p.fill({ color: blue, alpha: 0.25 })
      p.circle(0, 0, 0.8 + Math.random())
      p.fill()
      const xOff = (Math.random() - 0.5) * 8
      p.position.set(fPos.x + xOff, fPos.y - 8)
      this.mansion.addChild(p)
      this.fountainParticles.push({
        g: p, x: p.x, y: p.y,
        vy: -0.4 - Math.random() * 0.3,
        life: 1.5 + Math.random(),
      })
    }
    for (let i = this.fountainParticles.length - 1; i >= 0; i--) {
      const f = this.fountainParticles[i]
      f.life -= this.app.ticker.deltaMS / 1000
      f.y += f.vy
      f.vy += 0.02 // gravity
      f.g.position.set(f.x, f.y)
      f.g.alpha = Math.max(0, f.life * 0.15)
      if (f.life <= 0) { f.g.destroy(); this.fountainParticles.splice(i, 1) }
    }
  }

  // Fireplace: warm orange flicker particles in the Reading Room
  private updateFireplace(_dt: number) {
    // Reading Room: col 9, row 15, armchair area ~(11, 17)
    const fpPos = toIso(10.5, 16)
    if (Math.random() < 0.04) {
      const p = new Graphics()
      const colors = [0xf0a040, 0xe08020, 0xd06010, 0xf0c060]
      const col = colors[Math.floor(Math.random() * colors.length)]
      p.fill({ color: col, alpha: 0.15 })
      p.circle(0, 0, 0.6 + Math.random() * 0.8)
      p.fill()
      p.position.set(fpPos.x + (Math.random() - 0.5) * 5, fpPos.y - 4)
      this.mansion.addChild(p)
      this.fireplaceParticles.push({
        g: p, x: p.x, y: p.y,
        vy: -0.2 - Math.random() * 0.2,
        life: 1.5 + Math.random(),
      })
    }
    for (let i = this.fireplaceParticles.length - 1; i >= 0; i--) {
      const f = this.fireplaceParticles[i]
      f.life -= this.app.ticker.deltaMS / 1000
      f.y += f.vy
      f.x += (Math.random() - 0.5) * 0.3
      f.g.position.set(f.x, f.y)
      f.g.alpha = Math.max(0, f.life * 0.1)
      if (f.life <= 0) { f.g.destroy(); this.fireplaceParticles.splice(i, 1) }
    }
  }

  // === DRAWING ===

  // Reference to backdrop sprite for relative positioning
  private backdropRef: { x: number; y: number; scaleX: number; w: number; h: number } = { x: 0, y: 0, scaleX: 1, w: 1, h: 1 }

  private createCharacters() {
    // Positions as percentages of the backdrop image (0,0 = top-left, 1,1 = bottom-right)
    // Cameron in boss chair — upper-left room, at the desk/chair
    this.cameron = this.placeChar(0.38, 0.32, drawCameron)
    // Lola on the desk — slightly right and forward of Cameron
    this.lola = this.placeChar(0.42, 0.35, (c) => drawLola(c, new Date().getDay()), -6)
    // Siep in the center hallway — standing on the checkered floor
    this.siep = this.placeChar(0.50, 0.50, drawSiep)
    // Guards at the bottom entrance
    this.guard1 = this.placeChar(0.42, 0.82, drawGuard)
    this.guard2 = this.placeChar(0.48, 0.82, drawGuard)

    // Glow overlays
    this.addGlowOverlay(this.cameron, 0xf09030, 8, -24, 2.5)
    this.addGlowOverlay(this.siep, 0x50b0f0, 0, -18, 3)

    // Lola click → blow kiss
    this.lola.container.eventMode = 'static'
    this.lola.container.cursor = 'pointer'
    this.lola.container.on('pointerdown', () => this.lolaBlowKiss())
  }

  // Place a character using percentage coordinates relative to the backdrop image
  private placeChar(pctX: number, pctY: number, draw: (c: Container) => void, yOffset = 0): CharSprite {
    const b = this.backdropRef
    const container = new Container()
    draw(container)
    // Convert percentage to backdrop pixel position
    const x = b.x + (pctX - 0.5) * b.w * b.scaleX
    const y = b.y + (pctY - 0.5) * b.h * b.scaleX + yOffset
    container.position.set(x, y)
    this.mansion.addChild(container)
    // Store the percentage for animations (col=pctX, row=pctY)
    return { container, col: pctX, row: pctY, phase: Math.random() * Math.PI * 2 }
  }

  // Convert percentage position to screen position (for animations)
  private pctToPos(pctX: number, pctY: number): { x: number; y: number } {
    const b = this.backdropRef
    return {
      x: b.x + (pctX - 0.5) * b.w * b.scaleX,
      y: b.y + (pctY - 0.5) * b.h * b.scaleX,
    }
  }

  private addGlowOverlay(char: CharSprite, color: number, offsetX: number, offsetY: number, radius = 3) {
    const g = new Graphics()
    g.fill({ color, alpha: 0.4 })
    g.circle(0, 0, radius)
    g.fill()
    char.container.addChild(g)
    g.position.set(offsetX, offsetY)
    this.glowOverlays.push({ g, char, color, offsetX, offsetY })
  }

  private drawBackdrop() {
    // Background sprite: full estate aerial (grounds, mansion, car, trees, city skyline)
    const bgTex = getBackgroundTexture()
    if (bgTex && bgTex.width > 1) {
      const bg = new Sprite(bgTex)
      bg.anchor.set(0.5, 0.5)
      // Center on the grid — the estate covers col -2..18, row -2..24
      const center = toIso(8, 11)
      bg.position.set(center.x, center.y)
      // Scale so the background covers the full estate width (~22 tiles diagonal)
      const targetW = 22 * 32
      bg.scale.set(targetW / bgTex.width)
      this.mansion.addChild(bg)
    }

    // Mansion interior sprite layered on top for room detail
    const mTex = getMansionTexture()
    if (mTex && mTex.width > 1) {
      const ms = new Sprite(mTex)
      ms.anchor.set(0.5, 0.5)
      const gridCenter = toIso(8, 10)
      ms.position.set(gridCenter.x, gridCenter.y - TILE_H)
      const targetW = 18 * 32
      ms.scale.set(targetW / mTex.width)
      ms.alpha = 0.85
      this.mansion.addChild(ms)
    }

    // Save backdrop reference for character positioning (use background sprite dims)
    if (bgTex && bgTex.width > 1) {
      const center = toIso(8, 11)
      const s = (22 * 32) / bgTex.width
      this.backdropRef = { x: center.x, y: center.y, scaleX: s, w: bgTex.width, h: bgTex.height }
    }
  }

  private drawRooms() {
    for (const room of ROOMS) {
      const container = new Container()
      container.eventMode = 'static'
      container.cursor = 'pointer'
      container.on('pointerdown', () => this.onRoomClick(room.id))

      // Invisible hit area covering the room
      const hit = new Graphics()
      const corners = [
        toIso(room.col, room.row), toIso(room.col + room.w, room.row),
        toIso(room.col + room.w, room.row + room.h), toIso(room.col, room.row + room.h),
      ]
      hit.fill({ color: 0x000000, alpha: 0.001 })
      hit.moveTo(corners[0].x, corners[0].y - TILE_H / 2)
      for (let i = 1; i < corners.length; i++) hit.lineTo(corners[i].x, corners[i].y - TILE_H / 2)
      hit.closePath()
      hit.fill()
      container.addChild(hit)

      // Labels and glow outlines disabled — backdrop images provide the visuals

      this.mansion.addChild(container)
    }
  }

  private drawRoomOutline(g: Graphics, room: RoomDef, color: number, alpha: number) {
    g.clear()
    if (alpha === 0) return
    const p = [
      toIso(room.col, room.row), toIso(room.col + room.w, room.row),
      toIso(room.col + room.w, room.row + room.h), toIso(room.col, room.row + room.h),
    ].map(pt => ({ x: pt.x, y: pt.y - TILE_H / 2 }))
    g.stroke({ color, width: 2, alpha })
    g.moveTo(p[0].x, p[0].y)
    for (let i = 1; i < p.length; i++) g.lineTo(p[i].x, p[i].y)
    g.closePath()
    g.stroke()
  }

  // === PUBLIC ===

  setActiveRoom(id: RoomId) {
    for (const [roomId, glow] of this.glowGraphics) {
      const room = ROOMS.find(r => r.id === roomId)!
      const isPulsing = this.pulsingRooms.has(roomId)
      if (!isPulsing) {
        this.drawRoomOutline(glow, room, roomId === id ? C.gold : 0x000000, roomId === id ? 0.8 : 0)
      }
    }
  }

  // Pulse a room border for a few seconds (called on new data notification)
  pulseRoom(roomId: RoomId, duration = 4) {
    this.pulsingRooms.set(roomId, duration)
  }

  // Convenience: show bubble + pulse combo for notification events
  notify(message: string, roomId?: RoomId) {
    this.showBubble(message, 5)
    if (roomId) this.pulseRoom(roomId)
  }

  private centerMansion() {
    this.mansion.scale.set(1)
    this.mansion.position.set(0, 0)
    const bounds = this.mansion.getBounds()
    const pad = 30
    const scale = Math.min(this.app.screen.width / (bounds.width + pad * 2), this.app.screen.height / (bounds.height + pad * 2), 3)
    this.mansion.scale.set(scale)
    const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2
    this.mansion.position.set(this.app.screen.width / 2 - cx * scale, this.app.screen.height / 2 - cy * scale)
  }

  resize() { this.centerMansion() }

  destroy() {
    this.destroyed = true
    this.app.ticker.remove(this.tick, this)
    for (const p of this.smokeParticles) p.g.destroy()
    for (const p of this.fountainParticles) p.g.destroy()
    for (const p of this.fireplaceParticles) p.g.destroy()
    this.smokeParticles = []
    this.fountainParticles = []
    this.fireplaceParticles = []
    this.dismissBubble()
    this.app.stage.removeChild(this.mansion)
    this.mansion.destroy({ children: true })
  }
}
