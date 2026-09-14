import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { ShieldCheck, Fingerprint, Lock, Mail, User, X, Check, KeyRound, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | '2fa' | 'biometric'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [tempUserId, setTempUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  if (!isOpen) return null;

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

    if (res.require2FA && res.userId) {
      setTempUserId(res.userId);
      setTab('2fa');
      sound.play('warning');
      return;
    }

    if (res.user) {
      sound.play('win');
      onLoginSuccess(res.user);
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.play('click');

    const res = await api.register(username, email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      sound.play('gameover');
      return;
    }

    if (res.user) {
      sound.play('win');
      onLoginSuccess(res.user);
      onClose();
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.play('click');

    const res = await api.verify2FA(tempUserId, totpCode);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      sound.play('gameover');
      return;
    }

    if (res.user) {
      sound.play('win');
      onLoginSuccess(res.user);
      onClose();
    }
  };

  const handleBiometricAuth = async () => {
    setError('');
    setBiometricScanning(true);
    sound.play('click');

    setTimeout(async () => {
      const res = await api.biometricLogin(currentUser?.id);
      setBiometricScanning(false);

      if (res.error) {
        setError(res.error);
        sound.play('gameover');
        return;
      }

      if (res.user) {
        sound.play('win');
        onLoginSuccess(res.user);
        onClose();
      }
    }, 1200);
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    sound.play('click');

    const res = await api.guestLogin();
    setLoading(false);

    if (res.user) {
      sound.play('powerup');
      onLoginSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0c19] border border-cyan-500/40 rounded-3xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* If already logged in: Profile & Security settings */}
        {currentUser ? (
          <div className="space-y-6">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl border-2 mb-3 shadow-lg"
                style={{
                  borderColor: currentUser.carColor,
                  backgroundColor: `${currentUser.carColor}25`,
                }}
              >
                {currentUser.avatar}
              </div>
              <h2 className="text-xl font-display font-extrabold text-white">{currentUser.username}</h2>
              <div className="text-xs text-cyan-400 font-bold tracking-wider">{currentUser.title}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{currentUser.email}</div>
            </div>

            {/* Security Toggles */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/10">
              <div className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider mb-2">
                Keamanan Akun & Proteksi Cloud
              </div>

              {/* 2FA Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Autentikasi Dua Faktor (2FA)</div>
                    <div className="text-[10px] text-gray-400">Verifikasi kode OTP saat login</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.twoFactorEnabled}
                  onChange={async e => {
                    sound.play('click');
                    const res = await api.updateProfile(currentUser.id, { twoFactorEnabled: e.target.checked });
                    if (res.user) onLoginSuccess(res.user);
                  }}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Biometric Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Login Biometrik WebAuthn</div>
                    <div className="text-[10px] text-gray-400">Gunakan sensor sidik jari / FaceID</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.biometricEnabled}
                  onChange={async e => {
                    sound.play('click');
                    const res = await api.updateProfile(currentUser.id, { biometricEnabled: e.target.checked });
                    if (res.user) onLoginSuccess(res.user);
                  }}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Logout button */}
            <div className="flex gap-3">
              <button
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold font-display uppercase tracking-wider transition-colors"
              >
                Keluar Akun
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-display uppercase tracking-wider transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register / 2FA views */
          <div>
            {/* Header / Tabs */}
            {tab !== '2fa' && (
              <div className="flex bg-black/50 p-1 rounded-2xl border border-white/10 mb-6">
                <button
                  onClick={() => {
                    setTab('login');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all ${
                    tab === 'login'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  onClick={() => {
                    setTab('register');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all ${
                    tab === 'register'
                      ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Daftar Baru
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Username / Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Username atau email"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-display font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-transform active:scale-95"
                >
                  {loading ? 'Memverifikasi...' : 'Masuk ke Game'}
                </button>

                {/* Biometric Quick Login */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleBiometricAuth}
                    disabled={biometricScanning}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Fingerprint className={`w-4 h-4 ${biometricScanning ? 'animate-pulse text-rose-400' : ''}`} />
                    {biometricScanning ? 'Memindai Biometrik...' : 'Login Cepat Biometrik (WebAuthn)'}
                  </button>
                </div>

                {/* Guest Play */}
                <div className="pt-2 border-t border-white/10 text-center">
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="text-xs text-gray-400 hover:text-cyan-400 underline font-semibold"
                  >
                    Atau Main Instan sebagai Tamu (Guest Racer)
                  </button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Username Pembalap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Contoh: CyberRider"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Email Pengguna
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="driver@cyberpursuit.com"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-fuchsia-500/25 transition-transform active:scale-95"
                >
                  {loading ? 'Mendaftarkan...' : 'Buat Akun Pembalap'}
                </button>
              </form>
            )}

            {/* 2FA Verification Form */}
            {tab === '2fa' && (
              <form onSubmit={handleVerify2FA} className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-white text-base">Verifikasi Dua Faktor (2FA)</h3>
                <p className="text-xs text-gray-400">
                  Masukkan 6 angka kode autentikator akunmu (atau gunakan demo PIN: <strong>123456</strong>).
                </p>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-48 mx-auto text-center tracking-[0.5em] font-display font-bold text-xl bg-black/60 border border-cyan-500/40 rounded-xl py-2.5 text-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || totpCode.length < 6}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-display font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25"
                >
                  {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                </button>

                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Kembali ke Halaman Login
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
