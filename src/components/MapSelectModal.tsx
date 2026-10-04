import React, { useState, useEffect, useMemo } from 'react';
import { GameMapId, MAPS_LIST } from '../types/maps';
import { sound } from '../services/audio';
import {
  Compass,
  Building2,
  CloudSnow,
  Mountain,
  Sunset,
  TreePine,
  Check,
  Play,
  X,
  type LucideIcon,
} from 'lucide-react';
import { CardStack, type CardStackItem } from './ui/card-stack';

interface ArenaItem extends CardStackItem {
  id: GameMapId;
  icon: LucideIcon;
  emojiIcon: string;
  vibes: string;
  specialTraitDesc: string;
}

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
  // Responsive detector for landscape widescreen dimensions
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWindowWidth(window.innerWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;

  const cardWidth = useMemo(() => {
    if (windowWidth < 380) return Math.max(260, windowWidth - 48);
    if (windowWidth < 480) return Math.min(320, windowWidth - 56);
    if (windowWidth < 640) return 360;
    if (windowWidth < 768) return 420;
    return 490;
  }, [windowWidth]);

  const cardHeight = useMemo(() => {
    if (windowWidth < 480) return 185;
    if (windowWidth < 640) return 205;
    return 255;
  }, [windowWidth]);

  // Map metadata aligned with MAPS_LIST
  const arenas: ArenaItem[] = useMemo(() => [
    {
      id: 'kota',
      title: 'Metropolis Kota',
      tag: 'Aspal Basah Cyberpunk',
      description:
        'Pengejaran menembus jalan tol futuristik di antara gedung pencakar langit berhias lampu neon dan aspal basah berkilau.',
      imageSrc: '/maps/kota.jpg',
      icon: Building2,
      emojiIcon: '🏙️',
      vibes: 'Vibes Neon Skyline',
      specialTraitDesc: 'Atmosfer metropolis malam dengan pancaran lampu neon dan aspal basah berkilau.',
    },
    {
      id: 'salju',
      title: 'Puncak Salju',
      tag: 'Aspal Dingin Bersalju',
      description:
        'Pemandangan eksotis dataran kutub beku di bawah pendaran tirai Aurora Borealis dan hutan pinus salju.',
      imageSrc: '/maps/salju.jpg',
      icon: CloudSnow,
      emojiIcon: '❄️',
      vibes: 'Vibes Aurora Borealis',
      specialTraitDesc: 'Atmosfer kutub es dengan partikel salju melayang lembut di bawah tirai aurora.',
    },
    {
      id: 'padang_pasir',
      title: 'Padang Pasir',
      tag: 'Aspal Gurun Berdebu',
      description:
        'Melintasi pemandangan ngarai batu merah dan bukit pasir emas di bawah langit senja membara.',
      imageSrc: '/maps/padang_pasir.jpg',
      icon: Sunset,
      emojiIcon: '🏜️',
      vibes: 'Vibes Golden Dusk',
      specialTraitDesc: 'Atmosfer eksotis gurun pasir dengan rona senja tembaga dan partikel pasir hangat.',
    },
    {
      id: 'hutan',
      title: 'Hutan Neon',
      tag: 'Aspal Hijau Basah Berkilau',
      description:
        'Menyusuri pemandangan hutan hujan tropis basah dengan dekorasi lampu neon hijau dan magenta yang melingkari pepohonan.',
      imageSrc: '/maps/hutan.jpg',
      icon: TreePine,
      emojiIcon: '🌲',
      vibes: 'Vibes Bioluminescent Jungle',
      specialTraitDesc: 'Atmosfer kanopi hutan hujan dengan pantulan lampu neon hijau di aspal basah.',
    },
    {
      id: 'pegunungan',
      title: 'Pegunungan',
      tag: 'Aspal Pegunungan Berliku',
      description:
        'Pemandangan spektakuler jalanan pegunungan terjal berliku-liku di antara tebing batu raksasa dan lembah sungai.',
      imageSrc: '/maps/pegunungan.jpg',
      icon: Mountain,
      emojiIcon: '⛰️',
      vibes: 'Vibes Alpine Skyline',
      specialTraitDesc: 'Atmosfer puncak gunung dengan tebing terjal spektakuler dan tikungan berliku dramatis.',
    },
  ], []);

  // Initial index based on current selectedMapId
  const initialIndex = useMemo(() => {
    const idx = arenas.findIndex((a) => a.id === selectedMapId);
    return idx >= 0 ? idx : 0;
  }, [arenas, selectedMapId]);

  const [activeArena, setActiveArena] = useState<ArenaItem>(() => arenas[initialIndex] || arenas[0]);

  // Sync active arena if selectedMapId changes externally
  useEffect(() => {
    const found = arenas.find((a) => a.id === selectedMapId);
    if (found) {
      setActiveArena(found);
    }
  }, [selectedMapId, arenas]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--ep-border)] shadow-[0_0_60px_var(--ep-accent-glow)] flex flex-col max-h-[95vh]"
        style={{ background: 'var(--ep-modal-bg)' }}
      >
        {/* ── Modal Header: TIDAK BERUBAH — persis sesuai instruksi ── */}
        <div
          className="flex items-start justify-between gap-4 border-b border-[var(--ep-border)] px-5 sm:px-6 py-4 sm:py-5"
          style={{ background: 'var(--ep-modal-header)' }}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-chip-bg)] shrink-0 shadow-[0_0_15px_var(--ep-accent-glow)]">
              <Compass className="h-5 w-5 text-[var(--ep-accent)]" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-extrabold tracking-wide text-[var(--ep-text)] uppercase">
                PILIH ARENA BALAPAN
              </h2>
              <p className="mt-1 text-xs text-[var(--ep-text-muted)]">
                Semua arena memiliki sistem dan handling yang sama, dengan vibes dan cuaca visual yang khas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              onClose();
            }}
            aria-label="Tutup"
            className="p-2 rounded-xl text-[var(--ep-text-muted)] hover:text-[var(--ep-text)] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Modal Body: Widescreen Landscape Stack Carousel (Persegi Panjang ke Samping & Tidak Terlalu Miring) ── */}
        <div className="px-3 sm:px-6 py-4 sm:py-6 overflow-hidden flex items-center justify-center">
          <CardStack
            items={arenas}
            initialIndex={initialIndex}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            overlap={isMobile ? 0.58 : 0.48}
            spreadDeg={isMobile ? 8 : 12}
            tiltXDeg={3}
            depthPx={70}
            maxVisible={5}
            loop={false}
            onChangeIndex={(_, item) => {
              sound.play('click');
              setActiveArena(item);
              onSelectMap(item.id);
            }}
            renderCard={(item, { active }) => (
              <ArenaCard
                item={item}
                active={active}
                isSelected={selectedMapId === item.id}
              />
            )}
          />
        </div>

        {/* ── Footer "Arena Terpilih": TIDAK BERUBAH — kontennya mengikuti card aktif ── */}
        <div
          className="flex flex-col gap-3 border-t border-[var(--ep-border)] px-5 sm:px-6 py-4 sm:py-4.5 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: 'var(--ep-modal-header)' }}
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ep-chip-bg)] border border-[var(--ep-border)] text-xl shrink-0">
              <activeArena.icon className="h-5 w-5 text-[var(--ep-accent)]" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-black text-sm text-[var(--ep-text)]">
                  Arena Terpilih: {activeArena.title}
                </span>
                <span className="rounded-full border border-[var(--ep-border)] bg-[var(--ep-chip-bg)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--ep-accent)] uppercase tracking-wider">
                  {activeArena.vibes}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--ep-text-muted)] line-clamp-1">
                {activeArena.specialTraitDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.play('click');
              onSelectMap(activeArena.id);
              if (onStartGameWithMap) {
                onStartGameWithMap(activeArena.id);
                onClose();
              } else {
                onClose();
              }
            }}
            className="h-10 shrink-0 rounded-xl bg-[var(--ep-accent)] px-7 text-xs font-display font-black tracking-widest text-[var(--ep-bg)] shadow-[0_0_20px_var(--ep-accent-glow)] transition-all hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>SIAP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ArenaCardProps {
  item: ArenaItem;
  active: boolean;
  isSelected: boolean;
}

function ArenaCard({ item, active, isSelected }: ArenaCardProps) {
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl transition-all select-none group"
      style={{
        background: 'var(--ep-card-bg)',
        border: `1.5px solid ${active ? 'var(--ep-accent)' : 'var(--ep-card-border)'}`,
      }}
    >
      {/* Gambar Map Penuh (Full Bleed) */}
      {item.imageSrc ? (
        <img
          src={item.imageSrc}
          alt={item.title}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out ${
            active ? 'scale-105' : 'scale-100 opacity-70 group-hover:opacity-85'
          }`}
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--ep-card-border)]" />
      )}

      {/* Gradien gelap untuk kontras teks sinematik */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-[#090c18]/70 to-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070913]/85 via-transparent to-transparent pointer-events-none" />

      {/* Bagian Atas Kartu: Ikon Sudut Kiri-Atas & Badge AKTIF Kanan-Atas */}
      <div className="relative z-10 flex items-center justify-between p-3 sm:p-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-md">
          <item.icon className="h-4 w-4 text-[var(--ep-accent)]" />
        </span>

        {isSelected && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--ep-accent)] px-2.5 py-0.5 text-[10px] font-black text-[var(--ep-bg)] shadow-[0_0_12px_var(--ep-accent-glow)] tracking-wider">
            <Check className="w-3 h-3 stroke-[3]" /> AKTIF
          </span>
        )}
      </div>

      {/* Bagian Bawah Kartu: Nama & Penjelasan Singkat (Tanpa pill tag, tanpa tombol dalam kartu) */}
      <div className="relative z-10 p-3.5 sm:p-5 flex flex-col justify-end">
        <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-1">
          <h3 className="font-display font-black text-base sm:text-xl text-white tracking-wide drop-shadow-md">
            {item.title}
          </h3>
          <span className="text-[11px] sm:text-xs text-cyan-300 font-mono tracking-wider">
            • {item.tag}
          </span>
        </div>

        <p className="text-xs sm:text-[13px] text-gray-200 line-clamp-2 leading-relaxed drop-shadow max-w-xl">
          {item.description}
        </p>
      </div>
    </div>
  );
}
