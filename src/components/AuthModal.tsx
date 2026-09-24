import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { encryptedActivityService, ActivityRecord } from '../services/encryptedActivity';
import {
  Lock,
  User,
  X,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2,
  Trash2,
  RefreshCw,
  LogOut,
  Palette
} from 'lucide-react';
import { LogoutConfirmModal } from './LogoutConfirmModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

const AVAILABLE_AVATARS = ['🏎️', '⚡', '🔥', '🚀', '👾', '💎', '👑', '🦇', '🤖', '🛡️', '🏍️', '🏁'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile management state
  const [profileTab, setProfileTab] = useState<'info' | 'history'>('info');
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Load encrypted activities when user is logged in and opens modal/history
  useEffect(() => {
    if (currentUser?.id) {
      loadEncryptedActivities(currentUser.id);
    }
  }, [currentUser?.id, profileTab]);

  const loadEncryptedActivities = async (userId: string) => {
    setLoadingActivities(true);
    try {
      const records = await encryptedActivityService.getActivities(userId);
      setActivities(records);
    } catch (e) {
      console.error('Failed to load encrypted activities:', e);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleClearActivities = async () => {
    if (!currentUser?.id) return;
    sound.play('click');
    await encryptedActivityService.clearActivities(currentUser.id);
    setActivities([]);
    setSuccessMsg('Riwayat aktivitas terenkripsi berhasil dibersihkan.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
      onClose();
    }
  };

  const handleSelectAvatar = async (avatar: string) => {
    if (!currentUser) return;
    sound.play('click');
    setIsUpdatingAvatar(true);
    const res = await api.updateProfile(currentUser.id, { avatar });
    setIsUpdatingAvatar(false);
    if (res.user) {
      onLoginSuccess(res.user);
      setSuccessMsg('Foto profil berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d1b] border border-cyan-500/40 rounded-3xl w-full max-w-lg p-5 sm:p-7 relative shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================================= */}
        {/* LOGGED IN VIEW: Profile, Avatar Switcher, Encrypted History */}
        {/* ========================================================================= */}
        {currentUser ? (
          <div className="space-y-5">
            {/* Header / Driver Card */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 shadow-lg shrink-0 relative group"
                style={{
                  borderColor: currentUser.carColor || '#00f0ff',
                  backgroundColor: `${currentUser.carColor || '#00f0ff'}20`,
                }}
              >
                {currentUser.avatar || '🏎️'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-display font-black text-white truncate">
                    {currentUser.username}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-display font-bold uppercase tracking-wider">
                    Pemain Terdaftar
                  </span>
                </div>
                <div className="text-xs text-amber-400 font-bold tracking-wider mt-0.5">
                  {currentUser.title || 'ROOKIE RACER'}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                  <span>Skor Terbaik: <strong className="text-cyan-300">{(currentUser.stats?.highScore || 0).toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Bounty: <strong className="text-amber-300">{(currentUser.stats?.totalBounty || 0).toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            {/* Profile Sub-tabs */}
            <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setProfileTab('info')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  profileTab === 'info'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Ganti Avatar
              </button>
              <button
                onClick={() => setProfileTab('history')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  profileTab === 'history'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Riwayat Terenkripsi
              </button>
            </div>

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Sub-tab 1: Change Avatar */}
            {profileTab === 'info' && (
              <div className="space-y-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    Pilih Foto Avatar Default
                  </label>
                  <span className="text-[10px] text-cyan-400 font-semibold">Tampil di Leaderboard</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => handleSelectAvatar(av)}
                      disabled={isUpdatingAvatar}
                      className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                        currentUser.avatar === av
                          ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                          : 'bg-black/40 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-relaxed mt-2 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Status login Anda tersimpan aman secara otomatis di perangkat ini, Anda tidak perlu masuk ulang setiap kali membuka game.
                  </span>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Encrypted Activity History */}
            {profileTab === 'history' && (
              <div className="space-y-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                      Vault Aktivitas Lokal Terenkripsi
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    AES-GCM 256-bit
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 leading-normal">
                  Seluruh riwayat sesi game Anda dienkripsi secara lokal di browser Anda untuk menjaga privasi mutlak.
                </p>

                {/* Activities List */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
                  {loadingActivities ? (
                    <div className="text-center py-6 text-xs text-gray-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      Mendekripsi data riwayat...
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500">
                      Belum ada riwayat aktivitas tersimpan.
                    </div>
                  ) : (
                    activities.map((item) => (
                      <div key={item.id} className="pt-2 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {item.title}
                            {item.difficulty && (
                              <span className="text-[9px] px-1 rounded bg-white/10 text-cyan-300 font-mono">
                                {item.difficulty}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {item.details || `Jarak: ${item.distance.toLocaleString()}m | Hindaran: ${item.obstaclesDodged}`}
                          </div>
                          <div className="text-[9px] text-gray-500 font-mono">
                            {new Date(item.timestamp).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-cyan-400 font-display font-black text-xs">
                            {item.score > 0 ? `+${item.score.toLocaleString()}` : '—'}
                          </div>
                          {item.bountyEarned > 0 && (
                            <div className="text-[10px] text-amber-400 font-semibold">
                              +{item.bountyEarned} Bounty
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions: Refresh & Clear */}
                {activities.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => currentUser?.id && loadEncryptedActivities(currentUser.id)}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Segarkan
                    </button>
                    <button
                      type="button"
                      onClick={handleClearActivities}
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus Riwayat Lokal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Logout and Close Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setIsLogoutConfirmOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Akun
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-display uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* AUTHENTICATION VIEW: Simple Name & Password Only (No Google Auth) */
          /* ========================================================================= */
          <div>
            {/* Title & Tabs */}
            <div className="text-center mb-5">
              <h2 className="text-xl font-display font-black text-white tracking-wider">
                {tab === 'login' ? 'MASUK KE GAME' : 'PENDAFTARAN PEMBALAP'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {tab === 'login'
                  ? 'Gunakan nama dan password Anda untuk masuk & lanjutkan balapan.'
                  : 'Daftar simpel dengan nama & password. Nama Anda akan tampil di leaderboard!'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex bg-black/50 p-1 rounded-2xl border border-white/10 mb-5">
              <button
                onClick={() => {
                  sound.play('click');
                  setTab('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => {
                  sound.play('click');
                  setTab('register');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Daftar Akun
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ---------------- LOGIN FORM ---------------- */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Nama Pemain
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Persistent session info */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Sistem akan mengingat status login Anda di perangkat ini secara otomatis.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-transform active:scale-95 cursor-pointer mt-2"
                >
                  {loading ? 'Memeriksa Kredensial...' : 'Masuk ke Game'}
                </button>
              </form>
            )}

            {/* ---------------- REGISTER FORM ---------------- */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Nama Pemain (Profil & Leaderboard)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                    * Nama yang didaftarkan akan menjadi nama profil Anda di papan peringkat.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 3 karakter"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Explanatory bullet cards */}
                <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏎️</span>
                    <span>Avatar default <strong>🏎️</strong> siap digunakan (bisa diubah kapan saja di profil).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Akun baru akan dimulai dengan data awal bersih & kosong.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Riwayat aktivitas disimpan lokal dengan enkripsi aman demi privasi.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-fuchsia-500/25 transition-transform active:scale-95 cursor-pointer mt-2"
                >
                  {loading ? 'Mendaftarkan Akun...' : 'Daftar & Mulai Balapan'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Logout Confirmation & Password Verification */}
      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        user={currentUser}
        onConfirmLogout={() => {
          setIsLogoutConfirmOpen(false);
          onLogout();
          onClose();
        }}
      />
    </div>
  );
};
