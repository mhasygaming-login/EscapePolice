import React, { useState, useMemo } from 'react';
import { UserProfile } from '../../types';
import { api, sound } from '../../services';
import { useOnlineStatus } from '../../hooks';
import {
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Gamepad2,
  WifiOff
} from 'lucide-react';
import { AuthTabs } from '../ui';
import { RaceAuthHero, RaceAuthHeroCompact } from '../auth/RaceAuthHero';
import { RaceAuthModeSwitch, type AuthMode } from '../auth/RaceAuthModeSwitch';

interface AuthScreenProps {
  initialTab?: 'login' | 'register';
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialTab = 'login',
  onLoginSuccess,
}) => {
  // Check for room invitation in URL query or hash
  const invitedRoomCode = useMemo(() => {
    try {
      if (typeof window === 'undefined') return null;
      const params = new URLSearchParams(window.location.search);
      const code = params.get('room') || params.get('join');
      if (code) return code.trim().toUpperCase();
      if (window.location.hash) {
        const match = window.location.hash.match(/room=([A-Za-z0-9_-]+)/i);
        if (match) return match[1].trim().toUpperCase();
      }
    } catch {}
    return null;
  }, []);

  const isOnline = useOnlineStatus();
  const [tab, setTab] = useState<AuthMode>(invitedRoomCode ? 'register' : initialTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Accent style dynamic based on mode: Cyan for login, Magenta for register
  const accentStyle = useMemo(() => {
    return {
      '--ep-accent': tab === 'login' ? 'var(--ep-cyan)' : 'var(--ep-magenta)',
      '--ep-accent-glow': tab === 'login' ? 'rgba(0, 184, 219, 0.35)' : 'rgba(225, 42, 251, 0.35)',
    } as React.CSSProperties;
  }, [tab]);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.play('click');

    const res = await api.login(username, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      sound.play('gameover');
      return;
    }

    if (res.user) {
      sound.play('win');
      onLoginSuccess(res.user);
    }
  };

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.play('click');

    const res = await api.register(username, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      sound.play('gameover');
      return;
    }

    if (res.user) {
      sound.play('win');
      onLoginSuccess(res.user);
    }
  };

  const handleGuestPlay = async () => {
    sound.play('click');
    const guestRes = await api.guestLogin();
    if (guestRes.user) {
      onLoginSuccess(guestRes.user);
    }
  };

  // Form fields configuration mapped for modern-animated-auth BoxReveal & AnimatedForm
  const formFields = useMemo(() => {
    if (tab === 'login') {
      return {
        fields: [
          {
            label: 'NAMA PEMAIN',
            required: true,
            type: 'text' as const,
            value: username,
            placeholder: 'Masukkan nama pemain',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value),
          },
          {
            label: 'KATA SANDI (PASSWORD)',
            required: true,
            type: 'password' as const,
            value: password,
            placeholder: 'Masukkan kata sandi',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
          },
        ],
        submitButton: loading ? 'Memverifikasi Akun...' : 'MASUK KE PERMAINAN',
        noteSlot: (
          <div className="flex items-start gap-3 rounded-xl bg-[var(--ep-note-bg)] p-3 border border-cyan-500/20 text-left">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ep-cyan)]" />
            <p className="text-xs text-[var(--ep-note-text)] leading-relaxed">
              Status login Anda diingat di perangkat ini, Anda tidak perlu masuk ulang setiap kali bermain.
            </p>
          </div>
        ),
        secondaryAction: (
          <OfflineAction
            isOnline={isOnline}
            onGuestPlay={handleGuestPlay}
          />
        ),
        errorField: error,
      };
    } else {
      return {
        fields: [
          {
            label: 'NAMA PEMAIN BARU',
            required: true,
            type: 'text' as const,
            value: username,
            placeholder: 'Contoh: StreetPhantom',
            helperText: '* Nama ini otomatis digunakan sebagai nama profil & leaderboard resmi.',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value),
          },
          {
            label: 'KATA SANDI (PASSWORD)',
            required: true,
            type: 'password' as const,
            value: password,
            placeholder: 'Minimal 3 karakter',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
          },
        ],
        submitButton: loading ? 'Mendaftarkan Akun...' : 'DAFTAR & LANGSUNG MAIN',
        noteSlot: (
          <div className="flex flex-col gap-2 rounded-xl bg-[var(--ep-note-bg)] p-3 border border-fuchsia-500/20 text-[11px] text-[var(--ep-note-text)] text-left">
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">🏎️</span>
              <p className="text-xs text-[var(--ep-note-text)]">Avatar default siap digunakan (bisa diubah nanti di profil).</p>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ep-magenta)]" />
              <p className="text-xs text-[var(--ep-note-text)]">Akun baru dimulai bersih dengan data awal kosong (0 skor).</p>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ep-magenta)]" />
              <p className="text-xs text-[var(--ep-note-text)]">Riwayat aktivitas disimpan secara lokal terenkripsi (AES-256).</p>
            </div>
          </div>
        ),
        secondaryAction: (
          <OfflineAction
            isOnline={isOnline}
            onGuestPlay={handleGuestPlay}
          />
        ),
        errorField: error,
      };
    }
  }, [tab, username, password, loading, error, isOnline]);

  return (
    <main
      className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden p-3 sm:p-6 lg:p-8"
      style={{ background: 'var(--ep-bg)', ...accentStyle }}
    >
      {/* Dynamic ambient background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-10">
        {/* Kolom Kiri: RaceAuthHero (Desktop only, radar rings + police orbit icons) */}
        <RaceAuthHero />

        {/* Kolom Kanan: Header ringkas mobile + Kartu Form Animated BoxReveal */}
        <section className="flex w-full flex-col items-center justify-center lg:w-1/2">
          {/* Header Ringkas Mobile (< lg) */}
          <RaceAuthHeroCompact />

          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-[var(--ep-card-border)] bg-[var(--ep-card-bg)]/95 p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.7),0_0_25px_var(--ep-accent-glow)] backdrop-blur-2xl transition-all">
            {/* Room Invite Badge (jika pemain diundang lewat tautan) */}
            {invitedRoomCode && (
              <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-fuchsia-500/20 border border-cyan-400/40 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-cyan-300 font-display font-black text-xs tracking-wider uppercase">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span>Undangan Balap Teman!</span>
                </div>
                <p className="text-xs text-gray-200 mt-1">
                  Kamu diundang ke Ruangan: <span className="font-mono font-bold text-amber-400 text-sm">#{invitedRoomCode}</span>
                </p>
                <p className="text-[11px] text-cyan-200/90 mt-0.5">
                  Daftarkan nama pembalapmu untuk langsung masuk ke arena balap bersama temanmu!
                </p>
              </div>
            )}

            {/* Mode Switcher Pills: MASUK KE GAME / DAFTAR AKUN BARU */}
            <RaceAuthModeSwitch
              mode={tab}
              onChange={(m) => {
                setTab(m);
                setError('');
              }}
            />

            {/* Error Banner jika ada */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/*
              key={tab} → remounts AnimatedForm each time tab changes so BoxReveal
              plays the slide-reveal animation field by field smoothly.
            */}
            <AuthTabs
              key={tab}
              formFields={formFields}
              handleSubmit={tab === 'login' ? handleLogin : handleRegister}
            />
          </div>
        </section>
      </div>
    </main>
  );
};

interface OfflineActionProps {
  isOnline: boolean;
  onGuestPlay: () => void;
}

function OfflineAction({ isOnline, onGuestPlay }: OfflineActionProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-full text-center">
      {!isOnline && (
        <div className="w-full mb-1 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200 text-left">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300">Koneksi Internet Terputus</div>
            <div className="text-[11px] text-amber-200/80 mt-0.5">
              Game dapat dimainkan 100% secara offline! Klik tombol di bawah untuk langsung balapan.
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onGuestPlay}
        className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[44px] ${
          !isOnline
            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 animate-pulse'
            : 'bg-white/5 hover:bg-[var(--ep-accent)]/20 border border-[var(--ep-card-border)] hover:border-[var(--ep-accent)] text-[var(--ep-accent)] hover:text-white shadow-sm'
        }`}
      >
        <Gamepad2 className="w-4 h-4" />
        <span>MAIN MODE OFFLINE (TANPA INTERNET)</span>
      </button>

      <p className="text-[11px] text-[var(--ep-text-muted)] leading-relaxed mt-1">
        Dapat dimainkan tanpa internet. Skor &amp; progres otomatis tersimpan di perangkat dan disinkronkan saat online.
      </p>
    </div>
  );
}

export default AuthScreen;
