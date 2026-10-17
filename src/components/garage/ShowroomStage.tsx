import React, { useRef, useEffect, useState } from 'react';
import { CarModelData, drawCar2D, sound, CAR_CATALOG } from '../../services';
import { BrandLogo } from '../layout/BrandLogo';
import { Volume2, Zap, Check } from 'lucide-react';

interface ShowroomStageProps {
  cars: CarModelData[];
  selectedCar: CarModelData;
  selectedColor: string;
  selectedTrail: string;
  onSelectCar: (carId: string) => void;
}

// Compact Floating Round Platform Component for Fleet Vehicles
const FloatingMiniPlatform: React.FC<{
  car: CarModelData;
  isSelected: boolean;
  activeColor: string;
  onSelect: () => void;
}> = ({ car, isSelected, activeColor, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw crisp miniature top-down car thumbnail
    drawCar2D(ctx, {
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 22,
      height: 42,
      model: car.id,
      color: isSelected ? activeColor : car.defaultColor || '#00f0ff',
      showShadow: true,
      showUnderglow: isSelected,
    });
  }, [car.id, car.defaultColor, isSelected, activeColor]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center justify-center p-1 transition-all duration-200 cursor-pointer ${
        isSelected ? 'scale-105 z-20' : 'hover:scale-105 opacity-80 hover:opacity-100 z-10'
      }`}
    >
      {/* Floating Round Podium with 3D perspective shadow */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
        {/* Neon Light Ring Glow on Floor Beneath Platform */}
        <div
          className={`absolute -bottom-1.5 w-12 sm:w-14 h-4 rounded-[50%] transition-all duration-300 pointer-events-none ${
            isSelected
              ? 'bg-cyan-400/40 blur-xs border border-cyan-300 shadow-[0_0_14px_#00f0ff]'
              : 'bg-cyan-500/15 blur-xs border border-cyan-500/30 group-hover:border-cyan-400 group-hover:shadow-[0_0_8px_rgba(0,240,255,0.4)]'
          }`}
        />

        {/* Circular Floating Platform Podium (Round Hovering Disk) */}
        <div
          className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md overflow-hidden ${
            isSelected
              ? 'bg-gradient-to-b from-[#10273d] to-[#070e1b] border-2 border-cyan-400 shadow-[0_0_18px_rgba(0,240,255,0.5),inset_0_0_8px_rgba(0,240,255,0.3)] ring-1 ring-cyan-300'
              : 'bg-gradient-to-b from-[#0a0d20]/90 to-[#040612]/90 border border-cyan-500/30 group-hover:border-cyan-400/70 shadow-[inset_0_0_6px_rgba(0,240,255,0.1)]'
          }`}
        >
          {/* Internal neon circular ring */}
          <div className="absolute inset-0.5 rounded-full border border-cyan-400/20 pointer-events-none" />

          {/* Miniature Car Canvas on top of the round platform */}
          <canvas
            ref={canvasRef}
            width={56}
            height={56}
            className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)] filter transition-transform group-hover:scale-105"
          />

          {/* Badge Centang jika Dimiliki / Aktif */}
          {isSelected && (
            <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center font-black shadow-[0_0_8px_#00f0ff] z-20">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
          {!isSelected && (
            <div
              className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center font-bold z-20"
              title="Armada Dimiliki"
            >
              <Check className="w-2 h-2 stroke-[2.5]" />
            </div>
          )}
        </div>
      </div>

      {/* Car Label Beneath Platform */}
      <div className="mt-0.5 text-center select-none max-w-[70px] sm:max-w-[80px]">
        <div
          className={`font-display font-black text-[9px] sm:text-[10px] leading-tight truncate ${
            isSelected
              ? 'text-cyan-300 drop-shadow-[0_0_5px_rgba(0,240,255,0.7)]'
              : 'text-gray-300 group-hover:text-white'
          }`}
        >
          {car.shortName || car.name}
        </div>
        <div className="text-[7.5px] sm:text-[8px] font-mono text-gray-500 uppercase truncate">
          {car.brand}
        </div>
      </div>
    </button>
  );
};

export const ShowroomStage: React.FC<ShowroomStageProps> = ({
  cars = CAR_CATALOG,
  selectedCar,
  selectedColor,
  selectedTrail,
  onSelectCar,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [testingNitro, setTestingNitro] = useState(false);
  const nitroTimerRef = useRef<any>(null);

  const handleTestNitro = () => {
    sound.ensureContext();
    sound.play('nitro');
    setTestingNitro(true);
    if (nitroTimerRef.current) clearTimeout(nitroTimerRef.current);
    nitroTimerRef.current = setTimeout(() => setTestingNitro(false), 1600);
  };

  const handleRevEngine = () => {
    sound.ensureContext();
    sound.playEngineRev(selectedCar.id);
  };

  // Main vehicle turntable canvas render loop
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      // Gentle floating bobbing effect
      const cy = canvas.height / 2 + Math.sin(frame * 0.04) * 2;

      // Draw high precision 2D top-down / 2.5D car (compact proportions)
      drawCar2D(ctx, {
        x: cx,
        y: cy,
        width: 72,
        height: 136,
        model: selectedCar.id,
        color: selectedColor,
        isNitro: testingNitro,
        frameCount: frame,
        showShadow: true,
        showUnderglow: true,
      });

      // Trail Particles when testing nitro or active
      if (selectedTrail !== 'none' || testingNitro) {
        const particleColor =
          selectedTrail === 'magenta_laser'
            ? '#ff2d6b'
            : selectedTrail === 'amber_sparks'
            ? '#ffb703'
            : '#00f0ff';

        ctx.save();
        const pCount = testingNitro ? 16 : 5;
        for (let i = 0; i < pCount; i++) {
          const px = cx + (Math.random() - 0.5) * 28;
          const py = cy + 70 + Math.random() * (testingNitro ? 42 : 18);
          ctx.fillStyle = particleColor;
          ctx.shadowColor = particleColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, Math.random() * 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedCar.id, selectedColor, selectedTrail, testingNitro]);

  return (
    <div className="relative w-full h-full min-h-[460px] max-h-[580px] lg:max-h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-cyan-500/30 bg-[#070814] flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      {/* ========================================================================= */}
      {/* 1. PERSPECTIVE ISOMETRIC FLOOR WITH NEON CYAN GRID & VANISHING POINT     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle Cyber Hangar Backdrop */}
        <img
          src="/assets/garage_cyber_hangar.jpg"
          alt="Cyber Hangar Environment"
          className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070814] via-[#070814]/75 to-[#070814]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070814]/90 via-transparent to-[#070814]/90" />

        {/* 3D Perspective Isometric Grid Floor converging to Vanishing Point */}
        <div
          className="absolute inset-x-0 bottom-0 h-4/5 pointer-events-none overflow-hidden"
          style={{
            perspective: '550px',
            perspectiveOrigin: '50% 20%',
          }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0, 240, 255, 0.25) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 240, 255, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '36px 36px',
              transform: 'rotateX(60deg)',
              transformOrigin: 'bottom center',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.95) 10%, rgba(0,0,0,0) 85%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.95) 10%, rgba(0,0,0,0) 85%)',
            }}
          />
        </div>

        {/* Horizon Vanishing Point Light Bar */}
        <div className="absolute top-[26%] left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent shadow-[0_0_12px_#00f0ff]" />
      </div>

      {/* ========================================================================= */}
      {/* 2. CSS PARTICLE & SPARKLE EFFECTS AROUND MAIN CAR                        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <span className="absolute top-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-cyan-400 blur-[0.5px] animate-ping opacity-75 duration-1000" />
        <span className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-fuchsia-400 blur-[1px] animate-pulse opacity-60 duration-700" />
        <span className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-400 blur-[0.5px] animate-bounce opacity-70 duration-1200" />
        <span className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-cyan-300 blur-[1px] animate-pulse opacity-85 duration-500" />

        <div className="absolute top-[44%] left-[20%] text-cyan-300 text-[10px] opacity-70 animate-pulse pointer-events-none">
          ✦
        </div>
        <div className="absolute top-[40%] right-[22%] text-fuchsia-400 text-[10px] opacity-65 animate-bounce pointer-events-none">
          ✧
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP SECTION: SMALL FLOATING ROUND PLATFORMS (FLEET THUMBNAILS)         */}
      {/* ========================================================================= */}
      <div className="relative z-20 px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
              PLATFORM ARMADA MELAYANG
            </span>
          </div>
          <span className="text-[9px] text-gray-400 font-mono">
            {cars.length} Unit Siap Meluncur
          </span>
        </div>

        {/* Row of Small Floating Circular Platforms (Compact Grid) */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-2 justify-items-center">
          {cars.map(car => (
            <FloatingMiniPlatform
              key={car.id}
              car={car}
              isSelected={car.id === selectedCar.id}
              activeColor={selectedColor}
              onSelect={() => {
                sound.play('click');
                onSelectCar(car.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CENTER-BOTTOM: ONE BIG PLATFORM WITH RADIAL GRADIENT CYAN/WHITE RING  */}
      {/* ========================================================================= */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center py-1 px-3">
        {/* Massive Turntable Platform Podium (Compact Proportions) */}
        <div className="relative flex items-center justify-center w-full max-w-[380px]">
          {/* Cincin Cahaya Menyala di Lantai di Bawahnya: Radial Gradient Cyan/Putih */}
          <div
            className="absolute w-64 sm:w-80 h-24 sm:h-30 rounded-[50%] pointer-events-none -bottom-4 animate-pulse"
            style={{
              background: `
                radial-gradient(ellipse at center,
                  rgba(255, 255, 255, 0.85) 0%,
                  rgba(0, 240, 255, 0.6) 28%,
                  rgba(0, 240, 255, 0.18) 55%,
                  transparent 78%)
              `,
              filter: 'blur(6px)',
            }}
          />

          {/* Outermost Pulsing Ambient Cyan Flare */}
          <div className="absolute w-56 sm:w-68 h-56 sm:h-68 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          {/* Outer Holographic Turntable Ring with 3D perspective ellipse */}
          <div
            className="absolute w-56 sm:w-72 h-56 sm:h-72 rounded-full border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.4)] pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(0,240,255,0.14) 0%, rgba(7,8,20,0.5) 60%, rgba(0,240,255,0.22) 100%)',
            }}
          />

          {/* Inner Concentric Rotating Cyber Dash Halo */}
          <div className="absolute w-44 sm:w-56 h-44 sm:h-56 rounded-full border-2 border-dashed border-cyan-300/60 shadow-[0_0_15px_rgba(0,240,255,0.5)] pointer-events-none animate-[spin_60s_linear_infinite]" />

          {/* Inner Glowing White/Cyan Core Spotlight */}
          <div className="absolute w-32 sm:w-40 h-32 sm:h-40 rounded-full bg-gradient-to-b from-white/30 via-cyan-400/20 to-transparent blur-sm pointer-events-none" />

          {/* Real-time Interactive 2D Vector Car Canvas (Ukuran Lebih Besar) */}
          <div className="relative z-10 w-full max-w-[280px] aspect-[280/200] flex items-center justify-center">
            <canvas
              ref={mainCanvasRef}
              width={280}
              height={200}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.95)] cursor-pointer transition-transform hover:scale-102"
              onClick={handleRevEngine}
              title="Klik mobil untuk mendengar raungan knalpot!"
            />
          </div>
        </div>

        {/* Active Car Info Plaque Underneath Center Platform */}
        <div className="mt-1 text-center select-none z-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-cyan-400/40 backdrop-blur-md mb-0.5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <BrandLogo brand={selectedCar.brand} size={16} />
            <span className="font-display font-black text-xs uppercase tracking-wider text-white">
              {selectedCar.name}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/30">
              {selectedCar.category}
            </span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            {selectedCar.engine} • <strong className="text-amber-300">{selectedCar.hp} HP</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM INTERACTIVE ACTION BAR (Rev Sound & Test Nitro)                 */}
      {/* ========================================================================= */}
      <div className="relative z-20 p-2.5 sm:p-3 border-t border-cyan-500/20 bg-black/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRevEngine}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-display font-bold text-gray-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            title="Dengarkan Suara Mesin Asli"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Raung Mesin</span>
          </button>

          <button
            type="button"
            onClick={handleTestNitro}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-display font-bold transition-all active:scale-95 cursor-pointer ${
              testingNitro
                ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white border-cyan-300 shadow-[0_0_16px_rgba(255,45,107,0.6)]'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200 hover:text-cyan-300'
            }`}
            title="Tes Semburan Nitro Turbo"
          >
            <Zap className={`w-3.5 h-3.5 ${testingNitro ? 'text-white' : 'text-fuchsia-400'}`} />
            <span>Tes Nitro</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Status: Siap Tempur</span>
        </div>
      </div>
    </div>
  );
};
