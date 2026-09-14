import React, { useState, useEffect } from 'react';
import { UserProfile, AnalyticsData } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { BarChart3, Download, TrendingUp, Zap, Target, Flame, Clock, Award } from 'lucide-react';

interface AnalyticsModalProps {
  user: UserProfile | null;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ user }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics(user?.id).then(data => {
      setAnalytics(data);
      setLoading(false);
    });
  }, [user?.id]);

  const handleExportData = async () => {
    sound.play('click');
    try {
      const res = await fetch(`/api/export-data?userId=${encodeURIComponent(user?.id || '')}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyber_pursuit_report_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Export failed:', e);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 text-center">
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
    <div className="w-full max-w-5xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0d0f1e] to-[#0a0a14] border border-emerald-500/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2">
            <BarChart3 className="w-3.5 h-3.5" /> Analitik Performa & Visual Progress
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white text-glow-cyan">
            STATISTIK KEJARAN & PERFORMA
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Pantau tren skor harian, akurasi penghindaran, dan statistik duel kompetitif secara transparan.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all"
        >
          <Download className="w-4 h-4" /> Ekspor Laporan (JSON)
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Akurasi Dodge</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-display font-black text-white">
            {analytics.performanceMetrics.dodgeRate}%
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Rintangan sukses dilewati</div>
        </div>

        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Graze / Near-Miss</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-display font-black text-amber-400">
            {analytics.performanceMetrics.grazeAccuracy}%
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Keberanian serempetan musuh</div>
        </div>

        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Rata-rata Jarak</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-display font-black text-cyan-400">
            {analytics.performanceMetrics.avgSurvivalDistance.toLocaleString()} m
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Daya tahan per run</div>
        </div>

        <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Multiplayer Win Rate</span>
            <Award className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div className="text-2xl font-display font-black text-fuchsia-400">
            {analytics.performanceMetrics.multiplayerWinRate}%
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Kemenangan duel highway</div>
        </div>
      </div>

      {/* Visual Chart: 7-Day Score Progression */}
      <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-white text-base">Tren Skor 7 Hari Terakhir</h3>
            <p className="text-xs text-gray-400 mt-0.5">Perbandingan skor puncak vs rata-rata harian</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
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
                    className="w-1/3 bg-cyan-500/80 group-hover:bg-cyan-400 rounded-t transition-all relative"
                    style={{ height: `${maxH}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-black px-1.5 py-0.5 rounded text-[9px] font-display text-cyan-300 font-bold pointer-events-none whitespace-nowrap z-10 border border-cyan-500/40">
                      {day.maxScore}
                    </div>
                  </div>
                  {/* Avg Bar */}
                  <div
                    className="w-1/3 bg-emerald-500/60 group-hover:bg-emerald-400 rounded-t transition-all relative"
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

      {/* Hourly Intensity Distribution */}
      <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-6">
        <h3 className="font-display font-bold text-white text-base mb-1">Distribusi Jam Bermain (Heatmap)</h3>
        <p className="text-xs text-gray-400 mb-4">Waktu tersibuk saat kamu melarikan diri dari kejaran polisi</p>
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1">
          {analytics.heatmapByHour.map(h => {
            const intensity = Math.min(1, h.count / 20);
            return (
              <div
                key={h.hour}
                className="h-9 rounded flex flex-col items-center justify-center text-[9px] font-bold transition-transform hover:scale-110"
                style={{
                  backgroundColor:
                    intensity > 0.7
                      ? 'rgba(255, 45, 107, 0.85)'
                      : intensity > 0.4
                      ? 'rgba(255, 183, 3, 0.7)'
                      : intensity > 0.1
                      ? 'rgba(0, 240, 255, 0.35)'
                      : 'rgba(255, 255, 255, 0.05)',
                  color: intensity > 0.4 ? '#000' : '#888',
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
