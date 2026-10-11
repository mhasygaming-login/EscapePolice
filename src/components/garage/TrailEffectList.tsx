import React from 'react';
import { Check } from 'lucide-react';
import { sound } from '../../services';

export interface TrailItem {
  id: string;
  name: string;
  color: string;
  desc?: string;
  iconType: 'plasma' | 'laser' | 'sparks' | 'none';
}

export const DEFAULT_TRAIL_ITEMS: TrailItem[] = [
  { id: 'cyan_plasma', name: 'Plasma Biru', color: '#00f0ff', desc: 'Partikel ion biru menyala', iconType: 'plasma' },
  { id: 'magenta_laser', name: 'Laser Magenta', color: '#ff2d6b', desc: 'Sinar laser neon fuchsia', iconType: 'laser' },
  { id: 'amber_sparks', name: 'Sparks', color: '#ffb703', desc: 'Percikan api knalpot emas', iconType: 'sparks' },
  { id: 'none', name: 'Polos', color: '#94a3b8', desc: 'Asap knalpot standar pabrik', iconType: 'none' },
];

export interface TrailEffectListProps {
  trails?: TrailItem[];
  selectedTrail: string;
  onSelectTrail: (trailId: string) => void;
}

export const TrailEffectList: React.FC<TrailEffectListProps> = ({
  trails = DEFAULT_TRAIL_ITEMS,
  selectedTrail,
  onSelectTrail,
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full select-none">
      {trails.map(t => {
        const isSelected = selectedTrail === t.id;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              sound.play('click');
              onSelectTrail(t.id);
            }}
            className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-[#ff2d6b]/20 border-[#ff2d6b]/70 shadow-[0_0_12px_rgba(255,45,107,0.25)] text-white'
                : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Graphic Particle Icon Thumbnail */}
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center p-0.5 relative overflow-hidden"
                style={{
                  background: isSelected ? 'rgba(255,45,107,0.25)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${isSelected ? '#ff2d6b' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {t.iconType === 'plasma' && (
                  <div className="relative flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] blur-[1px] animate-pulse" />
                    <span className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
                {t.iconType === 'laser' && (
                  <div className="relative flex items-center justify-center w-full">
                    <span className="w-4 h-1 rounded-full bg-[#ff2d6b] shadow-[0_0_6px_#ff2d6b]" />
                    <span className="absolute w-2 h-0.5 rounded-full bg-white" />
                  </div>
                )}
                {t.iconType === 'sparks' && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-2 rounded-xs bg-[#ffb703] rotate-12 shadow-[0_0_4px_#ffb703]" />
                    <span className="w-1.5 h-1 rounded-xs bg-[#f97316] -rotate-12 shadow-[0_0_4px_#f97316]" />
                  </div>
                )}
                {t.iconType === 'none' && (
                  <div className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400 opacity-60" />
                )}
              </div>

              {/* Name & Subtitle */}
              <div className="text-left">
                <div className={`font-display font-bold text-[11px] leading-tight ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                  {t.name}
                </div>
                {t.desc && (
                  <div className="text-[9px] text-gray-400 font-mono leading-none mt-0.5">
                    {t.desc}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Checkmark */}
            {isSelected ? (
              <div className="w-4 h-4 rounded-full bg-[#ff2d6b]/30 border border-[#ff2d6b] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[#ff2d6b] stroke-[3]" />
              </div>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-white/10" />
            )}
          </button>
        );
      })}
    </div>
  );
};
