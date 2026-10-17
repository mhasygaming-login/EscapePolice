import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks';
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  WifiOff,
  Zap,
  Archive,
} from 'lucide-react';
import { sound } from '../../services';
import { copyTextToClipboard } from '../../utils';

interface PWAInstallButtonProps {
  className?: string;
  showText?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  showText = true,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInIframe, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'desktop' | 'android' | 'ios'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  );
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA in standalone mode, show clean installed badge
  if (isInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold ${className}`}
        title="Aplikasi Terpasang (Mode Standalone Aktif)"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Terpasang</span>
      </div>
    );
  }

  const handleButtonClick = async () => {
    sound.play('click');
    setShowModal(true);
  };

  const handleCopyLink = async () => {
    sound.play('click');
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenStandalone = () => {
    sound.play('click');
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <button
        id="btn-pwa-install"
        type="button"
        onClick={handleButtonClick}
        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/25 via-cyan-500/25 to-blue-500/25 hover:from-amber-500/35 hover:to-cyan-500/35 border border-amber-400/50 hover:border-amber-300 text-amber-300 hover:text-white text-xs font-display font-black uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(251,191,36,0.25)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:scale-105 active:scale-95 cursor-pointer min-h-[44px] ${className}`}
        title="Download File ZIP Game & Pasang di Laptop/HP"
      >
        <Download className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
        {showText && (
          <>
            <span className="hidden md:inline">Download App / ZIP</span>
            <span className="md:hidden">Download</span>
          </>
        )}
      </button>

      {/* MODAL PANDUAN DOWNLOAD & INSTALASI OFFLINE LENGKAP */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#0c0d1c] border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] relative max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header dengan Logo Game Resmi & Nama Website */}
            <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-white/10">
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 bg-cyan-500/40 rounded-2xl blur-md" />
                <img
                  src="/cyber_pursuit_logo.jpg"
                  alt="Escape the Police Logo"
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/40"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Aplikasi Resmi Game PC & HP</span>
                </div>
                <h3 className="font-display font-black text-white text-base sm:text-lg leading-tight truncate">
                  ESCAPE THE POLICE
                </h3>
                <p className="text-[11px] text-gray-400 truncate">
                  Download file ZIP portabel atau pasang langsung ke Desktop
                </p>
              </div>
            </div>

            {/* FITUR UTAMA 1: DOWNLOAD FILE ZIP OFFLINE PORTABEL */}
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 border-2 border-amber-400/50 shadow-lg shadow-amber-500/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Archive className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black text-white text-sm uppercase tracking-wide">
                      File Game ZIP (Portabel PC / Laptop)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase">
                      Ekstrak &amp; Main
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-tight mt-0.5">
                    Unduh file arsip ZIP ke komputer. Ekstrak folder lalu klik <strong>Buka-Game-Windows.bat</strong>. Game langsung terbuka tanpa perlu internet!
                  </p>
                </div>
              </div>

              {/* Tombol Unduh File ZIP */}
              <a
                href="/api/download/desktop-zip"
                download="EscapeThePolice-Offline-PC.zip"
                onClick={() => sound.play('click')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-display font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>UNDUH FILE ZIP GAME SEKARANG (~15 MB)</span>
              </a>

              {/* 3 Langkah Mudah */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-amber-400/25 text-[10px] text-amber-100/90">
                <div className="flex flex-col items-center text-center">
                  <span className="font-bold text-amber-300">1. Unduh ZIP</span>
                  <span className="text-[9px] text-amber-200/70">Klik tombol di atas</span>
                </div>
                <div className="flex flex-col items-center text-center border-x border-amber-400/25 px-1">
                  <span className="font-bold text-amber-300">2. Ekstrak Folder</span>
                  <span className="text-[9px] text-amber-200/70">Klik kanan &gt; Extract All</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="font-bold text-amber-300">3. Buka File .BAT</span>
                  <span className="text-[9px] text-amber-200/70">Klik Buka-Game-Windows</span>
                </div>
              </div>
            </div>

            {/* Keunggulan Pasang Aplikasi */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center flex flex-col items-center">
                <WifiOff className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[10px] font-display font-bold text-white uppercase">100% Offline</span>
                <span className="text-[9px] text-gray-400">Main tanpa internet</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center flex flex-col items-center">
                <Monitor className="w-4 h-4 text-fuchsia-400 mb-1" />
                <span className="text-[10px] font-display font-bold text-white uppercase">Tanpa Browser</span>
                <span className="text-[9px] text-gray-400">Ikon di Desktop/HP</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center flex flex-col items-center">
                <Zap className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-[10px] font-display font-bold text-white uppercase">Cepat 60 FPS</span>
                <span className="text-[9px] text-gray-400">Layar penuh native</span>
              </div>
            </div>

            {/* FITUR 2: PASANG INSTAN VIA PWA (CHROME / EDGE / HP) */}
            <div className="mb-2">
              <div className="text-[11px] font-display font-bold text-gray-400 uppercase tracking-wider mb-2">
                Atau Pasang Langsung ke Desktop / Layar HP (PWA Shortcut):
              </div>
            </div>

            {/* Tab Pilihan Platform: Desktop vs Android vs iOS */}
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 mb-4">
              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setSelectedPlatform('desktop');
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedPlatform === 'desktop'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 scale-[1.02]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop / Laptop</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setSelectedPlatform('android');
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedPlatform === 'android'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 scale-[1.02]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setSelectedPlatform('ios');
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedPlatform === 'ios'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 scale-[1.02]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Panduan Berdasarkan Platform yang Dipilih */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 mb-4 text-xs text-gray-300">
              {selectedPlatform === 'desktop' && (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-white">Klik Ikon Pasang di URL Bar Browser</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>, perhatikan ujung kanan kolom alamat web (URL bar). Klik ikon <strong>Install (📥 atau ⊕)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-white">Atau Melalui Menu Titik Tiga (⋮)</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Buka menu pojok kanan atas browser (⋮) &gt; pilih <strong>"Pasang Escape the Police..."</strong> (Install app).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-300">Selesai! Ikon Muncul di Desktop &amp; Taskbar</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Game akan memiliki shortcut resmi di Desktop dan Taskbar Windows/Mac Anda. Tinggal klik dua kali untuk bermain kapan saja!
                      </p>
                    </div>
                  </div>
                </>
              )}

              {selectedPlatform === 'android' && (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-white">Tekan Tombol Pasang Otomatis</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Tekan tombol <strong>"Pasang Sekarang"</strong> di bawah dialog ini untuk memicu konfirmasi instalasi Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-white">Atau Melalui Menu Chrome (⋮)</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Buka menu titik tiga di kanan atas Chrome &gt; pilih <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong> atau <strong>"Instal Aplikasi"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-300">Siap di Layar HP</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Ikon game balap lengkap dengan logo mobil cyber akan muncul di beranda HP Anda layaknya game Google Play Store.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {selectedPlatform === 'ios' && (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-white">Buka di Safari &amp; Tekan Tombol Share</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Tekan tombol <strong>Share</strong> (ikon kotak dengan tanda panah mengarah ke atas) di menu bawah browser Safari.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-white">Pilih "Add to Home Screen"</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Gulir ke bawah pada daftar opsi, lalu tekan <strong>"Add to Home Screen" (Tambah ke Layar Utama)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-300">Tekan "Tambah (Add)"</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Aplikasi akan terpasang di layar utama iPhone/iPad Anda dan siap dimainkan tanpa address bar!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Tombol Coba Pasang Otomatis (jika prompt didukung) */}
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    sound.play('click');
                    const accepted = await install();
                    if (accepted) {
                      sound.play('win');
                      setInstallSuccess(true);
                      setTimeout(() => {
                        setShowModal(false);
                        setInstallSuccess(false);
                      }, 2000);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Pasang Sekarang (Instal Otomatis ke Desktop/HP)</span>
                </button>
              )}

              {/* Jika berada di dalam iFrame (misal preview AI Studio), beri tombol buka mandiri */}
              {isInIframe && (
                <button
                  type="button"
                  onClick={handleOpenStandalone}
                  className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 font-display font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Tab Sendiri untuk Pasang Otomatis</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Tautan Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Tautan Game</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Banner Sukses Install */}
            {installSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Aplikasi berhasil dipasang di perangkat Anda!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
