import React, { useState } from 'react';
import { usePWAInstall } from '../hooks';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { sound } from '../services';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={() => {
          sound.play('click');
          install();
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-display font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
        <span>Install App Offline</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => {
            sound.play('click');
            setShowIOSGuide(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 text-xs font-display font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Pasang di HP</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-[#0c0d1c] border border-cyan-500/30 p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/cyber_pursuit_logo.jpg"
                  alt="Cyber Pursuit"
                  className="w-12 h-12 rounded-xl object-cover border border-cyan-400/50 shadow-md shadow-cyan-500/30"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-display font-black text-white text-base">Install di iPhone / iPad</h3>
                  <p className="text-[11px] text-cyan-400">Mainkan kapan saja tanpa kuota internet</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <p>Tekan tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di menu Safari bawah.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <p>Gulir ke bawah dan pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <p>Aplikasi game akan terpasang di menu HP dan siap dimainkan secara online maupun offline!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
