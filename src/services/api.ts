import { UserProfile, LeaderboardEntry, Tournament, NotificationItem, AnalyticsData, DifficultyLevel } from '../types/game';

const LOCAL_STORAGE_USER_KEY = 'cyber_pursuit_cached_user';
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
    } catch (e) {
      console.error(e);
    }
  },

  async getProfile(): Promise<UserProfile | null> {
    const local = this.getLocalUser();
    if (!local) return null;
    try {
      const res = await fetch(`/api/profile?userId=${local.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser(data.user);
          return data.user;
        }
      }
    } catch {
      // fallback to cached offline profile
    }
    return local;
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    } catch (e) {}
  },

  async syncOfflineQueue(): Promise<void> {
    await this.syncPendingScores();
  },

  async login(username: string, password?: string): Promise<{ success?: boolean; require2FA?: boolean; userId?: string; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
      }
      return data;
    } catch (err) {
      // Fallback to local user if matching
      const local = this.getLocalUser();
      if (local && (local.username.toLowerCase() === username.toLowerCase() || local.email.toLowerCase() === username.toLowerCase())) {
        return { success: true, user: local };
      }
      return { error: 'Gagal terhubung ke server. Periksa koneksi internet.' };
    }
  },

  async register(username: string, email: string, password?: string): Promise<{ success?: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data.user) {
        this.saveLocalUser(data.user);
      }
      return data;
    } catch (err) {
      return { error: 'Koneksi gagal. Silakan coba lagi.' };
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
    score: number;
    distance: number;
    bestCombo: number;
    difficulty: DifficultyLevel;
    obstaclesDodged: number;
    powerUpsCollected: number;
    bossKilled?: boolean;
    empUsed?: number;
    nearMisses?: number;
  }): Promise<{ success?: boolean; rank?: number; score?: LeaderboardEntry; userStats?: any }> {
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      // Also update local cached user stats
      const local = this.getLocalUser();
      if (local && data.userStats) {
        local.stats = data.userStats;
        this.saveLocalUser(local);
      }
      return data;
    } catch (err) {
      // Store in pending queue for offline sync
      try {
        const pending = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES) || '[]');
        pending.push(payload);
        localStorage.setItem(LOCAL_STORAGE_PENDING_SCORES, JSON.stringify(pending));
      } catch (e) {}

      return { success: true, rank: 99 };
    }
  },

  async syncPendingScores(): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return;

      for (const item of list) {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }
      localStorage.removeItem(LOCAL_STORAGE_PENDING_SCORES);
    } catch (e) {
      console.warn('Pending score sync failed, will retry later');
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
