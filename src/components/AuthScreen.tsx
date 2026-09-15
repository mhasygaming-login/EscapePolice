import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import {
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flame,
  Trophy,
  Gamepad2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthScreenProps {
  initialTab?: 'login' | 'register';
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialTab = 'login',
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleRegister = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#070814] text-white relative overflow-hidden">
      {/* Dynamic cyberpunk ambient background */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Game Title & Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            CYBER PURSUIT RACING
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 tracking-wider">
            ESCAPE THE POLICE
          </h1>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Daftar atau masuk dengan akun Anda untuk mulai balapan dan mencatat rekor di Leaderboard resmi.
          </p>
        </div>

        {/* Auth Card Box */}
        <div className="bg-[#0c0d1c]/90 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Tab Switcher */}
          <div className="flex bg-black/60 p-1 rounded-2xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                setTab('login');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Masuk ke Game
            </button>
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                setTab('register');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25 scale-[1.02]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                  Nama Pemain
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan nama pemain"
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status Login Card */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Status login Anda diingat di perangkat ini, Anda tidak perlu masuk ulang setiap kali bermain.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer mt-2"
              >
                {loading ? 'Memverifikasi Akun...' : 'Masuk ke Permainan'}
              </button>
            </form>
          ) : (
            /* Form Register */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                  Nama Pemain Baru
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: StreetPhantom"
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-400 transition-colors"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  * Nama ini otomatis digunakan sebagai nama profil & leaderboard resmi.
                </span>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 3 karakter"
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Detail Akun Baru */}
              <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏎️</span>
                  <span>Avatar default <strong>🏎️</strong> siap digunakan (bisa diubah nanti di profil).</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Akun baru dimulai bersih dengan data awal kosong (0 skor).</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Riwayat aktivitas disimpan secara lokal terenkripsi (AES-256).</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-fuchsia-500/25 transition-all active:scale-95 cursor-pointer mt-2"
              >
                {loading ? 'Mendaftarkan Akun...' : 'Daftar & Langsung Main'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
