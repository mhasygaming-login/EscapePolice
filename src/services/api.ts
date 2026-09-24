import { UserProfile, LeaderboardEntry, Tournament, NotificationItem, AnalyticsData, DifficultyLevel } from '../types/game';
import { encryptedActivityService } from './encryptedActivity';

const LOCAL_STORAGE_USER_KEY = 'cyber_pursuit_cached_user';
const LOCAL_STORAGE_ACTIVE_SESSION = 'cyber_pursuit_active_session';
const LOCAL_STORAGE_PENDING_SCORES = 'cyber_pursuit_pending_scores';

export const api = {
  // Offline sync helper
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getLocalUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveLocalUser(user: UserProfile) {
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      // Mengingat status login pengguna agar tidak perlu masuk kembali
      if (user.id && !user.id.startsWith('guest_') && !user.id.startsWith('offline_')) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION, user.id);
      }
    } catch (e) {
      console.error(e);
    }
  },

  getActiveSessionUserId(): string | null {
    try {
      return localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION);
    } catch {
      return null;
    }
  },

  async getProfile(): Promise<UserProfile | null> {
    const local = this.getLocalUser();
    const activeUserId = this.getActiveSessionUserId() || local?.id;

    // Hanya pengguna yang terdaftar secara valid
    if (!activeUserId || activeUserId.startsWith('guest_') || activeUserId.startsWith('offline_') || activeUserId.startsWith('anon')) {
      return null;
    }

    try {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(activeUserId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser(data.user);
          return data.user;
        }
      } else if (res.status === 404 && local && local.username && activeUserId.startsWith('usr_')) {
        // Auto-heal: Server restart/container reload, pulihkan sesi akun terdaftar
        const syncRes = await fetch('/api/profile/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: local }),
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.user) {
            this.saveLocalUser(syncData.user);
            return syncData.user;
          }
        }
      }
    } catch {
      // fallback to cached offline profile
    }
    return local;
  },

  // Sinkronisasi data profil & progres lengkap ke Cloud
  async syncCloudData(): Promise<{ success: boolean; user?: UserProfile }> {
    try {
      const local = this.getLocalUser();
      if (!local || !local.id.startsWith('usr_')) {
        return { success: true };
      }

      // Ambil skor offline yang belum terkirim
      let pendingScores: any[] = [];
      try {
        const rawPending = localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES);
        if (rawPending) {
          pendingScores = JSON.parse(rawPending);
        }
      } catch {}

      const res = await fetch('/api/sync/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: local, pendingScores }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser(data.user);
          if (pendingScores.length > 0) {
            localStorage.removeItem(LOCAL_STORAGE_PENDING_SCORES);
          }
          return { success: true, user: data.user };
        }
      }
    } catch (err) {
      console.warn('Cloud sync error, operating in offline cache mode:', err);
    }
    return { success: false, user: this.getLocalUser() || undefined };
  },

  // Logout Sesi Aman: Data akun dan seluruh progres di Cloud TETAP AMAN TERSIMPAN
  async logout(userId?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const targetUserId = userId || this.getActiveSessionUserId() || this.getLocalUser()?.id;

      if (targetUserId) {
        // Sinkronkan data terlebih dahulu sebelum keluar agar progres mutakhir tidak tercecer
        await this.syncCloudData().catch(() => {});

        // Panggil endpoint logout aman (TIDAK menghapus akun)
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId }),
        }).catch(() => {});
      }

      // Hapus sesi aktif lokal agar user bisa ganti akun atau login ulang
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      return { success: true, message: 'Berhasil keluar sesi. Progres tersimpan aman di Cloud.' };
    } catch (e) {
      console.error('Logout error:', e);
      return { success: false };
    }
  },

  // Hapus Akun Permanen (hanya jika pengguna secara eksplisit menghendaki)
  async deleteAccount(userId: string, password?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Gagal menghapus akun.' };
      }

      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION);
      localStorage.removeItem('cyber_pursuit_enc_activity_vault');
      localStorage.removeItem(LOCAL_STORAGE_PENDING_SCORES);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Koneksi gagal saat menghapus akun.' };
    }
  },

  async syncOfflineQueue(): Promise<void> {
    await this.syncPendingScores();
    await this.syncCloudData();
  },

  async login(username: string, password?: string): Promise<{ success?: boolean; require2FA?: boolean; userId?: string; user?: UserProfile; error?: string }> {
    try {
      let pendingScores: any[] = [];
      try {
        const rawPending = localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES);
        if (rawPending) {
          pendingScores = JSON.parse(rawPending);
        }
      } catch {}

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, offlineScores: pendingScores }),
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
        if (pendingScores.length > 0) {
          localStorage.removeItem(LOCAL_STORAGE_PENDING_SCORES);
        }
        // Catat aktivitas login terenkripsi
        encryptedActivityService.addActivity(data.user.id, {
          type: 'account_registered',
          title: 'Sesi Masuk Berhasil',
          score: data.user.stats?.highScore || 0,
          distance: data.user.stats?.totalDistance || 0,
          obstaclesDodged: data.user.stats?.obstaclesDodged || 0,
          bountyEarned: 0,
          difficulty: 'NORMAL',
          details: `Pengemudi ${data.user.username} masuk ke sistem dengan aman`,
        });
      }
      return data;
    } catch (err) {
      // Fallback to local user if matching (offline login)
      const local = this.getLocalUser();
      if (local && (local.username.toLowerCase() === username.toLowerCase())) {
        if (!password || !local.passwordHash || local.passwordHash === password.trim()) {
          return { success: true, user: local };
        }
      }
      return { error: 'Gagal terhubung ke server. Periksa koneksi internet.' };
    }
  },

  async register(username: string, password?: string): Promise<{ success?: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
        // Catat aktivitas pendaftaran terenkripsi
        encryptedActivityService.addActivity(data.user.id, {
          type: 'account_registered',
          title: 'Pendaftaran Akun Baru',
          score: 0,
          distance: 0,
          obstaclesDodged: 0,
          bountyEarned: 0,
          difficulty: 'NORMAL',
          details: `Akun baru ${data.user.username} berhasil didaftarkan`,
        });
      }
      return data;
    } catch (err) {
      return { error: 'Koneksi gagal. Silakan coba lagi.' };
    }
  },

  async verifyPassword(userId: string, password: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      return await res.json();
    } catch (err) {
      return { error: 'Gagal memverifikasi kata sandi. Periksa koneksi Anda.' };
    }
  },

  async verify2FA(userId: string, code: string): Promise<{ success?: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
      }
      return data;
    } catch (err) {
      return { error: 'Gagal verifikasi kode 2FA' };
    }
  },

  async biometricLogin(userId?: string): Promise<{ success?: boolean; user?: UserProfile; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
      }
      return data;
    } catch (err) {
      const local = this.getLocalUser();
      if (local && local.biometricEnabled) {
        return { success: true, user: local, message: 'Autentikasi biometrik lokal disetujui (offline)!' };
      }
      return { error: 'Biometrik gagal diverifikasi.' };
    }
  },

  async guestLogin(): Promise<{ success?: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
      }
      return data;
    } catch (err) {
      // Offline fallback guest
      const guest: UserProfile = {
        id: 'offline_guest_' + Date.now(),
        username: 'CyberDriver_Offline',
        email: 'offline@driver.local',
        avatar: '🏎️',
        title: 'STREET GHOST',
        carColor: '#f8fafc',
        carModel: 'civic_fl5',
        trailEffect: 'cyan_plasma',
        twoFactorEnabled: false,
        biometricEnabled: false,
        achievements: ['first'],
        stats: {
          highScore: 0,
          gamesPlayed: 0,
          totalDistance: 0,
          obstaclesDodged: 0,
          powerUpsCollected: 0,
          bestCombo: 0,
          totalBounty: 50,
          maxLevel: 1,
          bossKills: 0,
          nearMisses: 0,
          empUsed: 0,
          multiplayerWins: 0,
          multiplayerMatches: 0,
        },
        layoutSettings: {
          hudPosition: 'top',
          controlsStyle: 'buttons',
          screenShake: true,
          scanlines: true,
          soundEnabled: true,
        },
        notificationSettings: {
          friendScores: true,
          tournaments: true,
          pushEnabled: true,
          dailyMissions: true,
        },
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      this.saveLocalUser(guest);
      return { success: true, user: guest };
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ success?: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
      }
      return data;
    } catch (err) {
      const local = this.getLocalUser();
      if (local && local.id === userId) {
        const updated = { ...local, ...updates };
        this.saveLocalUser(updated);
        return { success: true, user: updated };
      }
      return { error: 'Gagal memperbarui profil secara online' };
    }
  },

  async submitScore(payload: {
    userId: string;
    username?: string;
    avatar?: string;
    title?: string;
    carColor?: string;
    carModel?: string;
    score: number;
    distance: number;
    bestCombo: number;
    difficulty: DifficultyLevel;
    obstaclesDodged: number;
    powerUpsCollected: number;
    bossKilled?: boolean;
    empUsed?: number;
    nearMisses?: number;
  }): Promise<{ success?: boolean; rank?: number; score?: LeaderboardEntry; userStats?: any; isRegistered?: boolean }> {
    const local = this.getLocalUser();
    const enrichedPayload = {
      userId: payload.userId || local?.id || 'guest',
      username: payload.username || local?.username || 'Pembalap Tamu',
      avatar: payload.avatar || local?.avatar || '🏎️',
      title: payload.title || local?.title || 'Rookie Runner',
      carColor: payload.carColor || local?.carColor || '#00f0ff',
      carModel: payload.carModel || local?.carModel || 'civic_fl5',
      score: Math.max(0, Math.floor(payload.score || 0)),
      distance: Math.max(0, Math.floor(payload.distance || 0)),
      bestCombo: Math.max(0, Math.floor(payload.bestCombo || 0)),
      difficulty: payload.difficulty,
      obstaclesDodged: Math.max(0, Math.floor(payload.obstaclesDodged || 0)),
      powerUpsCollected: Math.max(0, Math.floor(payload.powerUpsCollected || 0)),
      bossKilled: Boolean(payload.bossKilled),
      empUsed: Math.max(0, Math.floor(payload.empUsed || 0)),
      nearMisses: Math.max(0, Math.floor(payload.nearMisses || 0)),
    };

    // Simpan riwayat balapan ke dalam penyimpanan lokal terenkripsi
    encryptedActivityService.addActivity(payload.userId, {
      type: 'game_run',
      title: `Pengejaran Polisi (${payload.difficulty})`,
      score: payload.score,
      distance: payload.distance,
      obstaclesDodged: payload.obstaclesDodged,
      bountyEarned: Math.floor(payload.score / 10) + (payload.bossKilled ? 500 : 0),
      difficulty: payload.difficulty,
      details: `Combo x${payload.bestCombo}, PowerUp: ${payload.powerUpsCollected}${payload.bossKilled ? ', Boss Kalah!' : ''}`,
    });

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedPayload),
      });
      const data = await res.json();
      // Also update local cached user stats
      if (local && data.userStats) {
        local.stats = data.userStats;
        this.saveLocalUser(local);
      }
      return data;
    } catch (err) {
      // Store in pending queue for offline sync
      try {
        const pending = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES) || '[]');
        pending.push(enrichedPayload);
        localStorage.setItem(LOCAL_STORAGE_PENDING_SCORES, JSON.stringify(pending));
      } catch (e) {}

      return { success: true, rank: 99, isRegistered: true };
    }
  },

  async syncPendingScores(): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return;

      const user = this.getLocalUser();
      const res = await fetch('/api/scores/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, scores: list }),
      });

      if (res.ok) {
        localStorage.removeItem(LOCAL_STORAGE_PENDING_SCORES);
        const data = await res.json();
        if (user && data.userStats) {
          user.stats = data.userStats;
          this.saveLocalUser(user);
        }
      }
    } catch (e) {
      console.warn('Pending score batch sync failed, will retry later');
    }
  },

  async getLeaderboard(period: 'all' | 'daily' | 'weekly' = 'all', difficulty?: string, search?: string): Promise<{ leaderboard: LeaderboardEntry[]; total: number }> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (difficulty) params.append('difficulty', difficulty);
      if (search) params.append('search', search);

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      return await res.json();
    } catch (err) {
      return { leaderboard: [], total: 0 };
    }
  },

  async getAnalytics(userId?: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(`/api/analytics?userId=${userId || ''}`);
      return await res.json();
    } catch (err) {
      // Fallback dummy analytics
      return {
        dailyScores: [],
        heatmapByHour: [],
        performanceMetrics: { dodgeRate: 85, grazeAccuracy: 50, avgSurvivalDistance: 1200, multiplayerWinRate: 60 },
        summary: { totalPlayTimeMinutes: 30, totalRuns: 10, highestBounty: 1500, topDifficulty: 'NORMAL' },
      };
    }
  },

  async getTournaments(userId?: string): Promise<Tournament[]> {
    try {
      const res = await fetch(`/api/tournaments?userId=${userId || ''}`);
      const data = await res.json();
      return data.tournaments || [];
    } catch (err) {
      return [];
    }
  },

  async registerTournament(id: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      return false;
    }
  },

  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`/api/notifications?userId=${userId || ''}`);
      const data = await res.json();
      return data.notifications || [];
    } catch (err) {
      return [];
    }
  },

  async markNotificationRead(userId?: string, notifId?: string): Promise<void> {
    try {
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notifId }),
      });
    } catch (err) {}
  },
};
