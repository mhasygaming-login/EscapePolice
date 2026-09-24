// Authentic Car Models Database & 2D Vector Rendering Engine
// Precision engineered top-down 2D canvas artwork for legendary sports & supercars

export interface CarModelData {
  id: string;
  brand: string;
  name: string;
  shortName: string;
  category: string;
  country: string;
  defaultColor: string;
  engine: string;
  hp: number;
  stats: {
    speed: number;      // Kecepatan Maksimum (0 - 100)
    horsepower: number; // Horse Power rating (0 - 100)
    handling: number;   // Manuver & Handling (0 - 100)
    accel?: number;     // Backward compatibility
    armor?: number;     // Backward compatibility
  };
  desc: string;
  features: string[];
}

export const CAR_CATALOG: CarModelData[] = [
  {
    id: 'civic_fl5',
    brand: 'Honda',
    name: 'Honda Civic Type R (FL5)',
    shortName: 'Civic Type R',
    category: 'Hot Hatch JDM',
    country: '🇯🇵 Jepang',
    defaultColor: '#f3f4f6',
    engine: '2.0L VTEC Turbo K20C1',
    hp: 315,
    stats: { speed: 85, horsepower: 75, handling: 94, accel: 89, armor: 78 },
    desc: 'Raja hot-hatch sirkuit dengan handling presisi, kap berventilasi, dan wing aerodinamis khas Type R.',
    features: ['Kap Mesin Vented', 'Wing Belakang Lengkung', '3 Knalpot Tengah', 'Badge Merah Type R'],
  },
  {
    id: 'toyota_supra',
    brand: 'Toyota',
    name: 'Toyota GR Supra (A90)',
    shortName: 'GR Supra A90',
    category: 'Sports Coupe',
    country: '🇯🇵 Jepang',
    defaultColor: '#f8fafc',
    engine: '3.0L Twin-Scroll Turbo B58',
    hp: 382,
    stats: { speed: 89, horsepower: 80, handling: 88, accel: 91, armor: 80 },
    desc: 'Coupe legendaris dengan atap double-bubble, kap mesin panjang memahat angin, dan ducktail spoiler.',
    features: ['Atap Double-Bubble', 'Ducktail Spoiler', 'Lampu Teardrop LED', 'Dual Exhaust Diffuser'],
  },
  {
    id: 'nissan_gtr',
    brand: 'Nissan',
    name: 'Nissan GT-R Nismo (R35)',
    shortName: 'GT-R Nismo',
    category: 'Supercar AWD',
    country: '🇯🇵 Jepang',
    defaultColor: '#ffffff',
    engine: '3.8L Twin-Turbo V6 VR38DETT',
    hp: 600,
    stats: { speed: 96, horsepower: 92, handling: 91, accel: 97, armor: 86 },
    desc: 'Godzilla versi Nismo dengan dual NACA duct pada kap karbon, swan-neck GT wing, dan 4 lampu bulat ikonik.',
    features: ['Dual NACA Hood Ducts', '4 Lampu Bulat Ikonik', 'Swan-Neck Carbon Wing', 'Garis Merah Nismo'],
  },
  {
    id: 'bmw_m4_gt3',
    brand: 'BMW',
    name: 'BMW M4 GT3 Motorsport',
    shortName: 'M4 GT3',
    category: 'FIA GT3 Racecar',
    country: '🇩🇪 Jerman',
    defaultColor: '#f1f5f9',
    engine: '3.0L M TwinPower Turbo P58',
    hp: 590,
    stats: { speed: 94, horsepower: 90, handling: 98, accel: 93, armor: 83 },
    desc: 'Monster balap FIA GT3 berfender widebody ekstrim, double kidney grille raksasa, dan sirip aero atap.',
    features: ['Grille Twin-Kidney Raksasa', 'Widebody Flared Fenders', 'Sayap GT3 Endplate', 'Ventilasi Kap Ekstrim'],
  },
  {
    id: 'lamborghini_aventador',
    brand: 'Lamborghini',
    name: 'Lamborghini Aventador SVJ',
    shortName: 'Aventador SVJ',
    category: 'V12 Hypercar',
    country: '🇮🇹 Italia',
    defaultColor: '#00b4d8',
    engine: '6.5L Naturally Aspirated V12',
    hp: 770,
    stats: { speed: 99, horsepower: 99, handling: 87, accel: 98, armor: 84 },
    desc: 'Siluet wedge razor-sharp agresif berdesain Y-signature, louvers penutup mesin V12, dan knalpot meriam tengah.',
    features: ['Bodi Wedge Ekstrim', 'Lampu Y-Signature', 'Louvers Kaca Mesin V12', 'Dual Central Cannon Exhaust'],
  },
  {
    id: 'porsche_911',
    brand: 'Porsche',
    name: 'Porsche 911 GT3 RS (992)',
    shortName: '911 GT3 RS',
    category: 'Track Precision',
    country: '🇩🇪 Jerman',
    defaultColor: '#ffffff',
    engine: '4.0L Naturally Aspirated Boxer-6',
    hp: 518,
    stats: { speed: 92, horsepower: 85, handling: 99, accel: 94, armor: 80 },
    desc: 'Mesin presisi sirkuit dengan sayap swan-neck aktif DRS, kisi-kisi fender depan, dan siluet khas 911.',
    features: ['Lampu Bulat Matrix', 'Fender Top Louvers', 'Active DRS Swan Wing', 'Bodi Belakang Lebar'],
  },
  {
    id: 'rx7_fd',
    brand: 'Mazda',
    name: 'Mazda RX-7 Spirit R (FD3S)',
    shortName: 'RX-7 Spirit R',
    category: 'Rotary Legend',
    country: '🇯🇵 Jepang',
    defaultColor: '#cbd5e1',
    engine: '1.3L Twin-Turbo 13B-REW Rotary',
    hp: 276,
    stats: { speed: 86, horsepower: 70, handling: 96, accel: 92, armor: 74 },
    desc: 'Ikon JDM legendaris berlekuk organik aerodinamis, lampu pop-up mulus, dan bobot ultra-lincah.',
    features: ['Garis Bodi Organik', 'Pop-Up Headlights', 'Smoked Lightbar Belakang', 'Handling Gesit'],
  },
  {
    id: 'mustang_gt500',
    brand: 'Ford',
    name: 'Ford Mustang Shelby GT500',
    shortName: 'Shelby GT500',
    category: 'American Muscle',
    country: '🇺🇸 Amerika',
    defaultColor: '#0284c7',
    engine: '5.2L Supercharged Predator V8',
    hp: 760,
    stats: { speed: 95, horsepower: 97, handling: 82, accel: 95, armor: 91 },
    desc: 'Kekuatan muscle car murni dengan kap berventilasi agresif, garis balap ganda, dan bodi kokoh perkasa.',
    features: ['Kap Mesin Vented Raksasa', 'Twin Racing Stripes', 'Bodi Kokoh Berotot', 'Quad Exhaust Pipes'],
  },
];

// Helper to normalize any legacy or unknown model ID
export function getCarModel(id?: string): CarModelData {
  if (!id) return CAR_CATALOG[0];
  const found = CAR_CATALOG.find(c => c.id === id);
  if (found) return found;

  // Legacy mappings
  if (id === 'hunter') return CAR_CATALOG[0]; // Civic
  if (id === 'phantom') return CAR_CATALOG[2]; // GTR
  if (id === 'cruiser') return CAR_CATALOG[7]; // Mustang
  if (id === 'vortex') return CAR_CATALOG[1]; // Supra

  return CAR_CATALOG[0];
}

interface DrawCarOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  model?: string;
  color?: string;
  isNitro?: boolean;
  frameCount?: number;
  showShadow?: boolean;
  showUnderglow?: boolean;
}

// Utility: Draw rounded rectangle path with cross-browser fallback
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  const radius = Math.max(0, Math.min(r, Math.min(w / 2, h / 2)));
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

/**
 * Meticulously renders a 2D top-down sports / super car with authentic automotive details.
 * Coordinates (x, y) represent the center of the car.
 */
export function drawCar2D(ctx: CanvasRenderingContext2D, options: DrawCarOptions) {
  const {
    x,
    y,
    width: w,
    height: h,
    model = 'civic_fl5',
    color = '#00f0ff',
    isNitro = false,
    frameCount = 0,
    showShadow = true,
    showUnderglow = true,
  } = options;

  const car = getCarModel(model);
  const halfW = w / 2;
  const halfH = h / 2;

  ctx.save();
  ctx.translate(x, y);

  // 1. Underglow / Glow effect
  if (showUnderglow) {
    ctx.save();
    ctx.shadowColor = isNitro ? '#ff0055' : color;
    ctx.shadowBlur = isNitro ? 22 : 14;
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fillRect(-halfW + 4, -halfH + 6, w - 8, h - 12);
    ctx.restore();
  }

  // 2. Contact Ground Shadow
  if (showShadow) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    drawRoundRect(ctx, -halfW + 2, -halfH + 4, w, h, 8);
    ctx.fill();
    ctx.restore();
  }

  // 3. Wheels & Tires (Detailed tread & visible brake calipers)
  const wheelW = Math.max(4, Math.round(w * 0.12));
  const wheelH = Math.max(12, Math.round(h * 0.2));
  const wheelInsetYFront = -halfH + Math.round(h * 0.22);
  const wheelInsetYRear = halfH - Math.round(h * 0.25);

  const drawWheel = (wx: number, wy: number) => {
    // Tire
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(wx - wheelW / 2, wy - wheelH / 2, wheelW, wheelH);
    // Rim / Brake Caliper
    ctx.fillStyle = '#ef4444'; // Red sport caliper
    ctx.fillRect(wx - wheelW / 4, wy - wheelH / 4, wheelW / 2, wheelH / 2);
    // Rim Center
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(wx - 1, wy - wheelH / 6, 2, wheelH / 3);
  };

  drawWheel(-halfW - 1, wheelInsetYFront);
  drawWheel(halfW + 1, wheelInsetYFront);
  drawWheel(-halfW - 1, wheelInsetYRear);
  drawWheel(halfW + 1, wheelInsetYRear);

  // 4. Main Body Render by Model
  switch (car.id) {
    // ==========================================
    // 1. HONDA CIVIC TYPE R (FL5)
    // ==========================================
    case 'civic_fl5': {
      // Body gradient
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.65, color);
      bodyGrad.addColorStop(1, '#111827');
      ctx.fillStyle = bodyGrad;

      // Hot-hatch silhouette
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.7, -halfH); // Front nose left
      ctx.lineTo(halfW * 0.7, -halfH); // Front nose right
      ctx.quadraticCurveTo(halfW * 0.95, -halfH * 0.7, halfW * 0.95, -halfH * 0.3); // Front fender
      ctx.lineTo(halfW * 0.92, halfH * 0.4); // Side sill
      ctx.quadraticCurveTo(halfW, halfH * 0.8, halfW * 0.85, halfH); // Rear bumper flare
      ctx.lineTo(-halfW * 0.85, halfH);
      ctx.quadraticCurveTo(-halfW, halfH * 0.8, -halfW * 0.92, halfH * 0.4);
      ctx.lineTo(-halfW * 0.95, -halfH * 0.3);
      ctx.quadraticCurveTo(-halfW * 0.95, -halfH * 0.7, -halfW * 0.7, -halfH);
      ctx.closePath();
      ctx.fill();

      // Black front gloss splitter & grille
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 0.65, -halfH, w * 0.65, 4);
      // Red Type R badge
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, -halfH + 1, 4, 3);

      // Functional hood scoop / vent
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW * 0.25, -halfH * 0.65, w * 0.25, 4);

      // Windshield & Hatch Greenhouse
      ctx.fillStyle = '#0a0f1d';
      // Front windshield
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.65, -halfH * 0.35);
      ctx.lineTo(halfW * 0.65, -halfH * 0.35);
      ctx.lineTo(halfW * 0.75, -halfH * 0.05);
      ctx.lineTo(-halfW * 0.75, -halfH * 0.05);
      ctx.closePath();
      ctx.fill();

      // Roof
      ctx.fillStyle = color;
      ctx.fillRect(-halfW * 0.65, -halfH * 0.05, w * 0.65, h * 0.35);

      // Rear hatch window
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.68, halfH * 0.3);
      ctx.lineTo(halfW * 0.68, halfH * 0.3);
      ctx.lineTo(halfW * 0.6, halfH * 0.65);
      ctx.lineTo(-halfW * 0.6, halfH * 0.65);
      ctx.closePath();
      ctx.fill();

      // High-mount Arched Rear Wing
      ctx.fillStyle = '#090d16';
      // Left and right pylons
      ctx.fillRect(-halfW * 0.6, halfH * 0.75, 3, 7);
      ctx.fillRect(halfW * 0.6 - 3, halfH * 0.75, 3, 7);
      // Wing blade
      ctx.fillRect(-halfW * 0.85, halfH * 0.82, w * 0.85, 4);

      // Triple Center Exhaust tips
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-4, halfH - 1, 2, 0, Math.PI * 2);
      ctx.arc(0, halfH - 1, 2.5, 0, Math.PI * 2); // Center is slightly larger!
      ctx.arc(4, halfH - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // Headlights (Modern sharp LED bars)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-halfW * 0.7, -halfH + 2, 8, 4);
      ctx.fillRect(halfW * 0.7 - 8, -halfH + 2, 8, 4);

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-halfW * 0.75, halfH - 4, 10, 3);
      ctx.fillRect(halfW * 0.75 - 10, halfH - 4, 10, 3);
      break;
    }

    // ==========================================
    // 2. TOYOTA GR SUPRA (A90)
    // ==========================================
    case 'toyota_supra': {
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, '#0c1a24');
      ctx.fillStyle = bodyGrad;

      // Sculpted coupe shape: Long hood, tucked cabin, wide rear hips
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.6, -halfH); // Nose
      ctx.lineTo(halfW * 0.6, -halfH);
      ctx.quadraticCurveTo(halfW * 0.88, -halfH * 0.6, halfW * 0.85, -halfH * 0.15); // Long hood side
      ctx.quadraticCurveTo(halfW * 0.75, halfH * 0.15, halfW * 0.98, halfH * 0.6); // Wide muscular rear hips
      ctx.quadraticCurveTo(halfW * 0.85, halfH, halfW * 0.65, halfH); // Ducktail corner
      ctx.lineTo(-halfW * 0.65, halfH);
      ctx.quadraticCurveTo(-halfW * 0.85, halfH, -halfW * 0.98, halfH * 0.6);
      ctx.quadraticCurveTo(-halfW * 0.75, halfH * 0.15, -halfW * 0.85, -halfH * 0.15);
      ctx.quadraticCurveTo(-halfW * 0.88, -halfH * 0.6, -halfW * 0.6, -halfH);
      ctx.closePath();
      ctx.fill();

      // Front splitter and intake cuts
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 0.5, -halfH, w * 0.5, 3);

      // Hood sculpt lines
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.4, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.2, -halfH * 0.2);
      ctx.moveTo(halfW * 0.4, -halfH * 0.8);
      ctx.lineTo(halfW * 0.2, -halfH * 0.2);
      ctx.stroke();

      // Windshield (Cockpit set back)
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.55, -halfH * 0.1);
      ctx.lineTo(halfW * 0.55, -halfH * 0.1);
      ctx.lineTo(halfW * 0.65, halfH * 0.18);
      ctx.lineTo(-halfW * 0.65, halfH * 0.18);
      ctx.closePath();
      ctx.fill();

      // Iconic Double-Bubble Roof
      ctx.fillStyle = color;
      ctx.fillRect(-halfW * 0.55, halfH * 0.18, w * 0.55, h * 0.28);
      // Double bubble indent
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(-halfW * 0.1, halfH * 0.18, w * 0.1, h * 0.28);

      // Rear hatch glass
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.52, halfH * 0.46);
      ctx.lineTo(halfW * 0.52, halfH * 0.46);
      ctx.lineTo(halfW * 0.45, halfH * 0.75);
      ctx.lineTo(-halfW * 0.45, halfH * 0.75);
      ctx.closePath();
      ctx.fill();

      // Integrated Ducktail Spoiler lip
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 0.65, halfH * 0.88, w * 0.65, 4);

      // Dual large exhausts
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(-halfW * 0.45, halfH - 1, 2.5, 0, Math.PI * 2);
      ctx.arc(halfW * 0.45, halfH - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Teardrop LED headlights
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.ellipse(-halfW * 0.65, -halfH + 4, 4, 7, -0.3, 0, Math.PI * 2);
      ctx.ellipse(halfW * 0.65, -halfH + 4, 4, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Slim horizontal taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-halfW * 0.7, halfH - 5, 8, 3);
      ctx.fillRect(halfW * 0.7 - 8, halfH - 5, 8, 3);
      break;
    }

    // ==========================================
    // 3. NISSAN GT-R NISMO (R35)
    // ==========================================
    case 'nissan_gtr': {
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, '#111827');
      ctx.fillStyle = bodyGrad;

      // Muscular Godzilla silhouette
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.75, -halfH);
      ctx.lineTo(halfW * 0.75, -halfH);
      ctx.lineTo(halfW * 0.96, -halfH * 0.6);
      ctx.lineTo(halfW * 0.92, halfH * 0.4);
      ctx.lineTo(halfW * 0.98, halfH * 0.75); // Flared rear quarter
      ctx.lineTo(halfW * 0.8, halfH);
      ctx.lineTo(-halfW * 0.8, halfH);
      ctx.lineTo(-halfW * 0.98, halfH * 0.75);
      ctx.lineTo(-halfW * 0.92, halfH * 0.4);
      ctx.lineTo(-halfW * 0.96, -halfH * 0.6);
      ctx.closePath();
      ctx.fill();

      // Red Nismo Pinstripe trim (Front Splitter & Skirts)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Carbon Roof Panel
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfW * 0.65, -halfH * 0.1, w * 0.65, h * 0.4);

      // Dual Triangular NACA Hood Ducts (Iconic R35 feature)
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      // Left NACA duct
      ctx.moveTo(-halfW * 0.35, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.2, -halfH * 0.45);
      ctx.lineTo(-halfW * 0.38, -halfH * 0.45);
      ctx.closePath();
      ctx.fill();
      // Right NACA duct
      ctx.beginPath();
      ctx.moveTo(halfW * 0.35, -halfH * 0.7);
      ctx.lineTo(halfW * 0.2, -halfH * 0.45);
      ctx.lineTo(halfW * 0.38, -halfH * 0.45);
      ctx.closePath();
      ctx.fill();

      // Windshield & Rear glass
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.68, -halfH * 0.4);
      ctx.lineTo(halfW * 0.68, -halfH * 0.4);
      ctx.lineTo(halfW * 0.72, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.72, -halfH * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-halfW * 0.65, halfH * 0.3);
      ctx.lineTo(halfW * 0.65, halfH * 0.3);
      ctx.lineTo(halfW * 0.58, halfH * 0.65);
      ctx.lineTo(-halfW * 0.58, halfH * 0.65);
      ctx.closePath();
      ctx.fill();

      // High Swan-Neck GT Carbon Wing
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 0.92, halfH * 0.75, w * 0.92, 5); // Carbon wing blade
      ctx.fillStyle = '#ef4444'; // Red wing endplates
      ctx.fillRect(-halfW * 0.94, halfH * 0.73, 3, 8);
      ctx.fillRect(halfW * 0.94 - 3, halfH * 0.73, 3, 8);

      // The Legendary 4 Circular Taillights (2 each side)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-halfW * 0.6, halfH - 3, 2.5, 0, Math.PI * 2);
      ctx.arc(-halfW * 0.35, halfH - 3, 2.5, 0, Math.PI * 2);
      ctx.arc(halfW * 0.35, halfH - 3, 2.5, 0, Math.PI * 2);
      ctx.arc(halfW * 0.6, halfH - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Quad Burnt-Titanium Exhausts
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-halfW * 0.7, halfH - 1, 3, 2);
      ctx.fillRect(-halfW * 0.55, halfH - 1, 3, 2);
      ctx.fillRect(halfW * 0.55 - 3, halfH - 1, 3, 2);
      ctx.fillRect(halfW * 0.7 - 3, halfH - 1, 3, 2);

      // Angled aggressive headlights
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-halfW * 0.75, -halfH + 2, 7, 5);
      ctx.fillRect(halfW * 0.75 - 7, -halfH + 2, 7, 5);
      break;
    }

    // ==========================================
    // 4. BMW M4 GT3 MOTORSPORT
    // ==========================================
    case 'bmw_m4_gt3': {
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, '#05101a');
      ctx.fillStyle = bodyGrad;

      // Ultra-wide flared GT3 racecar profile
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.7, -halfH);
      ctx.lineTo(halfW * 0.7, -halfH);
      ctx.lineTo(halfW * 1.02, -halfH * 0.6); // Massive flared front GT3 fender
      ctx.lineTo(halfW * 0.9, 0);
      ctx.lineTo(halfW * 1.05, halfH * 0.55); // Massive flared rear GT3 box arch
      ctx.lineTo(halfW * 0.85, halfH);
      ctx.lineTo(-halfW * 0.85, halfH);
      ctx.lineTo(-halfW * 1.05, halfH * 0.55);
      ctx.lineTo(-halfW * 0.9, 0);
      ctx.lineTo(-halfW * 1.02, -halfH * 0.6);
      ctx.closePath();
      ctx.fill();

      // Oversized Vertical Kidney Grille (BMW M4 signature)
      ctx.fillStyle = '#090d16';
      // Left kidney
      ctx.fillRect(-halfW * 0.32, -halfH, halfW * 0.28, 8);
      // Right kidney
      ctx.fillRect(halfW * 0.04, -halfH, halfW * 0.28, 8);
      // Grille mesh lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(-halfW * 0.32, -halfH, halfW * 0.28, 8);
      ctx.strokeRect(halfW * 0.04, -halfH, halfW * 0.28, 8);

      // Deep hood cooling louvers / heat extractors
      ctx.fillStyle = '#0f172a';
      for (let l = 0; l < 4; l++) {
        ctx.fillRect(-halfW * 0.5, -halfH * 0.65 + l * 4, w * 0.5, 2);
      }

      // Windshield & Carbon Roof
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.7, -halfH * 0.3);
      ctx.lineTo(halfW * 0.7, -halfH * 0.3);
      ctx.lineTo(halfW * 0.75, 0);
      ctx.lineTo(-halfW * 0.75, 0);
      ctx.closePath();
      ctx.fill();

      // Roof with Shark Fin Antenna
      ctx.fillStyle = color;
      ctx.fillRect(-halfW * 0.65, 0, w * 0.65, h * 0.3);
      // Telemetry shark fin
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-1, h * 0.05, 2, 10);

      // Rear window
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(-halfW * 0.6, h * 0.3, w * 0.6, h * 0.2);

      // Colossal FIA GT3 Carbon Rear Wing
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 1.05, halfH * 0.75, w * 1.05, 5); // Huge wingspan
      // Wing Endplates
      ctx.fillStyle = '#38bdf8'; // Cyan M-Performance color
      ctx.fillRect(-halfW * 1.08, halfH * 0.7, 3, 10);
      ctx.fillRect(halfW * 1.08 - 3, halfH * 0.7, 3, 10);

      // LED Headlights (C-shaped laser eyes)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-halfW * 0.75, -halfH + 3, 9, 3);
      ctx.fillRect(halfW * 0.75 - 9, -halfH + 3, 9, 3);

      // Taillights (OLED dragon tail bars)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-halfW * 0.75, halfH - 4, 12, 3);
      ctx.fillRect(halfW * 0.75 - 12, halfH - 4, 12, 3);
      break;
    }

    // ==========================================
    // 5. LAMBORGHINI AVENTADOR SVJ
    // ==========================================
    case 'lamborghini_aventador': {
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.65, color);
      bodyGrad.addColorStop(1, '#081a28');
      ctx.fillStyle = bodyGrad;

      // Extreme sharp razor wedge silhouette
      ctx.beginPath();
      ctx.moveTo(0, -halfH); // Sharp pointed nose tip
      ctx.lineTo(halfW * 0.7, -halfH * 0.7);
      ctx.lineTo(halfW * 0.95, -halfH * 0.35); // Front wheel arch
      ctx.lineTo(halfW * 0.85, 0); // Cockpit waist indent
      ctx.lineTo(halfW * 1.05, halfH * 0.45); // Giant angular side air intakes
      ctx.lineTo(halfW * 0.85, halfH); // Rear diffuser corner
      ctx.lineTo(-halfW * 0.85, halfH);
      ctx.lineTo(-halfW * 1.05, halfH * 0.45);
      ctx.lineTo(-halfW * 0.85, 0);
      ctx.lineTo(-halfW * 0.95, -halfH * 0.35);
      ctx.lineTo(-halfW * 0.7, -halfH * 0.7);
      ctx.closePath();
      ctx.fill();

      // Sharp Y-shaped Front Headlights
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Left Y light
      ctx.moveTo(-halfW * 0.6, -halfH * 0.65);
      ctx.lineTo(-halfW * 0.4, -halfH * 0.45);
      ctx.moveTo(-halfW * 0.55, -halfH * 0.45);
      ctx.lineTo(-halfW * 0.4, -halfH * 0.45);
      // Right Y light
      ctx.moveTo(halfW * 0.6, -halfH * 0.65);
      ctx.lineTo(halfW * 0.4, -halfH * 0.45);
      ctx.moveTo(halfW * 0.55, -halfH * 0.45);
      ctx.lineTo(halfW * 0.4, -halfH * 0.45);
      ctx.stroke();

      // Low Cockpit Glass
      ctx.fillStyle = '#060c1a';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.5, -halfH * 0.3);
      ctx.lineTo(halfW * 0.5, -halfH * 0.3);
      ctx.lineTo(halfW * 0.6, 0);
      ctx.lineTo(-halfW * 0.6, 0);
      ctx.closePath();
      ctx.fill();

      // Rear Mid-Engine Bay with Hexagonal Louvers
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.5, 0);
      ctx.lineTo(halfW * 0.5, 0);
      ctx.lineTo(halfW * 0.35, halfH * 0.6);
      ctx.lineTo(-halfW * 0.35, halfH * 0.6);
      ctx.closePath();
      ctx.fill();
      // Glass engine louvers
      ctx.fillStyle = '#38bdf8';
      for (let g = 0; g < 3; g++) {
        ctx.fillRect(-halfW * 0.3, h * 0.05 + g * 7, w * 0.3, 2);
      }

      // Dual High-Exit Central Cannon Exhausts
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-3.5, halfH * 0.85, 2.5, 0, Math.PI * 2);
      ctx.arc(3.5, halfH * 0.85, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // ALA Active Aerodynamics SVJ Rear Carbon Wing
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 0.85, halfH * 0.88, w * 0.85, 4);
      // Center Pylon
      ctx.fillRect(-1.5, halfH * 0.7, 3, 10);

      // Y-shaped rear taillights
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.75, halfH - 3);
      ctx.lineTo(-halfW * 0.45, halfH - 3);
      ctx.moveTo(halfW * 0.45, halfH - 3);
      ctx.lineTo(halfW * 0.75, halfH - 3);
      ctx.stroke();
      break;
    }

    // ==========================================
    // 6. PORSCHE 911 GT3 RS
    // ==========================================
    case 'porsche_911': {
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, '#111827');
      ctx.fillStyle = bodyGrad;

      // Iconic 911 teardrop silhouette with extra wide rear hips
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.65, -halfH);
      ctx.lineTo(halfW * 0.65, -halfH);
      ctx.quadraticCurveTo(halfW * 0.9, -halfH * 0.5, halfW * 0.85, -halfH * 0.1);
      ctx.quadraticCurveTo(halfW * 0.7, halfH * 0.2, halfW * 1.05, halfH * 0.65); // Wide rear hips
      ctx.quadraticCurveTo(halfW * 0.9, halfH, halfW * 0.7, halfH);
      ctx.lineTo(-halfW * 0.7, halfH);
      ctx.quadraticCurveTo(-halfW * 0.9, halfH, -halfW * 1.05, halfH * 0.65);
      ctx.quadraticCurveTo(-halfW * 0.7, halfH * 0.2, -halfW * 0.85, -halfH * 0.1);
      ctx.quadraticCurveTo(-halfW * 0.9, -halfH * 0.5, -halfW * 0.65, -halfH);
      ctx.closePath();
      ctx.fill();

      // Front Fender Pressure Relief Louvers (GT3 RS hallmark)
      ctx.fillStyle = '#090d16';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-halfW * 0.85, -halfH * 0.6 + i * 3, 5, 1.5);
        ctx.fillRect(halfW * 0.85 - 5, -halfH * 0.6 + i * 3, 5, 1.5);
      }

      // Classic Round Matrix Headlights
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(-halfW * 0.6, -halfH * 0.75, 4, 0, Math.PI * 2);
      ctx.arc(halfW * 0.6, -halfH * 0.75, 4, 0, Math.PI * 2);
      ctx.fill();

      // Greenhouse Cockpit
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.55, -halfH * 0.25);
      ctx.lineTo(halfW * 0.55, -halfH * 0.25);
      ctx.lineTo(halfW * 0.6, halfH * 0.35);
      ctx.lineTo(-halfW * 0.6, halfH * 0.35);
      ctx.closePath();
      ctx.fill();

      // Massive Top-Mounted Swan-Neck Rear Wing
      ctx.fillStyle = '#090d16';
      // Left and right swan necks
      ctx.fillRect(-halfW * 0.45, halfH * 0.55, 3, 14);
      ctx.fillRect(halfW * 0.45 - 3, halfH * 0.55, 3, 14);
      // Wing Blade
      ctx.fillRect(-halfW * 1.05, halfH * 0.82, w * 1.05, 5);

      // Central Dual Titanium Exhausts
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-3, halfH - 1, 2.5, 0, Math.PI * 2);
      ctx.arc(3, halfH - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Continuous full-width LED taillight bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-halfW * 0.65, halfH - 4, w * 0.65, 2.5);
      break;
    }

    // ==========================================
    // 7. MAZDA RX-7 SPIRIT R (FD3S)
    // ==========================================
    case 'rx7_fd': {
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, '#111827');
      ctx.fillStyle = bodyGrad;

      // Pure organic smooth curvature
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.6, -halfH);
      ctx.quadraticCurveTo(0, -halfH * 1.02, halfW * 0.6, -halfH);
      ctx.quadraticCurveTo(halfW * 0.9, -halfH * 0.5, halfW * 0.85, 0);
      ctx.quadraticCurveTo(halfW * 0.95, halfH * 0.6, halfW * 0.75, halfH);
      ctx.lineTo(-halfW * 0.75, halfH);
      ctx.quadraticCurveTo(-halfW * 0.95, halfH * 0.6, -halfW * 0.85, 0);
      ctx.quadraticCurveTo(-halfW * 0.9, -halfH * 0.5, -halfW * 0.6, -halfH);
      ctx.closePath();
      ctx.fill();

      // Pop-up Headlight Outlines
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-halfW * 0.65, -halfH * 0.85, 9, 7);
      ctx.strokeRect(halfW * 0.65 - 9, -halfH * 0.85, 9, 7);

      // Bubble Greenhouse Glass
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.ellipse(0, 0, halfW * 0.6, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Curved Spirit R Wing
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.75, halfH * 0.8);
      ctx.quadraticCurveTo(0, halfH * 0.88, halfW * 0.75, halfH * 0.8);
      ctx.lineTo(halfW * 0.75, halfH * 0.86);
      ctx.quadraticCurveTo(0, halfH * 0.94, -halfW * 0.75, halfH * 0.86);
      ctx.closePath();
      ctx.fill();

      // Wraparound smoked lightbar
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-halfW * 0.65, halfH - 4, w * 0.65, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-halfW * 0.55, halfH - 4, 6, 3);
      ctx.fillRect(halfW * 0.55 - 6, halfH - 4, 6, 3);
      break;
    }

    // ==========================================
    // 8. FORD MUSTANG SHELBY GT500
    // ==========================================
    case 'mustang_gt500':
    default: {
      const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bodyGrad;

      // Broad-shouldered muscle car stance
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.8, -halfH);
      ctx.lineTo(halfW * 0.8, -halfH);
      ctx.lineTo(halfW * 0.95, -halfH * 0.6);
      ctx.lineTo(halfW * 0.92, halfH * 0.4);
      ctx.lineTo(halfW * 0.98, halfH * 0.8);
      ctx.lineTo(halfW * 0.85, halfH);
      ctx.lineTo(-halfW * 0.85, halfH);
      ctx.lineTo(-halfW * 0.98, halfH * 0.8);
      ctx.lineTo(-halfW * 0.92, halfH * 0.4);
      ctx.lineTo(-halfW * 0.95, -halfH * 0.6);
      ctx.closePath();
      ctx.fill();

      // Iconic Dual Le Mans Racing Stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-halfW * 0.25, -halfH, halfW * 0.2, h);
      ctx.fillRect(halfW * 0.05, -halfH, halfW * 0.2, h);

      // Huge hood heat extractor vent
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 0.4, -halfH * 0.65, w * 0.4, 8);

      // Windshield & Fastback greenhouse
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(-halfW * 0.7, -halfH * 0.2, w * 0.7, h * 0.5);

      // Carbon Track Pack Rear Wing
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW * 0.9, halfH * 0.82, w * 0.9, 5);

      // Tri-bar Taillights (Mustang 3-slat signature)
      ctx.fillStyle = '#ef4444';
      for (let s = 0; s < 3; s++) {
        ctx.fillRect(-halfW * 0.75 + s * 4, halfH - 4, 2.5, 3);
        ctx.fillRect(halfW * 0.75 - 8 + s * 4, halfH - 4, 2.5, 3);
      }

      // Quad Exhaust tips
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-halfW * 0.75, halfH - 1, 3, 2);
      ctx.fillRect(-halfW * 0.6, halfH - 1, 3, 2);
      ctx.fillRect(halfW * 0.6 - 3, halfH - 1, 3, 2);
      ctx.fillRect(halfW * 0.75 - 3, halfH - 1, 3, 2);
      break;
    }
  }

  // 5. Nitro Exhaust Flame Effect (when boosting)
  if (isNitro) {
    ctx.save();
    const flameFlicker = Math.sin(frameCount * 0.8) * 4;
    const flameLen = 22 + flameFlicker;

    // Center dual flames
    const drawFlame = (fx: number) => {
      const fGrad = ctx.createLinearGradient(fx, halfH, fx, halfH + flameLen);
      fGrad.addColorStop(0, '#ffffff');
      fGrad.addColorStop(0.3, '#38bdf8');
      fGrad.addColorStop(0.7, '#a855f7');
      fGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.moveTo(fx - 4, halfH);
      ctx.quadraticCurveTo(fx, halfH + flameLen * 0.6, fx, halfH + flameLen);
      ctx.quadraticCurveTo(fx, halfH + flameLen * 0.6, fx + 4, halfH);
      ctx.closePath();
      ctx.fill();
    };

    drawFlame(-halfW * 0.35);
    drawFlame(halfW * 0.35);
    ctx.restore();
  }

  ctx.restore();
}
