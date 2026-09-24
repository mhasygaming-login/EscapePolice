import React, { useEffect, useRef, useState } from 'react';
import {
  drawPoliceCar2D,
  drawPoliceMotorcycle2D,
  PoliceCarVariant
} from '../services/policeVehicles';
import { Shield, Siren, X, Zap, ChevronRight, Gauge } from 'lucide-react';
import { sound } from '../services/audio';

interface PoliceFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FleetVehicle {
  id: string;
  name: string;
  category: 'Mobil Polisi' | 'Motor Polisi';
  type: 'police' | 'motorcycle';
  variant?: PoliceCarVariant;
  isElite?: boolean;
  speedRating: number;
  armorRating: number;
  description: string;
  features: string[];
}

const FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'sedan',
    name: 'Classic Cruiser Sedan',
    category: 'Mobil Polisi',
    type: 'police',
    variant: 'sedan',
    speedRating: 82,
    armorRating: 80,
    description: 'Sedan patroli polisi perkotaan dengan bodi hitam-navy, atap putih kontras, dan lampu rotator merah-biru atap.',
    features: ['Bumper depan lurus', 'Atap putih kontras', 'Sirine rotator dual-color', 'Kaca gelap anti-silau'],
  },
  {
    id: 'interceptor',
    name: 'Muscle Pursuit Interceptor',
    category: 'Mobil Polisi',
    type: 'police',
    variant: 'interceptor',
    isElite: true,
    speedRating: 90,
    armorRating: 92,
    description: 'Unit pengejar bertenaga tinggi dengan bullbar baja berat (push-bar), bodi berotot kekar, dan ducktail lip spoiler.',
    features: ['Heavy-Duty Bullbar / Ram Bumper', 'Fender roda berotot lebar', 'Ducktail rear spoiler', 'Sirine strobo LED'],
  },
  {
    id: 'sports',
    name: 'High-Speed Sports Interceptor',
    category: 'Mobil Polisi',
    type: 'police',
    variant: 'sports',
    isElite: true,
    speedRating: 98,
    armorRating: 75,
    description: 'Mobil sport pengejar jalan raya dengan hidung aerodinamis lancip, kisi pendingin mesin kap (louvers), dan sayap belakang GT Pursuit.',
    features: ['Hidung aerodinamis lancip', 'Dual hood louvers pembuang panas', 'Sayap belakang GT Pursuit', 'Akselerasi instan'],
  },
  {
    id: 'suv',
    name: 'Tactical Enforcer SUV',
    category: 'Mobil Polisi',
    type: 'police',
    variant: 'suv',
    speedRating: 84,
    armorRating: 98,
    description: 'SUV taktis penegak hukum berdimensi panjang dengan roof rails ganda, pelindung grill penuh, dan bodi kokoh untuk barikade jalan.',
    features: ['Dimensi bodi SUV kokoh & panjang', 'Dual roof rack rails & textured ridges', 'Front wrap-around steel push-guard', 'Strobo belakang ekstra'],
  },
  {
    id: 'motorcycle',
    name: 'Highway Patrol Motorcycle',
    category: 'Motor Polisi',
    type: 'motorcycle',
    speedRating: 96,
    armorRating: 60,
    description: 'Motor dinas patroli jalan raya 2D bergaya touring dengan fairing aerodinamis putih, corak kotak-kotak biru Battenburg khas polisi, dan boks samping.',
    features: ['Corak kotak-kotak biru Battenburg', 'Kaca depan touring (windscreen)', 'Petugas berhelm putih & seragam', 'Dual hard panniers & tiang strobo'],
  },
];

export const PoliceFleetModal: React.FC<PoliceFleetModalProps> = ({ isOpen, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>('sedan');
  const [orientation, setOrientation] = useState<'down' | 'up'>('down');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  const selectedVehicle = FLEET_VEHICLES.find(v => v.id === selectedId) || FLEET_VEHICLES[0];

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      frameRef.current = frame;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Clean tech background grid
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle asphalt road lane
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(40, 0, canvas.width - 80, canvas.height);

      // Lane dash markings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Render selected vehicle with top-down 2D canvas drawing
      if (selectedVehicle.type === 'motorcycle') {
        const w = 40;
        const h = 84;
        drawPoliceMotorcycle2D(ctx, {
          x: cx - w / 2,
          y: cy - h / 2,
          width: w,
          height: h,
          frameCount: frame,
          facing: orientation,
        });
      } else {
        let w = 58;
        let h = 108;
        if (selectedVehicle.variant === 'suv') {
          w = 64;
          h = 118;
        } else if (selectedVehicle.variant === 'interceptor') {
          w = 60;
          h = 110;
        }

        drawPoliceCar2D(ctx, {
          x: cx - w / 2,
          y: cy - h / 2,
          width: w,
          height: h,
          variant: selectedVehicle.variant,
          frameCount: frame,
          isElite: selectedVehicle.isElite,
          facing: orientation,
        });
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, selectedId, selectedVehicle, orientation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0e1b] border border-cyan-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.15)] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base sm:text-lg tracking-wider uppercase">
                KENDARAAN POLISI
              </h3>
              <p className="text-xs text-gray-400">
                4 Tipe Mobil Polisi Pengejar & 1 Tipe Motor Patroli Jalan Raya
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.play('click');
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Vehicle Selector Tabs */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1 px-1">
              PILIH KENDARAAN POLISI
            </div>
            {FLEET_VEHICLES.map((item, idx) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.play('click');
                    setSelectedId(item.id);
                  }}
                  className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-lg shrink-0">
                      {item.type === 'motorcycle' ? '🏍️' : idx === 3 ? '🚙' : '🚓'}
                    </div>
                    <div>
                      <div className="text-xs font-display font-bold text-white tracking-wide">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <span className="text-cyan-400 font-medium">{item.category}</span>
                        <span className="text-gray-600">·</span>
                        <span>Spd: {item.speedRating}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-cyan-400 translate-x-1' : 'text-gray-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Live 2D Canvas Preview & Specs */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* 2D Canvas Stage */}
            <div className="relative rounded-2xl border border-cyan-500/30 overflow-hidden bg-[#060a14] flex flex-col items-center justify-center p-3 shadow-inner">
              <canvas
                ref={canvasRef}
                width={260}
                height={170}
                className="w-full max-w-[260px] h-[170px] rounded-xl"
              />
            </div>

            {/* Vehicle Specs & Description */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-black text-white uppercase tracking-wider">
                  {selectedVehicle.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedVehicle.category}
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedVehicle.description}
              </p>

              {/* Stat Bars */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> KECEPATAN
                    </span>
                    <span className="text-cyan-400 font-bold">{selectedVehicle.speedRating}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${selectedVehicle.speedRating}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-400" /> KETAHANAN
                    </span>
                    <span className="text-amber-400 font-bold">{selectedVehicle.armorRating}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                      style={{ width: `${selectedVehicle.armorRating}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Key Features List */}
              <div className="pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Detail Desain 2D:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedVehicle.features.map((f, i) => (
                    <div key={i} className="text-[11px] text-gray-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={() => {
              sound.play('click');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-cyan-500/20"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
