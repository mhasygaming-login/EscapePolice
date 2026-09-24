import React from 'react';
import { GameMapId, MAPS_LIST, getMapData } from '../types/maps';
import { sound } from '../services/audio';
import {
  Compass,
  Check,
  Play,
  Wind,
  X,
} from 'lucide-react';

interface MapSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMapId: GameMapId;
  onSelectMap: (mapId: GameMapId) => void;
  onStartGameWithMap?: (mapId: GameMapId) => void;
  cameraMode?: string;
  onToggleCameraMode?: (mode: any) => void;
}

export const MapSelectModal: React.FC<MapSelectModalProps> = ({
  isOpen,
  onClose,
  selectedMapId,
  onSelectMap,
  onStartGameWithMap,
}) => {
  if (!isOpen) return null;

  const currentMap = getMapData(selectedMapId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#090c18] border border-[var(--ep-border)] rounded-3xl w-full max-w-5xl overflow-hidden shadow-[0_0_60px_var(--ep-accent-glow)] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-[#090c18]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ep-accent)]/20 border border-[var(--ep-accent)]/40 flex items-center justify-center text-[var(--ep-accent)] shrink-0 shadow-[0_0_15px_var(--ep-accent-glow)]">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-white tracking-wider">
                PILIH ARENA BALAPAN
              </h2>
              <p className="text-xs text-gray-400">
                Semua arena memiliki sistem dan handling yang sama, dengan vibes dan cuaca visual yang khas.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.play('click');
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 5 Maps Showcase Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {MAPS_LIST.map((m) => {
              const isSelected = m.id === selectedMapId;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    sound.play('click');
                    onSelectMap(m.id);
                  }}
                  className={`relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#111628] to-[#0d0f1c] border-[var(--ep-accent)] shadow-[0_0_24px_var(--ep-accent-glow)] ring-1 ring-[var(--ep-accent)]'
                      : 'bg-[#0c0f1d] border-white/10 hover:border-white/25 hover:bg-[#111425]'
                  }`}
                >
                  {/* Glowing Ambient Corner Accent */}
                  <div
                    className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-35"
                    style={{ backgroundColor: m.themeColor }}
                  />

                  {/* Map Visual Banner Preview */}
                  <div className="relative h-28 w-full rounded-xl overflow-hidden mb-3 border border-white/10 group-hover:border-white/25 transition-all">
                    <img
                      src={m.previewImage}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f1d] via-black/20 to-black/40" />
                    <span className="absolute top-2 left-2 text-base p-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/15">
                      {m.icon}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--ep-accent)] text-[var(--ep-bg)] text-[10px] font-black uppercase tracking-wider shrink-0 shadow-lg">
                        <Check className="w-3 h-3 stroke-[3]" /> Aktif
                      </span>
                    )}
                  </div>

                  <div>
                    {/* Header: Name & Surface */}
                    <div className="mb-2">
                      <h3 className="font-display font-black text-white text-sm tracking-wide">
                        {m.name}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {m.surfaceName}
                      </span>
                    </div>

                    {/* Compact Map Description */}
                    <p className="text-xs text-gray-300 leading-relaxed mb-3">
                      {m.description}
                    </p>

                    {/* Environment Info Badges */}
                    <div className="grid grid-cols-2 gap-1.5 py-2 border-t border-b border-white/10 text-[11px] mb-3">
                      <div className="flex items-center gap-1 text-gray-300 truncate">
                        <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{m.weatherName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 font-medium truncate">
                        <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{m.roadsideTheme}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.play('click');
                      onSelectMap(m.id);
                      if (onStartGameWithMap) {
                        onStartGameWithMap(m.id);
                        onClose();
                      }
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--ep-accent)] hover:brightness-110 text-[var(--ep-bg)] shadow-md shadow-[var(--ep-accent)]/25 active:scale-95'
                        : 'bg-white/10 hover:bg-[var(--ep-accent)] hover:text-[var(--ep-bg)] text-white active:scale-95'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isSelected ? 'Mulai Map Ini' : 'Pilih Arena'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active Map Detail Banner & Quick Action */}
          <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-[#0d1224] via-[#0b0e1b] to-[#070913] border border-[var(--ep-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentMap.icon}</span>
                <h4 className="font-display font-black text-white text-sm">
                  Arena Terpilih: {currentMap.name}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ep-accent)]/20 text-[var(--ep-accent)] border border-[var(--ep-accent)]/30">
                  {currentMap.specialTrait}
                </span>
              </div>
              <p className="text-xs text-gray-300">
                {currentMap.specialTraitDesc}
              </p>
            </div>

            {onStartGameWithMap && (
              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  onStartGameWithMap(currentMap.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-[var(--ep-accent)] hover:brightness-110 text-[var(--ep-bg)] font-display font-black text-xs uppercase tracking-widest shadow-md shadow-[var(--ep-accent)]/30 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Mulai Balap
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
