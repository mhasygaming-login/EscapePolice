// High-Performance 2D Roadside Themed Scenery Renderer
// Renders procedural environmental scenery on the left and right shoulders of the highway:
// - Kota: Skyscrapers with glowing windows, neon billboards, streetlights, roof antennas
// - Salju: Heavy snowdrifts, snow-covered pine evergreens, ice crystals, blizzard stakes
// - Padang Pasir: Sand dunes, saguaro cacti, redrock canyon bluffs, desert scrub
// - Hutan: Giant tropical canopy trees, bioluminescent glowing mushrooms, exotic ferns
// - Pegunungan: Rugged granite rock cliffs, chevron hazard guardrails, alpine firs, drifting clouds

import { GameMapId, MapData } from '../types/maps';

interface RoadsideObject {
  type: string;
  laneSide: 'left' | 'right';
  relY: number; // 0 to 1 along a segment
  width: number;
  height: number;
  offset: number; // distance from road edge outwards
  extra?: any;
}

// Pre-generated procedural segment data for each map theme
const SEGMENT_HEIGHT = 1600; // repeating cycle height in pixels

export class RoadsideScenery2D {
  private particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; alpha: number; extra?: number }> = [];
  private lastCanvasWidth = 0;
  private lastCanvasHeight = 0;

  constructor() {
    this.initParticles(800, 900, 'kota');
  }

  public initParticles(width: number, height: number, mapId: GameMapId) {
    this.particles = [];
    const count = mapId === 'salju' ? 90 : mapId === 'padang_pasir' ? 70 : mapId === 'kota' ? 50 : 40;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1.2,
        speedX: mapId === 'padang_pasir' ? (Math.random() * 3 + 2) : (Math.random() - 0.5) * 1.5,
        speedY: mapId === 'salju' ? (Math.random() * 3 + 2) : mapId === 'kota' ? (Math.random() * 10 + 12) : (Math.random() * 2 + 1),
        alpha: Math.random() * 0.7 + 0.3,
        extra: Math.random() * Math.PI * 2,
      });
    }
    this.lastCanvasWidth = width;
    this.lastCanvasHeight = height;
  }

  /**
   * Main 2D Scenery Render function
   */
  public render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    roadLeft: number,
    roadRight: number,
    roadWidth: number,
    worldY: number,
    map: MapData,
    frameCount: number,
    currentSpeed: number
  ) {
    const leftWidth = roadLeft;
    const rightWidth = canvasWidth - roadRight;

    if (canvasWidth !== this.lastCanvasWidth || canvasHeight !== this.lastCanvasHeight) {
      this.initParticles(canvasWidth, canvasHeight, map.id);
    }

    // 1. Render Left & Right Shoulder Terrain Base
    this.renderTerrainBase(ctx, canvasWidth, canvasHeight, roadLeft, roadRight, leftWidth, rightWidth, map);

    // 2. Render Themed Roadside Scenery (Buildings, Trees, Cacti, Rocks, Guardrails)
    switch (map.id) {
      case 'kota':
        this.renderCityScenery(ctx, canvasHeight, roadLeft, roadRight, leftWidth, rightWidth, worldY, frameCount);
        break;
      case 'salju':
        this.renderSnowScenery(ctx, canvasHeight, roadLeft, roadRight, leftWidth, rightWidth, worldY, frameCount);
        break;
      case 'padang_pasir':
        this.renderDesertScenery(ctx, canvasHeight, roadLeft, roadRight, leftWidth, rightWidth, worldY, frameCount);
        break;
      case 'hutan':
        this.renderForestScenery(ctx, canvasHeight, roadLeft, roadRight, leftWidth, rightWidth, worldY, frameCount);
        break;
      case 'pegunungan':
        this.renderMountainScenery(ctx, canvasHeight, roadLeft, roadRight, leftWidth, rightWidth, worldY, frameCount);
        break;
    }

    // 3. Render Weather / Atmospheric Particles
    this.renderWeatherParticles(ctx, canvasWidth, canvasHeight, map, currentSpeed, frameCount);
  }

  /**
   * 1. Render base terrain background for both sides
   */
  private renderTerrainBase(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    roadLeft: number,
    roadRight: number,
    leftWidth: number,
    rightWidth: number,
    map: MapData
  ) {
    if (leftWidth <= 0 && rightWidth <= 0) return;

    // Fill left and right shoulder base colors
    ctx.fillStyle = map.shoulderColor;
    if (leftWidth > 0) ctx.fillRect(0, 0, leftWidth, canvasHeight);
    if (rightWidth > 0) ctx.fillRect(roadRight, 0, rightWidth, canvasHeight);

    // Subtle texture / sidewalk curb trim next to road edge
    const curbWidth = Math.min(14, Math.max(6, Math.round(leftWidth * 0.15)));

    ctx.fillStyle = map.shoulderDetailColor;
    if (leftWidth > 0) ctx.fillRect(roadLeft - curbWidth, 0, curbWidth, canvasHeight);
    if (rightWidth > 0) ctx.fillRect(roadRight, 0, curbWidth, canvasHeight);

    // Guardrail or barrier glow line right next to curbs
    ctx.fillStyle = map.guardrailColor;
    if (leftWidth > 0) ctx.fillRect(roadLeft - curbWidth - 2, 0, 2, canvasHeight);
    if (rightWidth > 0) ctx.fillRect(roadRight + curbWidth, 0, 2, canvasHeight);
  }

  // =========================================================================
  // MAP 1: KOTA (CYBERPUNK METROPOLIS)
  // Samping jalan ada deretan gedung pencakar langit berlantai, jendela menyala,
  // billboard neon, tiang lampu jalan, dan antena atap.
  // =========================================================================
  private renderCityScenery(
    ctx: CanvasRenderingContext2D,
    canvasHeight: number,
    roadLeft: number,
    roadRight: number,
    leftWidth: number,
    rightWidth: number,
    worldY: number,
    frameCount: number
  ) {
    const cycle = SEGMENT_HEIGHT;
    const scrollY = worldY % cycle;

    // Procedural skyscraper building blocks
    const buildings = [
      { y: 40, h: 220, col: '#0d111d', neon: '#00f0ff', name: 'CYBER', wRatio: 0.85 },
      { y: 310, h: 180, col: '#111728', neon: '#ff007f', name: 'NEO', wRatio: 0.78 },
      { y: 540, h: 260, col: '#0a0e1a', neon: '#a855f7', name: 'NITRO', wRatio: 0.9 },
      { y: 850, h: 210, col: '#13192c', neon: '#00f0ff', name: '2088', wRatio: 0.82 },
      { y: 1110, h: 240, col: '#0e1422', neon: '#f59e0b', name: 'APEX', wRatio: 0.88 },
      { y: 1400, h: 170, col: '#101726', neon: '#00f0ff', name: 'RAM', wRatio: 0.75 },
    ];

    // Draw on both left and right sides
    const sides: Array<{ isLeft: boolean; startX: number; maxW: number }> = [];
    if (leftWidth > 20) sides.push({ isLeft: true, startX: 0, maxW: leftWidth - 16 });
    if (rightWidth > 20) sides.push({ isLeft: false, startX: roadRight + 16, maxW: rightWidth - 16 });

    for (const side of sides) {
      for (const b of buildings) {
        // Repeat building across canvas height
        for (let rep = -1; rep <= 2; rep++) {
          const drawY = b.y + rep * cycle + scrollY;
          if (drawY + b.h < -50 || drawY > canvasHeight + 50) continue;

          const bw = Math.max(30, side.maxW * b.wRatio);
          const bx = side.isLeft ? roadLeft - 16 - bw : side.startX;

          // Building Main Wall Body
          ctx.fillStyle = b.col;
          ctx.fillRect(bx, drawY, bw, b.h);

          // Building Roof Border / Neon Trim
          ctx.fillStyle = b.neon;
          ctx.fillRect(bx, drawY, bw, 3);
          ctx.fillRect(side.isLeft ? bx + bw - 2 : bx, drawY, 2, b.h);

          // Building Windows Grid (Matrix of glowing lit & unlit rooms)
          const cols = Math.max(2, Math.floor(bw / 16));
          const rows = Math.max(3, Math.floor((b.h - 30) / 18));
          const winW = 8;
          const winH = 9;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const wx = bx + 6 + c * ((bw - 12) / cols);
              const wy = drawY + 12 + r * 18;
              const seed = (b.y * 13 + r * 7 + c * 17) % 100;
              const isLit = seed > 35;

              if (isLit) {
                // Color palette for windows: amber, cyan, pink, or white
                if (seed > 85) ctx.fillStyle = '#ff007f';
                else if (seed > 65) ctx.fillStyle = '#00f0ff';
                else if (seed > 50) ctx.fillStyle = '#fbbf24';
                else ctx.fillStyle = '#e2e8f0';
              } else {
                ctx.fillStyle = '#06080e';
              }
              ctx.fillRect(wx, wy, winW, winH);
            }
          }

          // Rooftop Neon Billboard / Signage
          if (bw >= 55) {
            const billY = drawY + b.h - 32;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(bx + 4, billY, bw - 8, 22);
            ctx.strokeStyle = b.neon;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx + 4, billY, bw - 8, 22);

            ctx.font = 'bold 10px Orbitron, sans-serif';
            ctx.fillStyle = (frameCount % 60 < 45) ? b.neon : '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.name, bx + bw / 2, billY + 11);
          }

          // Rooftop Antenna with blinking beacon
          const antX = side.isLeft ? bx + 10 : bx + bw - 10;
          ctx.fillStyle = '#475569';
          ctx.fillRect(antX - 1, drawY - 14, 2, 14);
          ctx.fillStyle = (frameCount % 40 < 20) ? '#ff2d6b' : '#334155';
          ctx.beginPath();
          ctx.arc(antX, drawY - 15, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Street Lamps along sidewalk
      const lampInterval = 180;
      const lampOffset = scrollY % lampInterval;
      for (let ly = -lampInterval; ly < canvasHeight + lampInterval; ly += lampInterval) {
        const actualY = ly + lampOffset;
        const lx = side.isLeft ? roadLeft - 10 : roadRight + 10;

        // Lamp post
        ctx.fillStyle = '#334155';
        ctx.fillRect(side.isLeft ? lx - 3 : lx, actualY - 12, 3, 24);
        // Light bulb
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(side.isLeft ? lx - 4 : lx, actualY - 14, 5, 5);
        ctx.shadowBlur = 0;
      }
    }
  }

  // =========================================================================
  // MAP 2: SALJU (ARCTIC SNOW TUNDRA)
  // Samping jalan ada salju tebal, pohon pinus bersalju, kristal es, dan patok salju.
  // =========================================================================
  private renderSnowScenery(
    ctx: CanvasRenderingContext2D,
    canvasHeight: number,
    roadLeft: number,
    roadRight: number,
    leftWidth: number,
    rightWidth: number,
    worldY: number,
    frameCount: number
  ) {
    const cycle = SEGMENT_HEIGHT;
    const scrollY = worldY % cycle;

    // Pine trees and glacier crystal nodes
    const snowElements = [
      { y: 60, type: 'tree', size: 38, offset: 0.4 },
      { y: 190, type: 'ice', size: 30, offset: 0.6 },
      { y: 340, type: 'tree', size: 46, offset: 0.35 },
      { y: 490, type: 'tree', size: 32, offset: 0.7 },
      { y: 630, type: 'ice', size: 36, offset: 0.45 },
      { y: 780, type: 'tree', size: 42, offset: 0.3 },
      { y: 940, type: 'tree', size: 50, offset: 0.5 },
      { y: 1100, type: 'ice', size: 28, offset: 0.65 },
      { y: 1260, type: 'tree', size: 36, offset: 0.38 },
      { y: 1440, type: 'tree', size: 44, offset: 0.55 },
    ];

    const sides = [];
    if (leftWidth > 15) sides.push({ isLeft: true, startX: 0, w: leftWidth - 14 });
    if (rightWidth > 15) sides.push({ isLeft: false, startX: roadRight + 14, w: rightWidth - 14 });

    for (const side of sides) {
      // Wavy snowdrift outlines along shoulder
      ctx.fillStyle = '#e2e8f0';
      for (let sy = -100; sy < canvasHeight + 100; sy += 80) {
        const driftY = sy + (scrollY % 80);
        const wave = Math.sin((driftY + side.w) * 0.05) * 8;
        const driftX = side.isLeft ? roadLeft - 14 - wave : roadRight + 14;
        ctx.beginPath();
        ctx.arc(driftX, driftY, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const el of snowElements) {
        for (let rep = -1; rep <= 2; rep++) {
          const drawY = el.y + rep * cycle + scrollY;
          if (drawY < -60 || drawY > canvasHeight + 60) continue;

          const posX = side.isLeft
            ? roadLeft - 20 - el.offset * side.w
            : side.startX + el.offset * side.w;

          if (el.type === 'tree') {
            // Draw Snow-Covered Pine Evergreen (3-tiered triangles)
            const r = el.size;
            // Trunk
            ctx.fillStyle = '#451a03';
            ctx.fillRect(posX - 3, drawY + r * 0.4, 6, 14);

            // Tier 3 (Bottom)
            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.moveTo(posX, drawY - r * 0.2);
            ctx.lineTo(posX - r * 0.6, drawY + r * 0.4);
            ctx.lineTo(posX + r * 0.6, drawY + r * 0.4);
            ctx.closePath();
            ctx.fill();
            // Snow cap on Tier 3
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(posX - r * 0.55, drawY + r * 0.4);
            ctx.lineTo(posX - r * 0.3, drawY + r * 0.25);
            ctx.lineTo(posX + r * 0.3, drawY + r * 0.25);
            ctx.lineTo(posX + r * 0.55, drawY + r * 0.4);
            ctx.closePath();
            ctx.fill();

            // Tier 2 (Middle)
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.moveTo(posX, drawY - r * 0.5);
            ctx.lineTo(posX - r * 0.45, drawY + r * 0.1);
            ctx.lineTo(posX + r * 0.45, drawY + r * 0.1);
            ctx.closePath();
            ctx.fill();
            // Snow cap on Tier 2
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(posX - r * 0.4, drawY + r * 0.1);
            ctx.lineTo(posX - r * 0.2, drawY - r * 0.05);
            ctx.lineTo(posX + r * 0.2, drawY - r * 0.05);
            ctx.lineTo(posX + r * 0.4, drawY + r * 0.1);
            ctx.closePath();
            ctx.fill();

            // Tier 1 (Top Tip)
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.moveTo(posX, drawY - r * 0.8);
            ctx.lineTo(posX - r * 0.3, drawY - r * 0.2);
            ctx.lineTo(posX + r * 0.3, drawY - r * 0.2);
            ctx.closePath();
            ctx.fill();
            // Pure snow cap on top
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(posX, drawY - r * 0.8);
            ctx.lineTo(posX - r * 0.2, drawY - r * 0.45);
            ctx.lineTo(posX + r * 0.2, drawY - r * 0.45);
            ctx.closePath();
            ctx.fill();
          } else {
            // Glacier Ice Crystal Formation
            const isz = el.size;
            ctx.save();
            ctx.translate(posX, drawY);
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(0, -isz * 0.6);
            ctx.lineTo(isz * 0.5, -isz * 0.1);
            ctx.lineTo(isz * 0.4, isz * 0.5);
            ctx.lineTo(-isz * 0.4, isz * 0.5);
            ctx.lineTo(-isz * 0.5, -isz * 0.1);
            ctx.closePath();
            ctx.fill();

            // Ice Facet Highlight
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.moveTo(0, -isz * 0.6);
            ctx.lineTo(isz * 0.5, -isz * 0.1);
            ctx.lineTo(0, isz * 0.3);
            ctx.closePath();
            ctx.fill();

            // Crystalline Glint
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-isz * 0.15, -isz * 0.2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Red & White Blizzard Safety Stakes along the road edge
      const stakeInterval = 140;
      const stakeOffset = scrollY % stakeInterval;
      for (let sy = -stakeInterval; sy < canvasHeight + stakeInterval; sy += stakeInterval) {
        const actualY = sy + stakeOffset;
        const sx = side.isLeft ? roadLeft - 8 : roadRight + 8;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(sx - 2, actualY - 14, 4, 28);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 2, actualY - 6, 4, 8);
      }
    }
  }

  // =========================================================================
  // MAP 3: PADANG PASIR (REDROCK DESERT CANYON)
  // Samping jalan ada pasir bergelombang, pohon kaktus Saguaro, bebatuan ngarai merah.
  // =========================================================================
  private renderDesertScenery(
    ctx: CanvasRenderingContext2D,
    canvasHeight: number,
    roadLeft: number,
    roadRight: number,
    leftWidth: number,
    rightWidth: number,
    worldY: number,
    frameCount: number
  ) {
    const cycle = SEGMENT_HEIGHT;
    const scrollY = worldY % cycle;

    const desertElements = [
      { y: 80, type: 'cactus', size: 36, offset: 0.35 },
      { y: 220, type: 'rock', size: 45, offset: 0.6 },
      { y: 390, type: 'cactus', size: 42, offset: 0.5 },
      { y: 550, type: 'scrub', size: 22, offset: 0.25 },
      { y: 690, type: 'rock', size: 55, offset: 0.4 },
      { y: 860, type: 'cactus', size: 38, offset: 0.65 },
      { y: 1020, type: 'scrub', size: 24, offset: 0.3 },
      { y: 1180, type: 'rock', size: 48, offset: 0.55 },
      { y: 1360, type: 'cactus', size: 44, offset: 0.4 },
      { y: 1510, type: 'scrub', size: 20, offset: 0.65 },
    ];

    const sides = [];
    if (leftWidth > 15) sides.push({ isLeft: true, startX: 0, w: leftWidth - 14 });
    if (rightWidth > 15) sides.push({ isLeft: false, startX: roadRight + 14, w: rightWidth - 14 });

    for (const side of sides) {
      // Sand ripple dune lines
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
      ctx.lineWidth = 2;
      for (let dy = -100; dy < canvasHeight + 100; dy += 70) {
        const duneY = dy + (scrollY % 70);
        ctx.beginPath();
        const startX = side.isLeft ? 0 : roadRight + 14;
        const endX = side.isLeft ? roadLeft - 14 : canvasHeight;
        ctx.moveTo(startX, duneY);
        ctx.bezierCurveTo(
          startX + side.w * 0.3,
          duneY - 8,
          startX + side.w * 0.7,
          duneY + 8,
          startX + side.w,
          duneY
        );
        ctx.stroke();
      }

      for (const el of desertElements) {
        for (let rep = -1; rep <= 2; rep++) {
          const drawY = el.y + rep * cycle + scrollY;
          if (drawY < -60 || drawY > canvasHeight + 60) continue;

          const posX = side.isLeft
            ? roadLeft - 20 - el.offset * side.w
            : side.startX + el.offset * side.w;

          if (el.type === 'cactus') {
            // Saguaro Desert Cactus with branches
            const ch = el.size * 1.5;
            const cw = 9;
            ctx.fillStyle = '#15803d';

            // Central Trunk
            ctx.fillRect(posX - cw / 2, drawY - ch / 2, cw, ch);
            // Rounded trunk top
            ctx.beginPath();
            ctx.arc(posX, drawY - ch / 2, cw / 2, Math.PI, 0);
            ctx.fill();

            // Left Branch
            ctx.fillRect(posX - cw * 1.8, drawY - ch * 0.1, cw * 1.4, cw);
            ctx.fillRect(posX - cw * 1.8, drawY - ch * 0.35, cw, ch * 0.25);
            ctx.beginPath();
            ctx.arc(posX - cw * 1.3, drawY - ch * 0.35, cw / 2, Math.PI, 0);
            ctx.fill();

            // Right Branch
            ctx.fillRect(posX + cw * 0.5, drawY + ch * 0.05, cw * 1.4, cw);
            ctx.fillRect(posX + cw * 1.0, drawY - ch * 0.2, cw, ch * 0.25);
            ctx.beginPath();
            ctx.arc(posX + cw * 1.5, drawY - ch * 0.2, cw / 2, Math.PI, 0);
            ctx.fill();

            // Rib shadow
            ctx.fillStyle = '#14532d';
            ctx.fillRect(posX - 1, drawY - ch / 2, 2, ch);
          } else if (el.type === 'rock') {
            // Redrock Canyon Boulder / Strata Formation
            const rw = el.size * 1.2;
            const rh = el.size * 0.8;
            ctx.save();
            ctx.translate(posX, drawY);

            ctx.fillStyle = '#9a3412';
            ctx.beginPath();
            ctx.moveTo(-rw * 0.5, rh * 0.4);
            ctx.lineTo(-rw * 0.4, -rh * 0.3);
            ctx.lineTo(rw * 0.1, -rh * 0.5);
            ctx.lineTo(rw * 0.5, -rh * 0.1);
            ctx.lineTo(rw * 0.4, rh * 0.5);
            ctx.closePath();
            ctx.fill();

            // Sedimentary geological strata stripe
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(-rw * 0.35, -rh * 0.1, rw * 0.7, 5);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-rw * 0.25, rh * 0.1, rw * 0.55, 4);

            ctx.restore();
          } else {
            // Desert Scrub / Tumbleweed
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(posX, drawY, el.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(posX + 2, drawY - 2, el.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // =========================================================================
  // MAP 4: HUTAN (BIOLUMINESCENT TROPICAL RAINFOREST)
  // Samping jalan ada pohon kanopi lebat, pakis tropis, jamur bercahaya (neon bioluminescent).
  // =========================================================================
  private renderForestScenery(
    ctx: CanvasRenderingContext2D,
    canvasHeight: number,
    roadLeft: number,
    roadRight: number,
    leftWidth: number,
    rightWidth: number,
    worldY: number,
    frameCount: number
  ) {
    const cycle = SEGMENT_HEIGHT;
    const scrollY = worldY % cycle;

    const forestElements = [
      { y: 50, type: 'tree', size: 52, offset: 0.45 },
      { y: 190, type: 'mushrooms', size: 24, offset: 0.2 },
      { y: 320, type: 'fern', size: 30, offset: 0.3 },
      { y: 460, type: 'tree', size: 60, offset: 0.55 },
      { y: 610, type: 'mushrooms', size: 28, offset: 0.25 },
      { y: 760, type: 'tree', size: 48, offset: 0.35 },
      { y: 920, type: 'fern', size: 34, offset: 0.45 },
      { y: 1080, type: 'tree', size: 64, offset: 0.6 },
      { y: 1240, type: 'mushrooms', size: 26, offset: 0.22 },
      { y: 1410, type: 'tree', size: 54, offset: 0.4 },
    ];

    const sides = [];
    if (leftWidth > 15) sides.push({ isLeft: true, startX: 0, w: leftWidth - 14 });
    if (rightWidth > 15) sides.push({ isLeft: false, startX: roadRight + 14, w: rightWidth - 14 });

    for (const side of sides) {
      for (const el of forestElements) {
        for (let rep = -1; rep <= 2; rep++) {
          const drawY = el.y + rep * cycle + scrollY;
          if (drawY < -70 || drawY > canvasHeight + 70) continue;

          const posX = side.isLeft
            ? roadLeft - 20 - el.offset * side.w
            : side.startX + el.offset * side.w;

          if (el.type === 'tree') {
            // Giant Canopy Tree (Layered Lush Foliage)
            const tr = el.size;
            // Tree Trunk
            ctx.fillStyle = '#27170a';
            ctx.fillRect(posX - 5, drawY, 10, tr * 0.6);

            // Foliage Layers (Deep green -> emerald -> bright jade)
            ctx.fillStyle = '#064e3b';
            ctx.beginPath();
            ctx.arc(posX, drawY - tr * 0.2, tr * 0.6, 0, Math.PI * 2);
            ctx.arc(posX - tr * 0.35, drawY - tr * 0.1, tr * 0.45, 0, Math.PI * 2);
            ctx.arc(posX + tr * 0.35, drawY - tr * 0.1, tr * 0.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(posX - tr * 0.15, drawY - tr * 0.3, tr * 0.4, 0, Math.PI * 2);
            ctx.arc(posX + tr * 0.15, drawY - tr * 0.3, tr * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(posX, drawY - tr * 0.4, tr * 0.28, 0, Math.PI * 2);
            ctx.fill();
          } else if (el.type === 'mushrooms') {
            // Bioluminescent Glowing Mushrooms (Neon Cyan & Pink Spores)
            const ms = el.size;
            const pulse = Math.sin(frameCount * 0.08 + el.y) * 4;

            // Ambient mushroom glow circle
            ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.beginPath();
            ctx.arc(posX, drawY, ms + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Stalks
            ctx.fillStyle = '#a7f3d0';
            ctx.fillRect(posX - 4, drawY - 2, 3, 10);
            ctx.fillRect(posX + 3, drawY, 2.5, 8);

            // Glowing Mushroom Cap 1 (Cyan)
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(posX - 2, drawY - 3, ms * 0.35, Math.PI, 0);
            ctx.fill();

            // Glowing Mushroom Cap 2 (Magenta/Purple)
            ctx.fillStyle = '#d946ef';
            ctx.shadowColor = '#d946ef';
            ctx.beginPath();
            ctx.arc(posX + 4, drawY - 1, ms * 0.25, Math.PI, 0);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            // Tropical Rainforest Fern Fronds
            const fr = el.size;
            ctx.fillStyle = '#047857';
            ctx.beginPath();
            ctx.ellipse(posX, drawY, fr * 0.6, fr * 0.3, Math.PI / 4, 0, Math.PI * 2);
            ctx.ellipse(posX, drawY, fr * 0.6, fr * 0.3, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.ellipse(posX, drawY, fr * 0.35, fr * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // =========================================================================
  // MAP 5: PEGUNUNGAN (ALPINE SUMMIT PASS)
  // Samping jalan ada tebing jurang bebatuan gunung, guardrail chevron pengaman,
  // pohon cemara alpine, dan awan kabut jurang.
  // =========================================================================
  private renderMountainScenery(
    ctx: CanvasRenderingContext2D,
    canvasHeight: number,
    roadLeft: number,
    roadRight: number,
    leftWidth: number,
    rightWidth: number,
    worldY: number,
    frameCount: number
  ) {
    const cycle = SEGMENT_HEIGHT;
    const scrollY = worldY % cycle;

    const mountainElements = [
      { y: 70, type: 'cliff', size: 55, offset: 0.5 },
      { y: 210, type: 'fir', size: 34, offset: 0.3 },
      { y: 360, type: 'boulder', size: 42, offset: 0.6 },
      { y: 520, type: 'cliff', size: 65, offset: 0.45 },
      { y: 680, type: 'fir', size: 38, offset: 0.25 },
      { y: 840, type: 'boulder', size: 48, offset: 0.55 },
      { y: 1010, type: 'cliff', size: 58, offset: 0.4 },
      { y: 1180, type: 'fir', size: 32, offset: 0.35 },
      { y: 1340, type: 'boulder', size: 44, offset: 0.6 },
      { y: 1500, type: 'cliff', size: 62, offset: 0.48 },
    ];

    const sides = [];
    if (leftWidth > 15) sides.push({ isLeft: true, startX: 0, w: leftWidth - 14 });
    if (rightWidth > 15) sides.push({ isLeft: false, startX: roadRight + 14, w: rightWidth - 14 });

    for (const side of sides) {
      // Rocky Granite Crags
      for (const el of mountainElements) {
        for (let rep = -1; rep <= 2; rep++) {
          const drawY = el.y + rep * cycle + scrollY;
          if (drawY < -70 || drawY > canvasHeight + 70) continue;

          const posX = side.isLeft
            ? roadLeft - 20 - el.offset * side.w
            : side.startX + el.offset * side.w;

          if (el.type === 'cliff' || el.type === 'boulder') {
            // Jagged Angular Rock Face
            const rs = el.size;
            ctx.save();
            ctx.translate(posX, drawY);

            ctx.fillStyle = '#27272a';
            ctx.beginPath();
            ctx.moveTo(-rs * 0.5, -rs * 0.2);
            ctx.lineTo(rs * 0.1, -rs * 0.6);
            ctx.lineTo(rs * 0.6, -rs * 0.1);
            ctx.lineTo(rs * 0.4, rs * 0.5);
            ctx.lineTo(-rs * 0.4, rs * 0.4);
            ctx.closePath();
            ctx.fill();

            // Granite Ledge Highlight
            ctx.fillStyle = '#52525b';
            ctx.beginPath();
            ctx.moveTo(-rs * 0.5, -rs * 0.2);
            ctx.lineTo(rs * 0.1, -rs * 0.6);
            ctx.lineTo(0, rs * 0.1);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          } else {
            // Alpine Fir Tree
            const fs = el.size;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(posX - 2, drawY + fs * 0.3, 4, 10);
            ctx.fillStyle = '#0f766e';
            ctx.beginPath();
            ctx.moveTo(posX, drawY - fs * 0.7);
            ctx.lineTo(posX - fs * 0.4, fs * 0.3 + drawY);
            ctx.lineTo(posX + fs * 0.4, fs * 0.3 + drawY);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // Chevron Danger Guardrails (Reflective yellow/black hazard arrows)
      const railInterval = 120;
      const railOffset = scrollY % railInterval;
      for (let ry = -railInterval; ry < canvasHeight + railInterval; ry += railInterval) {
        const actualY = ry + railOffset;
        const rx = side.isLeft ? roadLeft - 12 : roadRight + 2;

        // Guardrail Post
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(rx, actualY - 14, 10, 28);

        // Chevron Warning Arrow
        ctx.fillStyle = '#facc15';
        ctx.fillRect(rx + 1, actualY - 12, 8, 24);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        if (side.isLeft) {
          ctx.moveTo(rx + 2, actualY);
          ctx.lineTo(rx + 7, actualY - 6);
          ctx.lineTo(rx + 7, actualY + 6);
        } else {
          ctx.moveTo(rx + 8, actualY);
          ctx.lineTo(rx + 3, actualY - 6);
          ctx.lineTo(rx + 3, actualY + 6);
        }
        ctx.fill();
      }

      // Drifting Alpine Cloud / Mountain Mist Puffs on outside edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
      for (let cy = -200; cy < canvasHeight + 200; cy += 220) {
        const cloudY = cy + (scrollY * 0.5 % 220);
        const cloudX = side.isLeft ? 10 : canvasHeight - 20;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 50, 0, Math.PI * 2);
        ctx.arc(cloudX + 30, cloudY - 10, 40, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // =========================================================================
  // 3. WEATHER / ATMOSPHERIC PARTICLE LAYER
  // Neon Rain, Snowfall, Sandstorm, Fireflies, Mountain Mist
  // =========================================================================
  private renderWeatherParticles(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    map: MapData,
    speed: number,
    frameCount: number
  ) {
    const pType = map.particleType;

    for (const p of this.particles) {
      // Update particle positions based on current car speed & natural wind
      p.y += p.speedY + speed * 0.75;
      p.x += p.speedX;

      if (p.y > canvasHeight + 20) {
        p.y = -20;
        p.x = Math.random() * canvasWidth;
      }
      if (p.x < -20) p.x = canvasWidth + 20;
      if (p.x > canvasWidth + 20) p.x = -20;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (pType === 'neon_rain') {
        // Neon Blue / Cyan Streaking Rain
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + p.size * 9);
        ctx.stroke();
      } else if (pType === 'snowfall') {
        // Soft Drifting Snowflakes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(frameCount * 0.05 + (p.extra || 0)) * 4, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (pType === 'sandstorm') {
        // Whipping Golden Amber Dust Streaks
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.size * 6, p.y + p.size * 3);
        ctx.stroke();
      } else if (pType === 'fireflies') {
        // Glowing Bioluminescent Fireflies with Soft Pulse
        const pulse = 0.5 + Math.sin(frameCount * 0.1 + (p.extra || 0)) * 0.5;
        ctx.fillStyle = '#6ee7b7';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Mountain Cloud Mist Droplets
        ctx.fillStyle = '#e9d5ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

export const roadsideScenery2D = new RoadsideScenery2D();
