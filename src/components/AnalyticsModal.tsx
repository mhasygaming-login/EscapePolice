import React, { useState, useEffect } from 'react';
import { UserProfile, AnalyticsData } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { BarChart3, TrendingUp, Zap, Target, Flame, Clock, Award, Gamepad2 } from 'lucide-react';

interface AnalyticsModalProps {
  user: UserProfile | null;
  onBackToGame?: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ user, onBackToGame }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics(user?.id).then(data => {
      setAnalytics(data);
      setLoading(false);
    });
  }, [user?.id]);

  if (loading || !analytics) {
    return (
      <div className="w-full max-w-6xl mx-auto py-16 px-3 sm:px-6 lg:px-8 text-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-xs font-display text-gray-400">Memuat data visual analitik...</div>
      </div>
    );
  }

  const maxScoreFound = Math.max(
    1000,
    ...(analytics.dailyScores && analytics.dailyScores.length > 0
      ? analytics.dailyScores.map(d => d.maxScore || 0)
      : [1000])
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* 1. Standardized Header Banner (CSS Grid Alignment) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0d0f1e] to-[#0a0a14] border border-emerald-500/30 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center shadow-xl">
        <div className="md:col-span-8 lg:col-span-9 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest mb-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>Analitik Performa & Visual Progress</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white text-glow-cyan tracking-wide">
            STATISTIK KEJARAN & PERFORMA
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl pt-0.5">
            Pantau tren skor harian, akurasi penghindaran, dan statistik duel kompetitif secara transparan.
          </p>
        </div>

        {onBackToGame && (
          <div className="md:col-span-4 lg:col-span-3 flex md:justify-end items-center">
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                onBackToGame();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-display font-black uppercase tracking-wider shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer transition-transform whitespace-nowrap"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Main Balapan (Solo)</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Standardized 4-Metric Responsive CSS Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Akurasi Dodge</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-white">
            {analytics.performanceMetrics.dodgeRate}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">Rintangan sukses dilewati</div>
        </div>

        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Graze / Near-Miss</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-amber-400">
            {analytics.performanceMetrics.grazeAccuracy}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">Keberanian serempetan musuh</div>
        </div>

        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Rata-rata Jarak</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-cyan-400">
            {analytics.performanceMetrics.avgSurvivalDistance.toLocaleString()} m
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">Daya tahan per run</div>
        </div>

        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md hover:border-fuchsia-500/30 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Multiplayer Win Rate</span>
            <div className="w-7 h-7 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-fuchsia-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-fuchsia-400">
            {analytics.performanceMetrics.multiplayerWinRate}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">Kemenangan duel highway</div>
        </div>
      </div>

      {/* 3. Standardized 12-Column Visual Progression Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-stretch">
        {/* Left (8 cols): 7-Day Score Progression Chart */}
        <div className="lg:col-span-8 bg-[#0b0c19] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-display font-bold text-white text-base">Tren Skor 7 Hari Terakhir</h3>
              <p className="text-xs text-gray-400 mt-0.5">Perbandingan skor puncak vs rata-rata harian</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-bold flex-wrap">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span> Skor Tertinggi
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-400"></span> Rata-rata
              </span>
            </div>
          </div>

          {/* SVG Custom Bar Chart */}
          <div className="h-64 w-full flex items-end justify-between gap-2 pt-6 pb-2 border-b border-white/10">
            {analytics.dailyScores.map((day, idx) => {
              const maxH = Math.max(12, Math.round((day.maxScore / maxScoreFound) * 100));
              const avgH = Math.max(8, Math.round((day.avgScore / maxScoreFound) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Max Bar */}
                    <div
                      className="w-1/3 bg-cyan-500/80 group-hover:bg-cyan-400 rounded-t transition-all relative cursor-pointer"
                      style={{ height: `${maxH}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-black px-1.5 py-0.5 rounded text-[9px] font-display text-cyan-300 font-bold pointer-events-none whitespace-nowrap z-10 border border-cyan-500/40">
                        {day.maxScore}
                      </div>
                    </div>
                    {/* Avg Bar */}
                    <div
                      className="w-1/3 bg-emerald-500/60 group-hover:bg-emerald-400 rounded-t transition-all relative cursor-pointer"
                      style={{ height: `${avgH}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-black px-1.5 py-0.5 rounded text-[9px] font-display text-emerald-300 font-bold pointer-events-none whitespace-nowrap z-10 border border-emerald-500/40">
                        {day.avgScore}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    {day.date.substring(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (4 cols): Performance Ratio Overview Card */}
        <div className="lg:col-span-4 bg-[#0b0c19] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-md">
          <div>
            <h3 className="font-display font-bold text-white text-base">Evaluasi Ketahanan</h3>
            <p className="text-xs text-gray-400 mt-0.5">Rasio efisiensi manuver jalan raya</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Stat Row 1 */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-gray-300">Stabilitas Menghindar</div>
                <div className="text-[9.5px] text-gray-500">Persentase clean pass</div>
              </div>
              <div className="font-display font-black text-sm text-emerald-400">
                {analytics.performanceMetrics.dodgeRate >= 70 ? 'SANGAT TINGGI' : 'OPTIMAL'}
              </div>
            </div>

            {/* Stat Row 2 */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-gray-300">Level Agresivitas</div>
                <div className="text-[9.5px] text-gray-500">Graze per kilometer</div>
              </div>
              <div className="font-display font-black text-sm text-amber-400">
                {analytics.performanceMetrics.grazeAccuracy > 40 ? 'HIGH RISK' : 'BALANCED'}
              </div>
            </div>

            {/* Stat Row 3 */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-gray-300">Duel Highway</div>
                <div className="text-[9.5px] text-gray-500">Kemenangan adu cepat</div>
              </div>
              <div className="font-display font-black text-sm text-fuchsia-400">
                {analytics.performanceMetrics.multiplayerWinRate}% WIN
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>Status Akun:</span>
            <span className="text-cyan-400 font-bold">TERVERIFIKASI AKTIF</span>
          </div>
        </div>
      </div>

      {/* 4. Standardized Heatmap Distribution Grid */}
      <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-white text-base">Distribusi Jam Bermain (Heatmap)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Waktu tersibuk saat kamu melarikan diri dari kejaran armada polisi</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
            <span>Intensitas:</span>
            <span className="w-3 h-3 rounded bg-white/5 inline-block" title="Rendah" />
            <span className="w-3 h-3 rounded bg-cyan-400/40 inline-block" title="Sedang" />
            <span className="w-3 h-3 rounded bg-amber-400/70 inline-block" title="Tinggi" />
            <span className="w-3 h-3 rounded bg-rose-500/90 inline-block" title="Puncak" />
          </div>
        </div>

        <div className="grid grid-cols-6 xs:grid-cols-8 sm:grid-cols-12 md:grid-cols-24 gap-1.5 sm:gap-2">
          {analytics.heatmapByHour.map(h => {
            const intensity = Math.min(1, h.count / 20);
            return (
              <div
                key={h.hour}
                className="h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all hover:scale-105 cursor-pointer shadow-sm"
                style={{
                  backgroundColor:
                    intensity > 0.7
                      ? 'rgba(255, 45, 107, 0.85)'
                      : intensity > 0.4
                      ? 'rgba(255, 183, 3, 0.7)'
                      : intensity > 0.1
                      ? 'rgba(0, 240, 255, 0.35)'
                      : 'rgba(255, 255, 255, 0.05)',
                  color: intensity > 0.4 ? '#000' : '#aaa',
                }}
                title={`Pukul ${h.hour}:00 - ${h.count} sesi balapan`}
              >
                {h.hour}h
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
