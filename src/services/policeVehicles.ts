/**
 * Top-Down 2D Police Vehicle Rendering Engine
 * Authentic 2D top-down models based on user specifications:
 * - 4 Police Car Types: Classic Sedan, Muscle Interceptor, Sports Interceptor, Tactical SUV
 * - 1 Indonesian Highway Patrol Police Motorcycle: Honda Goldwing / Touring Police Bike with checkered decals
 */

export type PoliceCarVariant = 'sedan' | 'interceptor' | 'sports' | 'suv';

export interface DrawPoliceCarOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  variant?: PoliceCarVariant;
  frameCount?: number;
  isElite?: boolean;
  facing?: 'up' | 'down';
  tiltAngle?: number;
}

export interface DrawPoliceMotorcycleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  frameCount?: number;
  facing?: 'up' | 'down';
  tiltAngle?: number;
}

// Utility rounded rectangle helper
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Renders 1 of 4 authentic 2D Top-Down Police Cars based on reference:
 * 1. Sedan: Classic police patrol sedan with rectangular hood and clean trunk
 * 2. Interceptor: Heavy-duty bullbar / push bumper, wide muscular fenders, rear spoiler
 * 3. Sports: Sleek aerodynamic nose, hood louvers, aggressive raked profile, GT pursuit wing
 * 4. SUV: Tactical utility vehicle with roof rails, elongated cabin, push bumper, boxy rear
 */
export function drawPoliceCar2D(ctx: CanvasRenderingContext2D, options: DrawPoliceCarOptions) {
  const {
    x,
    y,
    width: w,
    height: h,
    variant = 'sedan',
    frameCount = 0,
    isElite = false,
    facing = 'down',
    tiltAngle = 0,
  } = options;

  const halfW = w / 2;
  const halfH = h / 2;

  ctx.save();
  ctx.translate(x + halfW, y + halfH);

  // Apply facing direction (down means forward in direction of downward traffic motion)
  if (facing === 'down') {
    ctx.rotate(Math.PI + tiltAngle);
  } else if (tiltAngle) {
    ctx.rotate(tiltAngle);
  }

  // 1. Dynamic Underglow & Emergency Strobes Aura
  const strobeCycle = frameCount % 16;
  const isLeftRed = strobeCycle < 8;
  const isRightBlue = strobeCycle >= 8;

  // Contact Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  drawRoundedRect(ctx, -halfW + 2, -halfH + 3, w - 4, h - 3, variant === 'suv' ? 9 : 8);
  ctx.fill();

  // 2. Wheels / Tires (visible in corners)
  const wheelW = Math.max(5, Math.round(w * 0.12));
  const wheelH = Math.max(14, Math.round(h * 0.21));
  const wheelFrontY = -halfH + Math.round(h * 0.22);
  const wheelRearY = halfH - Math.round(h * 0.25);

  ctx.fillStyle = '#090d16'; // Deep rubber tire
  // Front left & right
  ctx.fillRect(-halfW - 1, wheelFrontY - wheelH / 2, wheelW, wheelH);
  ctx.fillRect(halfW - wheelW + 1, wheelFrontY - wheelH / 2, wheelW, wheelH);
  // Rear left & right
  ctx.fillRect(-halfW - 1, wheelRearY - wheelH / 2, wheelW, wheelH);
  ctx.fillRect(halfW - wheelW + 1, wheelRearY - wheelH / 2, wheelW, wheelH);

  // Rim accents
  ctx.fillStyle = '#334155';
  ctx.fillRect(-halfW + 1, wheelFrontY - 3, 2, 6);
  ctx.fillRect(halfW - 3, wheelFrontY - 3, 2, 6);
  ctx.fillRect(-halfW + 1, wheelRearY - 3, 2, 6);
  ctx.fillRect(halfW - 3, wheelRearY - 3, 2, 6);

  // 3. Main Car Body Base (Navy / Police Black)
  const baseColor = isElite ? '#171e2e' : '#1e2538';
  const highlightColor = isElite ? '#273248' : '#2b364e';

  ctx.fillStyle = baseColor;
  ctx.strokeStyle = '#0f1422';
  ctx.lineWidth = 1.2;

  if (variant === 'sedan') {
    // Classic 4-door sedan proportions
    drawRoundedRect(ctx, -halfW + 2, -halfH, w - 4, h, 6);
    ctx.fill();
    ctx.stroke();

    // Front chrome/bumper trim
    ctx.fillStyle = '#475569';
    ctx.fillRect(-halfW + 5, -halfH, w - 10, 3);
    // Rear bumper trim
    ctx.fillRect(-halfW + 5, halfH - 3, w - 10, 3);
  } else if (variant === 'interceptor') {
    // Muscle Cruiser with flared fenders
    ctx.beginPath();
    ctx.moveTo(-halfW + 5, -halfH);
    ctx.lineTo(halfW - 5, -halfH); // front
    ctx.quadraticCurveTo(halfW + 1, -halfH + 15, halfW, -halfH + 30); // front fender flare
    ctx.lineTo(halfW - 1, halfH - 25); // waist
    ctx.quadraticCurveTo(halfW + 2, halfH - 12, halfW - 4, halfH); // rear muscular hip
    ctx.lineTo(-halfW + 4, halfH); // rear bumper
    ctx.quadraticCurveTo(-halfW - 2, halfH - 12, -halfW + 1, halfH - 25); // left hip
    ctx.lineTo(-halfW, -halfH + 30); // waist
    ctx.quadraticCurveTo(-halfW - 1, -halfH + 15, -halfW + 5, -halfH); // front left fender
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy Push-Bar / Bullbar (Front bumper guards)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 10, -halfH - 4, w - 20, 5);
    ctx.fillStyle = '#334155';
    // Two vertical ram guards
    ctx.fillRect(-halfW + 13, -halfH - 5, 3, 6);
    ctx.fillRect(halfW - 16, -halfH - 5, 3, 6);
  } else if (variant === 'sports') {
    // High-Speed Aerodynamic Interceptor
    ctx.beginPath();
    ctx.moveTo(0, -halfH - 2); // Pointed aerodynamic nose
    ctx.lineTo(halfW - 4, -halfH + 8);
    ctx.lineTo(halfW - 1, -halfH + 28);
    ctx.lineTo(halfW - 2, halfH - 18);
    ctx.lineTo(halfW - 3, halfH - 2);
    ctx.lineTo(-halfW + 3, halfH - 2);
    ctx.lineTo(-halfW + 2, halfH - 18);
    ctx.lineTo(-halfW + 1, -halfH + 28);
    ctx.lineTo(-halfW + 4, -halfH + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front aerodynamic splitter & compact pushbar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 12, -halfH - 2, w - 24, 4);

    // Hood Heat Extractor Louvers
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(-halfW + 12, -halfH + 14, 5, 10);
    ctx.fillRect(halfW - 17, -halfH + 14, 5, 10);
  } else if (variant === 'suv') {
    // Tactical Police SUV (Enforcer)
    drawRoundedRect(ctx, -halfW + 1, -halfH, w - 2, h, 9);
    ctx.fill();
    ctx.stroke();

    // Front heavy steel bullbar
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-halfW + 6, -halfH - 5, w - 12, 6);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-halfW + 11, -halfH - 6, 4, 7);
    ctx.fillRect(halfW - 15, -halfH - 6, 4, 7);
    ctx.fillRect(-halfW + 10, -halfH - 3, w - 20, 2);
  }

  // 4. Hood Panel Details & Reflections
  ctx.fillStyle = highlightColor;
  if (variant === 'suv') {
    // SUV broad hood
    drawRoundedRect(ctx, -halfW + 7, -halfH + 4, w - 14, Math.round(h * 0.22), 4);
    ctx.fill();
  } else {
    drawRoundedRect(ctx, -halfW + 7, -halfH + 4, w - 14, Math.round(h * 0.24), 4);
    ctx.fill();
  }

  // Headlights (Clear LED projector lens)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-halfW + 4, -halfH + 1, 6, 3);
  ctx.fillRect(halfW - 10, -halfH + 1, 6, 3);
  // Headlight halo glow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(-halfW + 5, -halfH + 4, 4, 2);
  ctx.fillRect(halfW - 9, -halfH + 4, 4, 2);

  // 5. Cabin & Windows (Dark Tinted Automotive Glass with Glass Sheen)
  const cabinY = -halfH + Math.round(h * 0.26);
  const cabinH = Math.round(variant === 'suv' ? h * 0.58 : h * 0.48);
  const cabinW = w - 8;

  // Tinted Glass Base
  ctx.fillStyle = '#0c121e';
  drawRoundedRect(ctx, -halfW + 4, cabinY, cabinW, cabinH, 6);
  ctx.fill();

  // Glass specular reflection highlight line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-halfW + 8, cabinY + 4);
  ctx.lineTo(halfW - 8, cabinY + cabinH - 4);
  ctx.stroke();

  // 6. Signature White Police Roof
  const roofMarginX = 6;
  const roofMarginY = variant === 'suv' ? 10 : 8;
  const roofW = cabinW - roofMarginX * 2;
  const roofH = cabinH - roofMarginY * 2;
  const roofY = cabinY + roofMarginY;

  // White Roof Panel with gradient edge
  const roofGrad = ctx.createLinearGradient(0, roofY, 0, roofY + roofH);
  roofGrad.addColorStop(0, '#f8fafc');
  roofGrad.addColorStop(0.5, '#ffffff');
  roofGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = roofGrad;
  drawRoundedRect(ctx, -roofW / 2, roofY, roofW, roofH, 4);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // If SUV: Roof rails and ribbed panels (from image 1, bottom right)
  if (variant === 'suv') {
    ctx.fillStyle = '#94a3b8';
    // Dual roof rack rails
    ctx.fillRect(-roofW / 2 + 2, roofY + 4, 2, roofH - 8);
    ctx.fillRect(roofW / 2 - 4, roofY + 4, 2, roofH - 8);
    // Roof textured ridges
    ctx.fillStyle = '#e2e8f0';
    for (let r = roofY + 8; r < roofY + roofH - 8; r += 7) {
      ctx.fillRect(-roofW / 2 + 6, r, roofW - 12, 1);
    }
  }

  // 7. Side Mirrors (A-pillar mounted)
  ctx.fillStyle = '#1e2538';
  // Left mirror
  ctx.fillRect(-halfW - 2, cabinY + 5, 3, 5);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-halfW - 2, cabinY + 6, 1, 3);
  // Right mirror
  ctx.fillStyle = '#1e2538';
  ctx.fillRect(halfW - 1, cabinY + 5, 3, 5);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(halfW + 1, cabinY + 6, 1, 3);

  // 8. ROOFTOP POLICE EMERGENCY SIREN LIGHTBAR (Red & Blue with Dynamic Flashing)
  const lightbarY = roofY + Math.round(roofH * (variant === 'suv' ? 0.35 : 0.42));
  const lightbarW = Math.round(roofW * 0.82);
  const lightbarH = 7;
  const halfLbW = lightbarW / 2;

  // Lightbar bracket/mount
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-halfLbW - 1, lightbarY - 1, lightbarW + 2, lightbarH + 2);

  // Left Strobe (RED)
  ctx.save();
  if (isLeftRed) {
    ctx.shadowColor = '#ff0037';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ff0037';
  } else {
    ctx.fillStyle = '#880824';
  }
  drawRoundedRect(ctx, -halfLbW, lightbarY, halfLbW - 2, lightbarH, 2);
  ctx.fill();
  ctx.restore();

  // Right Strobe (BLUE)
  ctx.save();
  if (isRightBlue) {
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#00d4ff';
  } else {
    ctx.fillStyle = '#0c3575';
  }
  drawRoundedRect(ctx, 2, lightbarY, halfLbW - 2, lightbarH, 2);
  ctx.fill();
  ctx.restore();

  // Center Takedown / White Strobe
  ctx.fillStyle = frameCount % 8 < 4 ? '#ffffff' : '#64748b';
  ctx.fillRect(-1.5, lightbarY, 3, lightbarH);

  // 9. Rear Trunk / Hatch & Taillights
  const trunkY = cabinY + cabinH;
  const trunkH = halfH - trunkY;

  if (variant === 'sports') {
    // GT Wing / Pursuit Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 6, halfH - 6, w - 12, 4);
    // Endplates
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-halfW + 5, halfH - 8, 2, 7);
    ctx.fillRect(halfW - 7, halfH - 8, 2, 7);
  } else if (variant === 'interceptor') {
    // Integrated Lip Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 8, halfH - 4, w - 16, 3);
  } else if (variant === 'suv') {
    // Rear Hatch Glass Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 6, trunkY + 1, w - 12, 3);
  }

  // Red Taillights
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-halfW + 4, halfH - 3, 6, 2);
  ctx.fillRect(halfW - 10, halfH - 3, 6, 2);

  // Additional rear strobe accent for elite/interceptors
  if (variant === 'suv' || isElite) {
    ctx.fillStyle = isLeftRed ? '#ff0037' : '#0066ff';
    ctx.fillRect(-2, halfH - 2, 4, 2);
  }

  ctx.restore();
}

/**
 * Renders an authentic 2D Top-Down Indonesian Highway Patrol Police Motorcycle
 * Based on Reference Image 2 (Honda Goldwing / Yamaha Touring Police Motorcycle):
 * - Pearlescent white aerodynamic touring fairing
 * - Blue checkered "Battenburg" pattern & "POLISI" decals
 * - Front windshield & dual headlights
 * - Police officer rider with helmet, visor, and uniform
 * - Wide sculpted driver seat & lumbar support
 * - Dual rear touring panniers (hard side boxes) with checkered decals
 * - Flashing dual rear emergency strobe lights (Red & Blue)
 */
export function drawPoliceMotorcycle2D(ctx: CanvasRenderingContext2D, options: DrawPoliceMotorcycleOptions) {
  const {
    x,
    y,
    width: w,
    height: h,
    frameCount = 0,
    facing = 'down',
    tiltAngle = 0,
  } = options;

  const halfW = w / 2;
  const halfH = h / 2;

  ctx.save();
  ctx.translate(x + halfW, y + halfH);

  // Apply facing direction (down means forward in direction of downward traffic motion)
  if (facing === 'down') {
    ctx.rotate(Math.PI + tiltAngle);
  } else if (tiltAngle) {
    ctx.rotate(tiltAngle);
  }

  // Emergency Strobe Timing (alternating red & blue)
  const strobeCycle = frameCount % 12;
  const isLeftRed = strobeCycle < 6;
  const isRightBlue = strobeCycle >= 6;

  // 1. Contact Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  drawRoundedRect(ctx, -halfW + 3, -halfH + 3, w - 6, h - 3, 6);
  ctx.fill();

  // 2. Front Tire & Mudguard / Fender
  const frontTireW = 6;
  const frontTireH = 14;
  ctx.fillStyle = '#090d16'; // Black rubber
  ctx.fillRect(-frontTireW / 2, -halfH - 2, frontTireW, frontTireH);
  // White front fender with blue stripe
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, -frontTireW / 2 - 1, -halfH + 2, frontTireW + 2, 8, 2);
  ctx.fill();
  ctx.fillStyle = '#0052cc';
  ctx.fillRect(-frontTireW / 2 - 1, -halfH + 5, frontTireW + 2, 2);

  // 3. Front Touring Aerodynamic Cowl / Fairing (Image 2)
  const fairingY = -halfH + 7;
  const fairingW = w - 6;
  const fairingH = 15;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, fairingY); // Pointed nose
  ctx.lineTo(fairingW / 2, fairingY + 6);
  ctx.lineTo(fairingW / 2 - 1, fairingY + fairingH);
  ctx.lineTo(-fairingW / 2 + 1, fairingY + fairingH);
  ctx.lineTo(-fairingW / 2, fairingY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dual Headlights
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-fairingW / 2 + 3, fairingY + 4, 4, 3);
  ctx.fillRect(fairingW / 2 - 7, fairingY + 4, 4, 3);

  // Indonesian Police Blue Checkered Trim on Fairing
  const checkY = fairingY + 8;
  for (let c = -fairingW / 2 + 2; c < fairingW / 2 - 3; c += 4) {
    ctx.fillStyle = (Math.floor(c / 4) % 2 === 0) ? '#0052cc' : '#ffffff';
    ctx.fillRect(c, checkY, 3, 2.5);
  }

  // 4. Front Windshield (Clear tinted blue-gray curved glass)
  ctx.fillStyle = 'rgba(203, 227, 250, 0.75)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, fairingY + 11, 7, Math.PI * 1.15, Math.PI * 1.85, false);
  ctx.stroke();
  ctx.fill();

  // 5. Handlebars & Side Mirrors
  const barY = fairingY + fairingH - 1;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-halfW + 1, barY, w - 2, 2); // bar
  // Rubber Grips
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-halfW + 1, barY - 1, 3, 4);
  ctx.fillRect(halfW - 4, barY - 1, 3, 4);
  // Mirrors extending outward
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-halfW - 1, barY - 4, 2, 3);
  ctx.fillRect(halfW - 1, barY - 4, 2, 3);

  // 6. Fuel Tank & Dashboard
  const tankY = barY + 2;
  const tankW = 12;
  const tankH = 10;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, -tankW / 2, tankY, tankW, tankH, 3);
  ctx.fill();
  // Instrument Gauge Cluster
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-3, tankY + 1, 6, 3);
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-2, tankY + 2, 4, 1);

  // 7. Police Officer Rider (Top-down view)
  const riderY = tankY + tankH - 1;
  // Uniform Shoulders (Dark tactical police jacket with high-vis accents)
  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, -9, riderY + 4, 18, 12, 4);
  ctx.fill();
  // High-vis reflective stripes on shoulders
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-8, riderY + 6, 3, 8);
  ctx.fillRect(5, riderY + 6, 3, 8);

  // Hands on Handlebars
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-halfW + 3, barY, 4, 4);
  ctx.fillRect(halfW - 7, barY, 4, 4);

  // Police Helmet (White with black tinted visor)
  ctx.fillStyle = '#f8fafc'; // White police helmet
  ctx.beginPath();
  ctx.arc(0, riderY + 7, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Dark Visor (facing forward)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, riderY + 5, 4, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();

  // 8. Sculpted Driver Seat & Lumbar Backrest
  const seatY = riderY + 14;
  ctx.fillStyle = '#0f172a'; // Leather seat
  drawRoundedRect(ctx, -6, seatY, 12, 10, 3);
  ctx.fill();

  // 9. Dual Touring Hard Panniers (Side Luggage Boxes)
  const boxW = 8;
  const boxH = 18;
  const boxY = seatY - 2;

  // Left Hard Box (White with Indonesian checkered pattern)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, -halfW + 1, boxY, boxW, boxH, 3);
  ctx.fill();
  ctx.stroke();

  // Right Hard Box
  drawRoundedRect(ctx, halfW - boxW - 1, boxY, boxW, boxH, 3);
  ctx.fill();
  ctx.stroke();

  // Checkered police decal on side boxes
  for (let b = boxY + 3; b < boxY + boxH - 5; b += 4) {
    ctx.fillStyle = '#0052cc';
    ctx.fillRect(-halfW + 2, b, boxW - 2, 2);
    ctx.fillRect(halfW - boxW, b, boxW - 2, 2);
  }

  // Red rear reflectors on boxes
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-halfW + 2, boxY + boxH - 2, boxW - 2, 2);
  ctx.fillRect(halfW - boxW, boxY + boxH - 2, boxW - 2, 2);

  // 10. Rear Tire & Exhaust Pipes
  const rearTireW = 7;
  const rearTireH = 12;
  const rearTireY = boxY + boxH - 8;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-rearTireW / 2, rearTireY, rearTireW, rearTireH);
  // Chrome exhaust pipes on sides
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-halfW + 8, boxY + 4, 2, boxH);
  ctx.fillRect(halfW - 10, boxY + 4, 2, boxH);

  // 11. EMERGENCY SIREN STROBES (Mounted on Rear Touring Poles)
  const strobeY = boxY + boxH - 4;

  // Left Strobe (RED)
  ctx.save();
  if (isLeftRed) {
    ctx.shadowColor = '#ff0037';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff0037';
  } else {
    ctx.fillStyle = '#7f051e';
  }
  ctx.fillRect(-halfW + 2, strobeY, 4, 4);
  ctx.restore();

  // Right Strobe (BLUE)
  ctx.save();
  if (isRightBlue) {
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#00f0ff';
  } else {
    ctx.fillStyle = '#0a367c';
  }
  ctx.fillRect(halfW - 6, strobeY, 4, 4);
  ctx.restore();

  ctx.restore();
}
