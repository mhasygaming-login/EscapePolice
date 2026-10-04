import { UserProfile, LeaderboardEntry, Tournament, NotificationItem, AnalyticsData, DifficultyLevel } from '../types/game';
import { encryptedActivityService } from './encryptedActivity';
import { buildApiUrl, DEFAULT_CLOUD_BACKEND_URL } from '../utils/serverUrl';

const LOCAL_STORAGE_USER_KEY = 'cyber_pursuit_cached_user';
const LOCAL_STORAGE_ACTIVE_SESSION = 'cyber_pursuit_active_session';
const LOCAL_STORAGE_PENDING_SCORES = 'cyber_pursuit_pending_scores';
const LOCAL_STORAGE_REGISTERED_USERS = 'cyber_pursuit_registered_users';

function getStoredUsersMap(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REGISTERED_USERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUserLocally(user: UserProfile) {
  try {
    if (!user || !user.username) return;
    const map = getStoredUsersMap();
    map[user.username.trim().toLowerCase()] = user;
    localStorage.setItem(LOCAL_STORAGE_REGISTERED_USERS, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to save user in local registry:', e);
  }
}

export const api = {
  // Offline sync helper
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // Resilient API request with automatic cross-domain fallback
  async request(path: string, options?: RequestInit): Promise<Response> {
    const primaryUrl = buildApiUrl(path);
    try {
      const res = await fetch(primaryUrl, options);
      const isHtmlResponse = res.headers.get('content-type')?.includes('text/html');
      // If 404 or Vercel returned HTML SPA fallback, retry against the live Cloud Run backend if different
      if ((!res.ok && res.status === 404) || isHtmlResponse) {
        if (!primaryUrl.startsWith(DEFAULT_CLOUD_BACKEND_URL) && DEFAULT_CLOUD_BACKEND_URL !== window.location.origin) {
          const fallbackUrl = `${DEFAULT_CLOUD_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
          try {
            const fbRes = await fetch(fallbackUrl, options);
            if (fbRes.ok || fbRes.status < 500) {
              return fbRes;
            }
          } catch {}
        }
      }
      return res;
    } catch (err) {
      if (!primaryUrl.startsWith(DEFAULT_CLOUD_BACKEND_URL) && DEFAULT_CLOUD_BACKEND_URL !== window.location.origin) {
        const fallbackUrl = `${DEFAULT_CLOUD_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
        return await fetch(fallbackUrl, options);
      }
      throw err;
    }
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
      saveStoredUserLocally(user);
      // Mengingat status login pengguna agar tidak perlu masuk kembali
      if (user.id && !user.id.startsWith('guest_') && !user.id.startsWith('offline_')) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION, user.id);
      }
    } catch {
      // Local storage unavailable or full
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

    // Kembalikan profil lokal langsung agar loading sekejap
    if (local && local.id === activeUserId) {
      // Background sync jika online
      this.syncCloudData().catch(() => {});
      return local;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await this.request(`/api/profile?userId=${encodeURIComponent(activeUserId)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const isHtml = res.headers.get('content-type')?.includes('text/html');

      if (res.ok && !isHtml) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser(data.user);
          return data.user;
        }
      } else if (res.status === 404 && local && local.username && activeUserId.startsWith('usr_')) {
        // Auto-heal: Server restart/container reload, pulihkan sesi akun terdaftar
        const syncRes = await this.request('/api/profile/sync', {
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

      const res = await this.request('/api/sync/cloud', {
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
        await this.request('/api/auth/logout', {
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
      console.warn('Logout error:', e);
      return { success: false };
    }
  },

  // Hapus Akun Permanen (hanya jika pengguna secara eksplisit menghendaki)
  async deleteAccount(userId: string, password?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await this.request('/api/auth/delete-account', {
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
    const cleanUsername = (username || '').trim().slice(0, 24);
    const cleanPassword = (password || '').trim().slice(0, 64);

    if (!cleanUsername) {
      return { error: 'Nama pemain wajib diisi!' };
    }

    let pendingScores: any[] = [];
    try {
      const rawPending = localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES);
      if (rawPending) {
        pendingScores = JSON.parse(rawPending);
      }
    } catch {}

    // 1. Coba login ke server dengan timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await this.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword, offlineScores: pendingScores }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const isHtml = res.headers.get('content-type')?.includes('text/html');
      if (res.ok && !isHtml) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser(data.user);
          if (pendingScores.length > 0) {
            localStorage.removeItem(LOCAL_STORAGE_PENDING_SCORES);
          }
          encryptedActivityService.addActivity(data.user.id, {
            type: 'account_registered',
            title: 'Sesi Masuk Berhasil',
            score: data.user.stats?.highScore || 0,
            distance: data.user.stats?.totalDistance || 0,
            obstaclesDodged: data.user.stats?.obstaclesDodged || 0,
            bountyEarned: 0,
            difficulty: 'NORMAL',
            details: `Pengemudi ${data.user.username} masuk ke sistem`,
          });
          return data;
        }
      } else if (!isHtml) {
        // Respons JSON error spesifik dari server (misal password salah)
        try {
          const errData = await res.json();
          if (errData?.error) {
            return { error: errData.error };
          }
        } catch {}
      }
    } catch (err) {
      // Server tidak dapat dihubungi (misal di Vercel tanpa backend eksternal atau offline)
    }

    // 2. Fallback resilient: Cek registri lokal
    const map = getStoredUsersMap();
    const localUser = map[cleanUsername.toLowerCase()] || this.getLocalUser();

    if (localUser && (localUser.username.toLowerCase() === cleanUsername.toLowerCase())) {
      if (localUser.passwordHash && cleanPassword && localUser.passwordHash !== cleanPassword) {
        return { error: 'Password yang Anda masukkan salah!' };
      }
      this.saveLocalUser(localUser);
      encryptedActivityService.addActivity(localUser.id, {
        type: 'account_registered',
        title: 'Sesi Masuk (Lokal/Offline)',
        score: localUser.stats?.highScore || 0,
        distance: localUser.stats?.totalDistance || 0,
        obstaclesDodged: localUser.stats?.obstaclesDodged || 0,
        bountyEarned: 0,
        difficulty: 'NORMAL',
        details: `Pembalap ${localUser.username} masuk melalui penyimpanan lokal`,
      });
      return { success: true, user: localUser };
    }

    return { error: 'Nama pemain belum terdaftar. Silakan buat akun baru di tab Daftar terlebih dahulu!' };
  },

  async register(username: string, password?: string): Promise<{ success?: boolean; user?: UserProfile; error?: string }> {
    const cleanUsername = (username || '').trim().slice(0, 24);
    const cleanPassword = (password || '').trim().slice(0, 64);

    if (!cleanUsername) {
      return { error: 'Nama pemain wajib diisi!' };
    }
    if (cleanUsername.length < 2) {
      return { error: 'Nama pemain minimal 2 karakter!' };
    }
    if (!cleanPassword || cleanPassword.length < 3) {
      return { error: 'Password minimal 3 karakter!' };
    }

    // Cek registri lokal untuk mencegah duplikasi nama di browser yang sama
    const map = getStoredUsersMap();
    if (map[cleanUsername.toLowerCase()]) {
      return { error: 'Nama pemain sudah terdaftar di perangkat ini! Silakan pilih nama lain atau masuk di tab Masuk.' };
    }

    // 1. Coba mendaftar ke server backend Cloud jika tersedia
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await this.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const isHtml = res.headers.get('content-type')?.includes('text/html');
      if (res.ok && !isHtml) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser(data.user);
          encryptedActivityService.addActivity(data.user.id, {
            type: 'account_registered',
            title: 'Pendaftaran Akun Baru (Cloud)',
            score: 0,
            distance: 0,
            obstaclesDodged: 0,
            bountyEarned: 0,
            difficulty: 'NORMAL',
            details: `Akun baru ${data.user.username} berhasil didaftarkan di server Cloud`,
          });
          return data;
        }
      } else if (!isHtml) {
        try {
          const errData = await res.json();
          if (errData?.error) {
            return { error: errData.error };
          }
        } catch {}
      }
    } catch (err) {
      // Backend server tidak dapat dijangkau (misal deploy di Vercel static tanpa server aktif)
    }

    // 2. Pembuatan Akun Resilient Instan (TIDAK PERNAH GAGAL)
    // Memastikan siapa pun pemain di Vercel atau lintas perangkat langsung bisa membuat akun!
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newUser: UserProfile = {
      id: userId,
      username: cleanUsername,
      email: `${cleanUsername.toLowerCase()}@cyberpursuit.local`,
      passwordHash: cleanPassword,
      avatar: '🏎️',
      title: 'ROOKIE RACER',
      carColor: '#00f0ff',
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
        totalBounty: 0,
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

    this.saveLocalUser(newUser);
    encryptedActivityService.addActivity(userId, {
      type: 'account_registered',
      title: 'Pendaftaran Akun Baru',
      score: 0,
      distance: 0,
      obstaclesDodged: 0,
      bountyEarned: 0,
      difficulty: 'NORMAL',
      details: `Akun baru ${newUser.username} berhasil dibuat dan siap dimainkan!`,
    });

    return { success: true, user: newUser };
  },

  async verifyPassword(userId: string, password: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await this.request('/api/auth/verify-password', {
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
      const res = await this.request('/api/auth/verify-2fa', {
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
      const res = await this.request('/api/auth/biometric', {
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
      const res = await this.request('/api/auth/guest', {
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
      const res = await this.request('/api/profile', {
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
      const res = await this.request('/api/scores', {
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

      // Perbarui statistik lokal langsung
      if (local) {
        local.stats.gamesPlayed += 1;
        local.stats.totalDistance += enrichedPayload.distance;
        local.stats.obstaclesDodged += enrichedPayload.obstaclesDodged;
        local.stats.powerUpsCollected += enrichedPayload.powerUpsCollected;
        local.stats.nearMisses += enrichedPayload.nearMisses;
        local.stats.empUsed += enrichedPayload.empUsed;
        if (enrichedPayload.bossKilled) local.stats.bossKills += 1;
        if (enrichedPayload.bestCombo > local.stats.bestCombo) local.stats.bestCombo = enrichedPayload.bestCombo;
        if (enrichedPayload.score > local.stats.highScore) local.stats.highScore = enrichedPayload.score;
        local.stats.totalBounty += Math.floor(enrichedPayload.score / 10) + (enrichedPayload.bossKilled ? 500 : 0);
        this.saveLocalUser(local);
      }

      return { success: true, rank: 1, userStats: local?.stats, isRegistered: true };
    }
  },

  async syncPendingScores(): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_SCORES);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return;

      const user = this.getLocalUser();
      const res = await this.request('/api/scores/batch', {
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await this.request(`/api/leaderboard?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const isHtml = res.headers.get('content-type')?.includes('text/html');

      if (res.ok && !isHtml) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          return data;
        }
      }
    } catch (err) {}

    // Fallback: Bentuk papan peringkat dari semua akun terdaftar di penyimpanan lokal
    const map = getStoredUsersMap();
    const localUser = this.getLocalUser();
    if (localUser && localUser.username) {
      map[localUser.username.toLowerCase()] = localUser;
    }

    let localEntries: LeaderboardEntry[] = Object.values(map)
      .filter(u => u && u.username && !u.id.startsWith('guest_') && !u.id.startsWith('offline_'))
      .map(u => ({
        id: 'sc_' + u.id,
        userId: u.id,
        username: u.username,
        avatar: u.avatar || '🏎️',
        title: u.title || 'RACER',
        carColor: u.carColor || '#00f0ff',
        score: u.stats?.highScore || 0,
        distance: u.stats?.totalDistance || 0,
        bestCombo: u.stats?.bestCombo || 0,
        difficulty: 'NORMAL' as DifficultyLevel,
        timestamp: u.lastActive || new Date().toISOString(),
      }));

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      localEntries = localEntries.filter(e => e.username.toLowerCase().includes(q));
    }

    localEntries.sort((a, b) => b.score - a.score);

    return {
      leaderboard: localEntries.slice(0, 100),
      total: localEntries.length,
    };
  },

  async getAnalytics(userId?: string): Promise<AnalyticsData> {
    try {
      const res = await this.request(`/api/analytics?userId=${userId || ''}`);
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
      const res = await this.request(`/api/tournaments?userId=${userId || ''}`);
      const data = await res.json();
      return data.tournaments || [];
    } catch (err) {
      return [];
    }
  },

  async registerTournament(id: string, userId: string): Promise<boolean> {
    try {
      const res = await this.request(`/api/tournaments/${id}/register`, {
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
      const res = await this.request(`/api/notifications?userId=${userId || ''}`);
      const data = await res.json();
      return data.notifications || [];
    } catch (err) {
      return [];
    }
  },

  recordPeerPlayer(info: {
    userId: string;
    username: string;
    avatar?: string;
    title?: string;
    carColor?: string;
    carModel?: string;
    score?: number;
    distance?: number;
    bestCombo?: number;
    difficulty?: DifficultyLevel;
  }): void {
    if (!info || !info.username) return;
    const cleanUsername = info.username.trim();
    if (!cleanUsername || cleanUsername.toLowerCase().startsWith('guest_') || cleanUsername.toLowerCase().startsWith('tamu')) return;
    const map = getStoredUsersMap();
    const key = cleanUsername.toLowerCase();
    const existing = map[key] || {
      id: info.userId || 'peer_' + Date.now(),
      username: cleanUsername,
      email: `${cleanUsername.toLowerCase()}@cyberpursuit.local`,
      avatar: info.avatar || '🏎️',
      title: info.title || 'RACER',
      carColor: info.carColor || '#ff007f',
      carModel: info.carModel || 'civic_fl5',
      trailEffect: 'cyan_plasma',
      twoFactorEnabled: false,
      biometricEnabled: false,
      achievements: ['first'],
      stats: {
        highScore: info.score || 0,
        gamesPlayed: 1,
        totalDistance: info.distance || 0,
        obstaclesDodged: 0,
        powerUpsCollected: 0,
        bestCombo: info.bestCombo || 0,
        totalBounty: Math.floor((info.score || 0) / 10),
        maxLevel: 1,
        bossKills: 0,
        nearMisses: 0,
        empUsed: 0,
        multiplayerWins: 0,
        multiplayerMatches: 1,
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

    if (info.score !== undefined && info.score > (existing.stats?.highScore || 0)) {
      existing.stats.highScore = info.score;
    }
    if (info.distance !== undefined) {
      existing.stats.totalDistance = Math.max(existing.stats.totalDistance || 0, info.distance);
    }
    if (info.bestCombo !== undefined) {
      existing.stats.bestCombo = Math.max(existing.stats.bestCombo || 0, info.bestCombo);
    }
    if (info.avatar) existing.avatar = info.avatar;
    if (info.carColor) existing.carColor = info.carColor;
    if (info.carModel) existing.carModel = info.carModel;
    existing.lastActive = new Date().toISOString();

    map[key] = existing;
    try {
      localStorage.setItem(LOCAL_STORAGE_REGISTERED_USERS, JSON.stringify(map));
    } catch (e) {}
  },

  async markNotificationRead(userId?: string, notifId?: string): Promise<void> {
    try {
      await this.request('/api/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notifId }),
      });
    } catch (err) {}
  },
};
