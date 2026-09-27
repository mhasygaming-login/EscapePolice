import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import {
  ShieldAlert,
  Lock,
  LogOut,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onConfirmLogout: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmLogout,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const isGuest = user.id.startsWith('guest_') || user.id.startsWith('offline_') || user.id.startsWith('anon');

  const handleClose = () => {
    setPassword('');
    setError('');
    sound.play('click');
    onClose();
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If user is guest/has no password, prompt confirmation directly
    if (isGuest) {
      sound.play('click');
      onConfirmLogout();
      handleClose();
      return;
    }

    if (!password.trim()) {
      setError('Harap masukkan kata sandi akun Anda untuk verifikasi.');
      sound.play('gameover');
      return;
    }

    setLoading(true);
    sound.play('click');

    const res = await api.verifyPassword(user.id, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      sound.play('gameover');
      return;
    }

    // Password verified! Proceed with logout
    sound.play('click');
    onConfirmLogout();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0c0d1c] border border-cyan-500/40 rounded-3xl w-full max-w-md p-6 relative shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/20">
            <LogOut className="w-7 h-7 text-cyan-400" />
          </div>
          <h3 className="text-lg font-display font-black text-white tracking-wider">
            KELUAR DARI SESI AKUN
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
            Ingin berganti akun atau perangkat? Seluruh progres akunmu tetap aman di Cloud.
          </p>
        </div>

        {/* Question Notification Banner */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-100 mb-4 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div>Keluar dari akun <strong className="text-white font-bold">{user.username}</strong>?</div>
            <div className="text-[11px] text-cyan-300/90 leading-relaxed">
              ☁️ <strong>Cloud Tersinkron:</strong> Skor tertinggi, level, koleksi mobil, dan bounty Anda <strong>tersimpan aman di server Cloud</strong>. Anda dapat login kembali kapan pun dari perangkat lain tanpa kehilangan progress.
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          {!isGuest && (
            <div>
              <label className="text-[11px] text-gray-300 font-bold uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>Verifikasi Kata Sandi</span>
                <span className="text-[10px] text-rose-400 font-normal">*Wajib diisi</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun Anda"
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-400 transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Verifikasi kata sandi diperlukan agar akun tidak dapat dikeluarkan oleh pihak tak berwenang.
              </p>
            </div>
          )}

          {/* Action Buttons: Iya & Tidak */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center"
            >
              Tidak, Batalkan
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-display font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-center min-h-[44px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loading ? 'Menyimpan & Keluar...' : 'Iya, Keluar Sesi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
