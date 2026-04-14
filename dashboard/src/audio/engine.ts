// Audio engine — synthesized retro SFX via Web Audio API
// No external deps. All sounds are procedurally generated.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let _muted = localStorage.getItem('mansion-muted') === 'true'

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = _muted ? 0 : 0.35
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function gain(): GainNode {
  getCtx()
  return masterGain!
}

// === PUBLIC API ===

export function isMuted(): boolean { return _muted }

export function setMuted(m: boolean) {
  _muted = m
  localStorage.setItem('mansion-muted', String(m))
  if (masterGain) masterGain.gain.setTargetAtTime(m ? 0 : 0.35, getCtx().currentTime, 0.1)
}

export function toggleMute(): boolean {
  setMuted(!_muted)
  return _muted
}

// === SYNTHESIZED SFX ===

// Short beep/chime for notifications
export function playNotificationChime() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ac.currentTime)
  osc.frequency.setValueAtTime(1100, ac.currentTime + 0.08)
  osc.frequency.setValueAtTime(1320, ac.currentTime + 0.16)
  g.gain.setValueAtTime(0.15, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4)
  osc.connect(g).connect(gain())
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.4)
}

// Typewriter ding — classic bell sound
export function playTypewriterDing() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = 2200
  g.gain.setValueAtTime(0.2, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6)
  osc.connect(g).connect(gain())
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.6)
}

// Cash register — task completion ka-ching
export function playCashRegister() {
  const ac = getCtx()
  const t = ac.currentTime
  // Metallic strike
  const osc1 = ac.createOscillator()
  const g1 = ac.createGain()
  osc1.type = 'square'
  osc1.frequency.setValueAtTime(1800, t)
  osc1.frequency.exponentialRampToValueAtTime(600, t + 0.15)
  g1.gain.setValueAtTime(0.12, t)
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc1.connect(g1).connect(gain())
  osc1.start(t)
  osc1.stop(t + 0.2)
  // Bell ring
  const osc2 = ac.createOscillator()
  const g2 = ac.createGain()
  osc2.type = 'sine'
  osc2.frequency.value = 3200
  g2.gain.setValueAtTime(0.1, t + 0.05)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
  osc2.connect(g2).connect(gain())
  osc2.start(t + 0.05)
  osc2.stop(t + 0.5)
}

// Door swoosh — room enter/exit
export function playDoorOpen() {
  const ac = getCtx()
  const t = ac.currentTime
  // Noise burst filtered to sound like a swoosh
  const bufSize = ac.sampleRate * 0.3
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
  const src = ac.createBufferSource()
  src.buffer = buf
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(800, t)
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.25)
  filter.Q.value = 2
  const g = ac.createGain()
  g.gain.setValueAtTime(0.15, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  src.connect(filter).connect(g).connect(gain())
  src.start(t)
  src.stop(t + 0.3)
}

// Soft click — UI interaction
export function playClick() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = 600
  g.gain.setValueAtTime(0.08, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06)
  osc.connect(g).connect(gain())
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.06)
}

// Footstep — soft tap
export function playFootstep() {
  const ac = getCtx()
  const t = ac.currentTime
  const bufSize = ac.sampleRate * 0.08
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15
  const src = ac.createBufferSource()
  src.buffer = buf
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 400
  const g = ac.createGain()
  g.gain.setValueAtTime(0.06, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  src.connect(filter).connect(g).connect(gain())
  src.start(t)
  src.stop(t + 0.08)
}

// Message sent whoosh
export function playSendMessage() {
  const ac = getCtx()
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, t)
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.12)
  g.gain.setValueAtTime(0.1, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  osc.connect(g).connect(gain())
  osc.start(t)
  osc.stop(t + 0.15)
}

// Message received — descending tone
export function playReceiveMessage() {
  const ac = getCtx()
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(700, t)
  osc.frequency.setValueAtTime(500, t + 0.1)
  g.gain.setValueAtTime(0.08, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  osc.connect(g).connect(gain())
  osc.start(t)
  osc.stop(t + 0.25)
}

// === AMBIENT BACKGROUND ===

let ambientInterval: ReturnType<typeof setInterval> | null = null

// Subtle ambient room tone — very quiet background hum
export function startAmbient() {
  if (ambientInterval) return
  // Periodic soft atmospheric ticks (clock-like)
  ambientInterval = setInterval(() => {
    if (_muted) return
    const ac = getCtx()
    const t = ac.currentTime
    // Soft tick
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1000 + Math.random() * 200
    g.gain.setValueAtTime(0.008, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
    osc.connect(g).connect(gain())
    osc.start(t)
    osc.stop(t + 0.03)
  }, 2000 + Math.random() * 3000)
}

export function stopAmbient() {
  if (ambientInterval) { clearInterval(ambientInterval); ambientInterval = null }
}
