import { Container } from 'pixi.js'
import { createPixelSprite, _, h } from './spriteGen'
import { toIso, TILE_H } from './iso'
import { C } from './colors'

// Furniture as texture-based sprites placed on the isometric floor
// Each item is a pixel art grid rendered as a crisp Sprite

// Colors
const wd = h(C.deskDark)
const wm = h(C.deskMid)
const wl = h(C.deskLight)
const lt = h(C.leather)
const l2 = h(C.leatherLight)
const ch = h(C.chrome)
const c2 = h(C.chromeDark)
const pp = h(C.paper)
const p2 = '#d4cfc4'
const wh = '#e8e8e8'
const bl = '#5090c0'
const gd = h(C.gold)
const rd = h(C.redTie)
const wk = h(C.whisky)
const w3 = '#8a5020'
const en = h(C.envelope)
const cb = h(C.corkboard)
const gl = '#b0a058'
const wn = h(C.windowNight)
const bk = '#1a1a1a'
const gn = h(C.greenBright)
const bc = h(C.blueCold)

function placeFurniture(container: Container, col: number, row: number, grid: (string | null)[][], scale = 1) {
  const sprite = createPixelSprite(grid, scale)
  const { x, y } = toIso(col, row)
  sprite.position.set(x, y - TILE_H / 2)
  container.addChild(sprite)
}

export function drawAllFurniture(container: Container) {
  // ===== THE OFFICE =====
  placeFurniture(container, 7, 10, [
    [wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm],
    [wd,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wm,wd],
    [wd,wm,wl,wl,wl,wl,wl,wm,wm,wl,wl,wl,wl,wl,wm,wd],
    [wd,wm,wl,wd,wd,wd,wl,wm,wm,wl,wd,wd,wd,wl,wm,wd],
    [wd,wm,wl,wd,gd,wd,wl,wm,wm,wl,wd,gd,wd,wl,wm,wd],
    [wd,wm,wl,wd,wd,wd,wl,wm,wm,wl,wd,wd,wd,wl,wm,wd],
    [wd,wm,wl,wl,wl,wl,wl,wm,wm,wl,wl,wl,wl,wl,wm,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
  ])
  // Laptop
  placeFurniture(container, 7.5, 9.5, [
    [bk,bl,bl,bl,bl,bl,bk],
    [bk,bl,'#70a8d0',bl,bl,bl,bk],
    [bk,bl,bl,bl,bl,bl,bk],
    [_,bk,bk,bk,bk,bk,_],
    [bk,c2,c2,c2,c2,c2,bk],
    [bk,bk,bk,bk,bk,bk,bk],
  ])
  // Whisky cabinet + bottle + glass
  placeFurniture(container, 10.5, 8, [
    [wd,wd,wd,wd,wd,wd,wd,wd],
    [wd,wm,wm,wm,wm,wm,wm,wd],
    [wd,wm,wl,wm,wm,wl,wm,wd],
    [wd,wm,wm,wm,wm,wm,wm,wd],
    [wd,wm,wl,wm,wm,wl,wm,wd],
    [wd,wm,wm,wm,wm,wm,wm,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd],
  ])
  placeFurniture(container, 10.3, 7.6, [
    [_,wk,_,_,_],
    [_,wk,_,_,_],
    [w3,wk,w3,_,_],
    [w3,wk,w3,gl,gl],
    [w3,wk,w3,gl,wk],
  ])
  // Ashtray
  placeFurniture(container, 8.5, 9.5, [
    [c2,c2,c2,c2,c2],
    [c2,'#5a5a5a','#5a5a5a','#5a5a5a',c2],
    [_,c2,c2,c2,_],
  ])
  // Tommy gun
  placeFurniture(container, 11, 7.3, [
    [_,_,bk,bk,bk,bk,bk,bk,bk,bk,bk,_,_],
    [_,wd,wd,bk,bk,c2,bk,bk,bk,_,_,_,_],
    [wd,wd,_,_,bk,bk,_,_,_,_,_,_,_],
  ])
  // Coffee machine
  placeFurniture(container, 4, 12, [
    [c2,c2,c2,c2,c2],
    [c2,bk,bk,bk,c2],
    [c2,bk,rd,bk,c2],
    [c2,bk,bk,bk,c2],
    [c2,c2,c2,c2,c2],
    [_,c2,_,c2,_],
  ])
  // Bookshelf
  placeFurniture(container, 3.5, 8.5, [
    [wd,wd,wd,wd,wd,wd],
    [wd,rd,gd,bc,wk,wd],
    [wd,rd,gd,bc,wk,wd],
    [wd,wd,wd,wd,wd,wd],
    [wd,wk,bk,wk,rd,wd],
    [wd,wk,bk,wk,rd,wd],
    [wd,wd,wd,wd,wd,wd],
    [wd,gd,wd,bk,gd,wd],
    [wd,gd,wd,bk,gd,wd],
    [wd,wd,wd,wd,wd,wd],
  ])
  // Window
  placeFurniture(container, 7, 7.1, [
    [gd,wn,wn,wn,gd,wn,wn,wn,gd],
    [gd,wn,wn,wn,gd,wn,wn,wn,gd],
    [gd,wn,wn,wn,gd,wn,wn,wn,gd],
    [gd,wn,wn,wn,gd,wn,wn,wn,gd],
    [gd,wn,wn,wn,gd,wn,wn,wn,gd],
    [gd,gd,gd,gd,gd,gd,gd,gd,gd],
  ])
  // Boss chair
  placeFurniture(container, 7, 11, [
    [_,lt,lt,lt,lt,lt,lt,_],
    [lt,l2,l2,l2,l2,l2,l2,lt],
    [lt,l2,l2,l2,l2,l2,l2,lt],
    [lt,l2,l2,l2,l2,l2,l2,lt],
    [_,lt,lt,lt,lt,lt,lt,_],
    [_,_,lt,_,_,lt,_,_],
  ])

  // ===== BOARD ROOM =====
  placeFurniture(container, 2, 0.4, [
    [rd,rd,rd,rd,rd,rd,rd,rd],
    [pp,pp,pp,pp,pp,pp,pp,pp],
    [pp,p2,p2,pp,p2,p2,pp,pp],
    [pp,p2,p2,pp,p2,p2,pp,pp],
    [pp,pp,pp,pp,pp,pp,pp,pp],
    [pp,p2,p2,pp,p2,p2,pp,pp],
    [pp,p2,rd,pp,p2,p2,pp,pp],
    [pp,pp,pp,pp,pp,pp,pp,pp],
  ])
  placeFurniture(container, 4.5, 0.4, [
    [c2,c2,c2,c2,c2,c2,c2,c2,c2,c2],
    [c2,wh,wh,wh,wh,wh,wh,wh,wh,c2],
    [c2,wh,wh,bc,bc,bc,wh,wh,wh,c2],
    [c2,wh,wh,wh,wh,wh,wh,wh,wh,c2],
    [c2,wh,rd,rd,rd,rd,rd,wh,wh,c2],
    [c2,wh,wh,wh,wh,wh,wh,wh,wh,c2],
    [c2,c2,c2,c2,c2,c2,c2,c2,c2,c2],
  ])
  placeFurniture(container, 3, 3, [
    [wm,wm,wm,wm,wm,wm,wm,wm,wm,wm],
    [wd,wm,wm,wm,wm,wm,wm,wm,wm,wd],
    [wd,wm,wm,wm,wm,wm,wm,wm,wm,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
  ])
  placeFurniture(container, 3.5, 2.5, [
    [lt,pp,pp,pp,lt,pp,pp,pp,lt],
    [lt,pp,p2,pp,lt,pp,p2,pp,lt],
    [lt,pp,pp,pp,lt,pp,pp,pp,lt],
  ])
  placeFurniture(container, 0.4, 0.5, [
    [_,gd,gd,gd,_],
    [gd,bk,bk,bk,gd],
    [gd,bk,gd,bk,gd],
    [gd,bk,bk,gd,gd],
    [_,gd,gd,gd,_],
  ])

  // ===== CORK BOARD =====
  placeFurniture(container, 12.5, 0.4, [
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
    [wd,cb,cb,cb,cb,cb,cb,cb,cb,cb,cb,cb,cb,wd],
    [wd,cb,rd,cb,pp,pp,cb,cb,pp,pp,cb,gn,cb,wd],
    [wd,cb,cb,pp,pp,pp,cb,cb,pp,pp,cb,cb,cb,wd],
    [wd,cb,cb,cb,cb,cb,gd,cb,cb,cb,cb,cb,cb,wd],
    [wd,cb,pp,pp,cb,cb,cb,cb,rd,cb,pp,pp,cb,wd],
    [wd,cb,pp,pp,cb,cb,cb,cb,cb,pp,pp,pp,cb,wd],
    [wd,cb,cb,cb,cb,cb,cb,cb,cb,cb,cb,cb,cb,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
  ])
  placeFurniture(container, 15, 1.5, [
    [ch,ch,ch,ch,ch],
    [c2,ch,ch,ch,c2],
    [c2,c2,gd,c2,c2],
    [c2,ch,ch,ch,c2],
    [c2,c2,gd,c2,c2],
    [c2,ch,ch,ch,c2],
    [c2,c2,gd,c2,c2],
    [c2,c2,c2,c2,c2],
  ])
  placeFurniture(container, 11.5, 3, [
    [wm,wm,wm,wm,wm,wm,wm,wm,wm,wm],
    [wd,wm,wm,wm,wm,wm,wm,wm,wm,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
  ])

  // ===== MAIL ROOM =====
  placeFurniture(container, 3, 15.3, [
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
    [wd,wm,wm,wd,wm,en,wd,wm,wm,wd,en,wm,wd,wm,wm,wd],
    [wd,en,wm,wd,wm,wm,wd,en,wm,wd,wm,wm,wd,wm,en,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
    [wd,wm,en,wd,wm,wm,wd,wm,en,wd,wm,wm,wd,en,wm,wd],
    [wd,wm,wm,wd,en,wm,wd,wm,wm,wd,wm,en,wd,wm,wm,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
  ])
  placeFurniture(container, 3, 18, [
    [wm,wm,wm,wm,wm,wm,wm,wm,wm,wm],
    [wd,wm,wm,wm,wm,wm,wm,wm,wm,wd],
    [wd,wd,wd,wd,wd,wd,wd,wd,wd,wd],
  ])
  placeFurniture(container, 2.5, 17.5, [
    [en,en,en,en],
    [en,rd,en,en],
    [en,en,en,en],
  ])
  placeFurniture(container, 5, 17.5, [
    [_,ch,_],
    [_,ch,_],
    [ch,ch,ch],
    [_,ch,_],
  ])

  // ===== READING ROOM =====
  placeFurniture(container, 11.5, 18, [
    [_,lt,lt,lt,lt,lt,lt,_],
    [lt,l2,l2,l2,l2,l2,l2,lt],
    [lt,l2,l2,l2,l2,l2,l2,lt],
    [lt,l2,l2,l2,l2,l2,l2,lt],
    [lt,lt,lt,lt,lt,lt,lt,lt],
    [_,_,lt,_,_,lt,_,_],
  ])
  placeFurniture(container, 13.5, 17.5, [
    [wm,wm,wm,wm,wm],
    [wd,wm,wm,wm,wd],
    [wd,wd,wd,wd,wd],
    [_,wd,_,wd,_],
  ])
  placeFurniture(container, 13.5, 17, [
    [pp,pp,pp,pp,pp],
    [pp,p2,p2,p2,pp],
    [pp,p2,p2,p2,pp],
  ])
  placeFurniture(container, 9.5, 16, [
    [wd,wd,wd,wd,wd,wd],
    [wd,lt,rd,wd,gd,wd],
    [wd,lt,rd,wd,gd,wd],
    [wd,wd,wd,wd,wd,wd],
    [wd,gd,wd,lt,rd,wd],
    [wd,gd,wd,lt,rd,wd],
    [wd,wd,wd,wd,wd,wd],
    [wd,rd,lt,gd,wd,wd],
    [wd,rd,lt,gd,wd,wd],
    [wd,wd,wd,wd,wd,wd],
  ])
  placeFurniture(container, 14, 16.5, [
    [_,_,gd,gd,gd,_,_],
    [_,gd,gd,gd,gd,gd,_],
    [_,_,_,gd,_,_,_],
    [_,_,_,gd,_,_,_],
    [_,_,_,gd,_,_,_],
    [_,_,gd,gd,gd,_,_],
  ])
  placeFurniture(container, 14.5, 19, [
    [wd,pp,pp,wd],
    [wd,p2,pp,wd],
    [wd,pp,p2,wd],
    [wd,wd,wd,wd],
    [_,wd,wd,_],
  ])
}
