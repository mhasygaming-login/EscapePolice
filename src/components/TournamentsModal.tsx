import React, { useState, useEffect } from 'react';
import { Tournament, UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { Calendar, Clock, Trophy, Share2, PlusCircle, Check, Users, ExternalLink } from 'lucide-react';

interface TournamentsModalProps {
  user: UserProfile | null;
}

export const TournamentsModal: React.FC<TournamentsModalProps> = ({ user }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedId, setSharedId] = useState<string | null>(null);

  useEffect(() => {
    api.getTournaments(user?.id).then(list => {
      setTournaments(list);
      setLoading(false);
    });
  }, [user?.id]);

  const handleRegister = async (t: Tournament) => {
    if (!user) return;
    sound.play('click');
    const ok = await api.registerTournament(t.id, user.id);
    if (ok) {
      sound.play('win');
      setTournaments(prev =>
        prev.map(item =>
          item.id === t.id
            ? { ...item, isRegistered: true, participantsCount: item.participantsCount + 1 }
            : item
        )
      );
    }
  };

  const handleShare = (t: Tournament) => {
    sound.play('coin');
    const shareUrl = `${window.location.origin}/#tournament=${t.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
    } catch {}
    setSharedId(t.id);
    setTimeout(() => setSharedId(null), 2500);
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = (t: Tournament) => {
    const formatTime = (iso: string) => iso.replace(/-|:|\.\d+/g, '');
    const start = formatTime(new Date(t.startTime).toISOString());
    const end = formatTime(new Date(t.endTime).toISOString());
    const title = encodeURIComponent(`Escape the Police: ${t.title}`);
    const details = encodeURIComponent(`${t.description}\nHadiah Bounty: ${t.prizeBounty.toLocaleString()} B`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=Escape+The+Police+Cyber+Arena`;
  };

  // Generate and download .ics iCalendar file
  const downloadIcs = (t: Tournament) => {
    sound.play('click');
    const start = new Date(t.startTime).toISOString().replace(/-|:|\.\d+/g, '');
    const end = new Date(t.endTime).toISOString().replace(/-|:|\.\d+/g, '');
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Escape the Police//Tournament//ID',
      'BEGIN:VEVENT',
      `UID:${t.id}@escapethepolice.game`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Escape the Police: ${t.title}`,
      `DESCRIPTION:${t.description} Hadiah: ${t.prizeBounty} Bounty`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${t.id}_schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#0d0f1e] to-[#0a0a14] border border-rose-500/30 p-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-widest mb-2">
          <Calendar className="w-3.5 h-3.5" /> Kalender Jadwal & Turnamen Cyber
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white text-glow-magenta">
          TURNAMEN & JADWAL RESMI
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
          Daftarkan diri dalam kejuaraan mingguan, sinkronkan jadwal langsung ke Google Calendar atau ekspor file .ics,
          serta bagikan tautan turnamen ke rekan satu tim!
        </p>
      </div>

      {/* Tournament Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tournaments.map(t => {
          const startDate = new Date(t.startTime);
          const endDate = new Date(t.endTime);
          const isLive = Date.now() >= startDate.getTime() && Date.now() <= endDate.getTime();

          return (
            <div
              key={t.id}
              className="bg-[#0b0c19] border border-white/10 hover:border-rose-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-display font-bold uppercase tracking-wider ${
                      t.tier === 'CYBER_LEGEND'
                        ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                        : t.tier === 'ELITE'
                        ? 'bg-purple-500 text-white'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {t.tier}
                  </span>

                  {isLive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> SEDANG BERLANGSUNG
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400">SEGERA HADIR</span>
                  )}
                </div>

                <h3 className="text-base font-display font-bold text-white mb-1.5">{t.title}</h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">{t.description}</p>

                {/* Prize Pool */}
                <div className="bg-black/50 p-3 rounded-xl border border-white/5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Total Hadiah</span>
                    <span className="font-display font-extrabold text-sm text-amber-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      {t.prizeBounty.toLocaleString()} BOUNTY
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-cyan-400" /> Peserta:
                    </span>
                    <span className="text-white font-bold">{t.participantsCount} Pembalap</span>
                  </div>
                </div>

                {/* Schedule Time */}
                <div className="text-[11px] text-gray-400 space-y-1 mb-5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      Mulai: <strong>{startDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Selesai: <strong>{endDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => handleRegister(t)}
                  disabled={t.isRegistered}
                  className={`w-full py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
                    t.isRegistered
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25'
                  }`}
                >
                  {t.isRegistered ? '✓ Terdaftar' : 'Daftar Turnamen'}
                </button>

                {/* Calendar Sync & Share */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <a
                    href={getGoogleCalendarUrl(t)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold text-center border border-white/10 flex items-center justify-center gap-1 transition-colors"
                    title="Tambah ke Google Calendar"
                  >
                    Google <ExternalLink className="w-2.5 h-2.5" />
                  </a>

                  <button
                    onClick={() => downloadIcs(t)}
                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold border border-white/10 text-center transition-colors"
                    title="Unduh File Kalender .ICS"
                  >
                    .ICS File
                  </button>

                  <button
                    onClick={() => handleShare(t)}
                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold border border-white/10 flex items-center justify-center gap-1 transition-colors"
                    title="Bagi Tautan Turnamen"
                  >
                    {sharedId === t.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3 h-3" />
                    )}
                    Bagi
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
