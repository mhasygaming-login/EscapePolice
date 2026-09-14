import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { Settings, Sliders, Moon, Bell, Monitor, Volume2, X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  if (!isOpen) return null;

  const [hudPos, setHudPos] = useState<'top' | 'compact' | 'minimal'>(
    user?.layoutSettings?.hudPosition || 'top'
  );
  const [controlsStyle, setControlsStyle] = useState<'buttons' | 'dpad' | 'split'>(
    user?.layoutSettings?.controlsStyle || 'buttons'
  );
  const [screenShake, setScreenShake] = useState(user?.layoutSettings?.screenShake ?? true);
  const [scanlines, setScanlines] = useState(user?.layoutSettings?.scanlines ?? true);
  const [soundEnabled, setSoundEnabled] = useState(user?.layoutSettings?.soundEnabled ?? true);

  const [notifFriend, setNotifFriend] = useState(user?.notificationSettings?.friendScores ?? true);
  const [notifTourney, setNotifTourney] = useState(user?.notificationSettings?.tournaments ?? true);
  const [notifDaily, setNotifDaily] = useState(user?.notificationSettings?.dailyMissions ?? true);

  const [saved, setSaved] = useState(false);

  // Sync settings when user prop updates
  React.useEffect(() => {
    if (user) {
      if (user.layoutSettings) {
        setHudPos(user.layoutSettings.hudPosition || 'top');
        setControlsStyle(user.layoutSettings.controlsStyle || 'buttons');
        setScreenShake(user.layoutSettings.screenShake ?? true);
        setScanlines(user.layoutSettings.scanlines ?? true);
        setSoundEnabled(user.layoutSettings.soundEnabled ?? true);
      }
      if (user.notificationSettings) {
        setNotifFriend(user.notificationSettings.friendScores ?? true);
        setNotifTourney(user.notificationSettings.tournaments ?? true);
        setNotifDaily(user.notificationSettings.dailyMissions ?? true);
      }
    }
  }, [user]);

  const handleSave = async () => {
    sound.play('click');
    if (user) {
      const updates = {
        layoutSettings: {
          hudPosition: hudPos,
          controlsStyle,
          screenShake,
          scanlines,
          soundEnabled,
        },
        notificationSettings: {
          friendScores: notifFriend,
          tournaments: notifTourney,
          pushEnabled: true,
          dailyMissions: notifDaily,
        },
      };

      const res = await api.updateProfile(user.id, updates);
      if (res.user) {
        onUpdateUser(res.user);
        sound.muted = !soundEnabled;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0c19] border border-white/10 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-extrabold text-base text-white">PENGATURAN TATA LETAK & PREFERENSI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Section 1: HUD & Display Layout */}
          <div className="space-y-3">
            <div className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-cyan-400" /> Tata Letak HUD & Visual Game
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-2">
                  Posisi & Gaya HUD
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'top', label: 'Standar Atas' },
                    { id: 'compact', label: 'Floating Mini' },
                    { id: 'minimal', label: 'Minimalist' },
                  ].map(h => (
                    <button
                      key={h.id}
                      onClick={() => setHudPos(h.id as any)}
                      className={`py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider border transition-all ${
                        hudPos === h.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                          : 'bg-black/40 border-white/5 text-gray-400'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Efek Garis Scanline CRT Arcade</span>
                  <input
                    type="checkbox"
                    checked={scanlines}
                    onChange={e => setScanlines(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Efek Guncangan Layar (Screen Shake)</span>
                  <input
                    type="checkbox"
                    checked={screenShake}
                    onChange={e => setScreenShake(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Efek Audio & Sirine Synthesizer</span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={e => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Notifications Preferences */}
          <div className="space-y-3">
            <div className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-fuchsia-400" /> Preferensi Notifikasi Push
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Notifikasi Skor Teman / Rival</div>
                  <div className="text-[10px] text-gray-400">Peringatan instan saat skormu terlampaui</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifFriend}
                  onChange={e => setNotifFriend(e.target.checked)}
                  className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <div className="text-xs font-bold text-white">Pengingat Jadwal Turnamen</div>
                  <div className="text-[10px] text-gray-400">Pemberitahuan sebelum turnamen dimulai</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifTourney}
                  onChange={e => setNotifTourney(e.target.checked)}
                  className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <div className="text-xs font-bold text-white">Tantangan & Misi Harian</div>
                  <div className="text-[10px] text-gray-400">Pembaruan reward bounty setiap hari</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifDaily}
                  onChange={e => setNotifDaily(e.target.checked)}
                  className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold font-display uppercase tracking-wider transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-display font-extrabold uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-transform active:scale-95"
          >
            {saved ? <Check className="w-4 h-4 text-black" /> : null}
            {saved ? 'Tersimpan!' : 'Terapkan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  );
};
