// Type Definitions for Escape Police: 5 Maps System & 3D Environment Rendering

export type GameMapId = 'kota' | 'salju' | 'padang_pasir' | 'hutan' | 'pegunungan';

export type CameraViewMode = '3d' | '2d';

export interface MapData {
  id: GameMapId;
  name: string;
  title: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: string;
  themeColor: string;
  accentColor: string;
  badgeBg: string;
  previewImage: string;
  backgroundImage: string;
  
  // Environment attributes
  surfaceName: string;
  weatherName: string;
  roadsideTheme: string;
  roadsideElements: string[];
  specialTrait: string;
  specialTraitDesc: string;
  difficultyRating: number;

  // Audio atmosphere
  ambientSoundtrack: string;

  // Visual Palette
  skyGradient: [string, string, string]; // Top, Mid, Horizon
  horizonType: 'skyline' | 'snow_mountains' | 'canyons' | 'forest_canopy' | 'alpine_peaks';
  roadColor: string;
  roadTexture: 'wet_neon' | 'ice_frost' | 'cracked_sand' | 'moss_asphalt' | 'mountain_rock';
  shoulderColor: string;
  shoulderDetailColor: string;
  curbColor1: string;
  curbColor2: string;
  laneColor: string;
  guardrailColor: string;
  fogColor: string;

  // Weather & Particles in 3D space
  particleType: 'neon_rain' | 'snowfall' | 'sandstorm' | 'fireflies' | 'cloud_mist';
  particleCount: number;
  particleColor: string;
  particleSpeed: number;

  // Gameplay Modifiers - Seragam untuk semua maps (hanya vibes yang berbeda)
  driftFactor: number;
  nitroMultiplier: number;
  heatRateMultiplier: number;
  scoreMultiplier: number;
}

export const MAPS_LIST: MapData[] = [
  {
    id: 'kota',
    name: 'Metropolis Kota',
    title: 'Metropolis Neocities',
    shortName: 'Kota',
    tagline: 'Jalan Tol Layang Neocities dengan Gedung Pencakar Langit & Mobil Terbang',
    description: 'Pengejaran menembus jalan tol futuristik di antara gedung pencakar langit berhias lampu neon dan aspal basah berkilau.',
    icon: '🏙️',
    themeColor: '#00f0ff',
    accentColor: '#ff007f',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    previewImage: '/maps/kota.jpg',
    backgroundImage: '/maps/kota.jpg',
    surfaceName: 'Aspal Basah Cyberpunk',
    weatherName: 'Hujan Neon Ringan',
    roadsideTheme: 'Gedung Pencakar Langit Cyberpunk',
    roadsideElements: ['Gedung Bertingkat', 'Jendela Matrix Menyala', 'Billboard Neon', 'Tiang Lampu Jalan', 'Antena Atap'],
    specialTrait: 'Vibes Neocities Modern',
    specialTraitDesc: 'Atmosfer metropolis malam dengan pancaran lampu neon dan aspal basah berkilau.',
    difficultyRating: 3,
    ambientSoundtrack: 'Synthwave Night Driver',
    skyGradient: ['#04060f', '#0a0d24', '#15193b'],
    horizonType: 'skyline',
    roadColor: '#0f111a',
    roadTexture: 'wet_neon',
    shoulderColor: '#090a12',
    shoulderDetailColor: '#1a1d2e',
    curbColor1: '#ff2d6b',
    curbColor2: '#dfe6e9',
    laneColor: '#00f0ff',
    guardrailColor: 'rgba(0, 240, 255, 0.45)',
    fogColor: 'rgba(8, 12, 28, 0.75)',
    particleType: 'neon_rain',
    particleCount: 75,
    particleColor: '#38bdf8',
    particleSpeed: 18,
    driftFactor: 1.0,
    nitroMultiplier: 1.0,
    heatRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  {
    id: 'salju',
    name: 'Puncak Salju',
    title: 'Arctic Snow Tundra',
    shortName: 'Salju',
    tagline: 'Aspal Es Dingin di Tengah Butiran Salju, Kabin Hangat & Aurora Borealis',
    description: 'Pemandangan eksotis dataran kutub beku di bawah pendaran tirai Aurora Borealis dan hutan pinus salju.',
    icon: '❄️',
    themeColor: '#38bdf8',
    accentColor: '#a7f3d0',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    previewImage: '/maps/salju.jpg',
    backgroundImage: '/maps/salju.jpg',
    surfaceName: 'Aspal Dingin Bersalju',
    weatherName: 'Hujan Salju & Aurora',
    roadsideTheme: 'Hamparan Salju & Hutan Pinus Beku',
    roadsideElements: ['Salju Tebal', 'Pohon Pinus Salju', 'Kristal Es Glasier', 'Gundukan Salju', 'Patok Badai Merah-Putih'],
    specialTrait: 'Vibes Arktik & Aurora',
    specialTraitDesc: 'Atmosfer kutub es dengan partikel salju melayang lembut di bawah tirai aurora.',
    difficultyRating: 3,
    ambientSoundtrack: 'Glacial Chill Pulse',
    skyGradient: ['#020814', '#071b30', '#0e3a4f'],
    horizonType: 'snow_mountains',
    roadColor: '#162232',
    roadTexture: 'ice_frost',
    shoulderColor: '#d6e4f0',
    shoulderDetailColor: '#bad0e8',
    curbColor1: '#0284c7',
    curbColor2: '#f0f9ff',
    laneColor: '#e0f2fe',
    guardrailColor: 'rgba(56, 189, 248, 0.65)',
    fogColor: 'rgba(12, 28, 48, 0.82)',
    particleType: 'snowfall',
    particleCount: 90,
    particleColor: '#ffffff',
    particleSpeed: 6,
    driftFactor: 1.0,
    nitroMultiplier: 1.0,
    heatRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  {
    id: 'padang_pasir',
    name: 'Padang Pasir',
    title: 'Redrock Desert Canyon',
    shortName: 'Padang Pasir',
    tagline: 'Trek Ngarai Berbatu, Gurun Pasir Emas & Tebing Monolit Senja',
    description: 'Melintasi pemandangan ngarai batu merah dan bukit pasir emas di bawah langit senja membara.',
    icon: '🏜️',
    themeColor: '#f59e0b',
    accentColor: '#ef4444',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    previewImage: '/maps/padang_pasir.jpg',
    backgroundImage: '/maps/padang_pasir.jpg',
    surfaceName: 'Aspal Gurun Berdebu',
    weatherName: 'Kabut Pasir & Senja Emas',
    roadsideTheme: 'Bukit Pasir Emas & Kaktus Ngarai',
    roadsideElements: ['Gundukan Pasir Emas', 'Pohon Kaktus Saguaro', 'Bebatuan Ngarai Merah', 'Semak Gurun Tumbleweed'],
    specialTrait: 'Vibes Gurun & Senja Hangat',
    specialTraitDesc: 'Atmosfer eksotis gurun pasir dengan rona senja tembaga dan partikel pasir hangat.',
    difficultyRating: 3,
    ambientSoundtrack: 'Desert Mirage Chase',
    skyGradient: ['#1c0a07', '#3d160c', '#63250e'],
    horizonType: 'canyons',
    roadColor: '#1e1410',
    roadTexture: 'cracked_sand',
    shoulderColor: '#965a25',
    shoulderDetailColor: '#b47032',
    curbColor1: '#ea580c',
    curbColor2: '#fde047',
    laneColor: '#fbbf24',
    guardrailColor: 'rgba(245, 158, 11, 0.55)',
    fogColor: 'rgba(48, 20, 10, 0.8)',
    particleType: 'sandstorm',
    particleCount: 85,
    particleColor: '#fbbf24',
    particleSpeed: 22,
    driftFactor: 1.0,
    nitroMultiplier: 1.0,
    heatRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  {
    id: 'hutan',
    name: 'Hutan Neon',
    title: 'Bioluminescent Redwood Forest',
    shortName: 'Hutan',
    tagline: 'Jalan Berkelok Basah di Bawah Lampu Neon Hijau & Kanopi Rimbun',
    description: 'Menyusuri pemandangan hutan hujan tropis basah dengan dekorasi lampu neon hijau dan magenta yang melingkari pepohonan.',
    icon: '🌲',
    themeColor: '#10b981',
    accentColor: '#06b6d4',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    previewImage: '/maps/hutan.jpg',
    backgroundImage: '/maps/hutan.jpg',
    surfaceName: 'Aspal Hijau Basah Berkilau',
    weatherName: 'Hujan Rintik & Neon Glow',
    roadsideTheme: 'Hutan Kanopi Purba & Jamur Menyala',
    roadsideElements: ['Pohon Kanopi Raksasa', 'Lampu Tabung Neon', 'Lampion Bercahaya', 'Semak Pakis Tropis'],
    specialTrait: 'Vibes Tropis Bio-Luminesen',
    specialTraitDesc: 'Atmosfer kanopi hutan hujan dengan pantulan lampu neon hijau di aspal basah.',
    difficultyRating: 3,
    ambientSoundtrack: 'Emerald Mist Drive',
    skyGradient: ['#020f0a', '#062419', '#0d3826'],
    horizonType: 'forest_canopy',
    roadColor: '#0d1611',
    roadTexture: 'moss_asphalt',
    shoulderColor: '#133e23',
    shoulderDetailColor: '#1f5c35',
    curbColor1: '#059669',
    curbColor2: '#a7f3d0',
    laneColor: '#34d399',
    guardrailColor: 'rgba(168, 85, 247, 0.55)',
    fogColor: 'rgba(6, 28, 18, 0.85)',
    particleType: 'fireflies',
    particleCount: 65,
    particleColor: '#6ee7b7',
    particleSpeed: 4,
    driftFactor: 1.0,
    nitroMultiplier: 1.0,
    heatRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  {
    id: 'pegunungan',
    name: 'Pegunungan',
    title: 'Alpine Summit Pass',
    shortName: 'Pegunungan',
    tagline: 'Jalanan Berliku Tajam di Lereng Tebing Curam & Jurang Lembah',
    description: 'Pemandangan spektakuler jalanan pegunungan terjal berliku-liku di antara tebing batu raksasa dan lembah sungai.',
    icon: '⛰️',
    themeColor: '#a855f7',
    accentColor: '#60a5fa',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    previewImage: '/maps/pegunungan.jpg',
    backgroundImage: '/maps/pegunungan.jpg',
    surfaceName: 'Aspal Pegunungan Berliku',
    weatherName: 'Angin Lembah & Langit Biru',
    roadsideTheme: 'Tebing Jurang Curam & Batuan Granit',
    roadsideElements: ['Tebing Batu Granit', 'Tikungan Hairpin', 'Lembah Jurang Sungai', 'Puncak Salju Kejauhan'],
    specialTrait: 'Vibes Alpine Skyline',
    specialTraitDesc: 'Atmosfer puncak gunung dengan tebing terjal spektakuler dan tikungan berliku dramatis.',
    difficultyRating: 3,
    ambientSoundtrack: 'Alpine Summit Adrenaline',
    skyGradient: ['#090615', '#161033', '#271d54'],
    horizonType: 'alpine_peaks',
    roadColor: '#151320',
    roadTexture: 'mountain_rock',
    shoulderColor: '#2d2b3d',
    shoulderDetailColor: '#3e3b54',
    curbColor1: '#9333ea',
    curbColor2: '#e9d5ff',
    laneColor: '#c084fc',
    guardrailColor: 'rgba(168, 85, 247, 0.65)',
    fogColor: 'rgba(18, 12, 36, 0.85)',
    particleType: 'cloud_mist',
    particleCount: 50,
    particleColor: '#d8b4fe',
    particleSpeed: 10,
    driftFactor: 1.0,
    nitroMultiplier: 1.0,
    heatRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
];

export function getMapData(mapId?: string): MapData {
  const found = MAPS_LIST.find(m => m.id === mapId);
  return found || MAPS_LIST[0];
}
