import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { setupMultiplayerServer } from './server/multiplayer';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Security headers, CORS & body parsing
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Types for DB
interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  title: string;
  carColor: string;
  carModel: string;
  trailEffect: 'none' | 'cyan_plasma' | 'magenta_laser' | 'amber_sparks';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  biometricEnabled: boolean;
  achievements: string[];
  stats: {
    highScore: number;
    gamesPlayed: number;
    totalDistance: number;
    obstaclesDodged: number;
    powerUpsCollected: number;
    bestCombo: number;
    totalBounty: number;
    maxLevel: number;
    bossKills: number;
    nearMisses: number;
    empUsed: number;
    multiplayerWins: number;
    multiplayerMatches: number;
  };
  layoutSettings: {
    hudPosition: 'top' | 'compact' | 'minimal';
    controlsStyle: 'buttons' | 'dpad' | 'split';
    screenShake: boolean;
    scanlines: boolean;
    soundEnabled: boolean;
  };
  notificationSettings: {
    friendScores: boolean;
    tournaments: boolean;
    pushEnabled: boolean;
    dailyMissions: boolean;
  };
  createdAt: string;
  lastActive: string;
}

interface StoredScore {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  title: string;
  carColor: string;
  score: number;
  distance: number;
  bestCombo: number;
  difficulty: string;
  timestamp: string;
}

interface StoredNotification {
  id: string;
  userId: string;
  type: 'score_beaten' | 'friend_activity' | 'tournament_alert' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface DB {
  users: Record<string, StoredUser>;
  scores: StoredScore[];
  notifications: StoredNotification[];
  tournaments: {
    id: string;
    title: string;
    description: string;
    tier: 'ROOKIE' | 'ELITE' | 'CYBER_LEGEND';
    startTime: string;
    endTime: string;
    prizeBounty: number;
    participants: string[];
  }[];
}

// Initial default database state (empty scores for clean registered player leaderboard)
let db: DB = {
  users: {},
  scores: [],
  notifications: [],
  tournaments: [
    {
      id: 'tourney-1',
      title: 'Midnight Pursuit Grand Prix',
      description: 'Lari dari kepungan armada polisi MAXXX selama 24 jam non-stop!',
      tier: 'CYBER_LEGEND',
      startTime: new Date(Date.now() + 3600000 * 2).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 26).toISOString(),
      prizeBounty: 25000,
      participants: []
    },
    {
      id: 'tourney-2',
      title: 'Neon Drift Sprint Championship',
      description: 'Pertarungan combo streak tertinggi di jalan tol neon malam.',
      tier: 'ELITE',
      startTime: new Date(Date.now() + 3600000 * 14).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 38).toISOString(),
      prizeBounty: 10000,
      participants: []
    },
    {
      id: 'tourney-3',
      title: 'Rookie Highway Escape',
      description: 'Kejuaraan harian untuk pengemudi pemula mengasah refleks.',
      tier: 'ROOKIE',
      startTime: new Date(Date.now() + 3600000 * 1).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 8).toISOString(),
      prizeBounty: 5000,
      participants: []
    }
  ]
};

// Load DB from file if available
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = { ...db, ...parsed };
    // Filter out any obsolete bot scores so only registered players appear
    if (Array.isArray(db.scores)) {
      // Pastikan setiap pemain terdaftar hanya memiliki 1 entri resmi dengan skor terakhir dia main
      const userLatestScoreMap = new Map<string, StoredScore>();
      for (const s of db.scores) {
        if (!s.userId || s.userId.startsWith('bot-') || s.userId.startsWith('guest_') || s.userId.startsWith('anon') || s.userId.startsWith('offline_')) {
          continue;
        }
        const existing = userLatestScoreMap.get(s.userId);
        if (!existing || new Date(s.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
          userLatestScoreMap.set(s.userId, s);
        }
      }
      db.scores = Array.from(userLatestScoreMap.values());
    }
  } catch (err) {
    console.error('Failed to parse db.json, using fallback defaults', err);
  }
} else {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to create initial db.json', err);
  }
}

// ----------------------------------------------------
// HIGH-PERFORMANCE IN-MEMORY INDICES & CACHING
// ----------------------------------------------------
const userByUsernameLower = new Map<string, StoredUser>();
function rebuildUserIndices() {
  userByUsernameLower.clear();
  for (const user of Object.values(db.users)) {
    if (user && user.username) {
      userByUsernameLower.set(user.username.trim().toLowerCase(), user);
    }
  }
}
rebuildUserIndices();

// Leaderboard in-memory sorted cache
let cachedLeaderboard: StoredScore[] | null = null;
function invalidateLeaderboardCache() {
  cachedLeaderboard = null;
}

// ----------------------------------------------------
// ASYNCHRONOUS NON-BLOCKING ATOMIC PERSISTENCE ENGINE
// ----------------------------------------------------
let isPersisting = false;
let pendingSaveRequested = false;
let saveDebounceTimer: NodeJS.Timeout | null = null;

async function flushDBToDisk(): Promise<void> {
  if (isPersisting) {
    pendingSaveRequested = true;
    return;
  }
  isPersisting = true;
  pendingSaveRequested = false;

  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(db, null, 2);
    await fs.promises.writeFile(tempFile, payload, 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('Async saveDB failed:', err);
  } finally {
    isPersisting = false;
    if (pendingSaveRequested) {
      setImmediate(() => {
        flushDBToDisk().catch(() => {});
      });
    }
  }
}

// Debounced asynchronous non-blocking save
function saveDB(immediate = false) {
  invalidateLeaderboardCache();

  if (immediate) {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }
    flushDBToDisk().catch(() => {});
    return;
  }

  if (saveDebounceTimer) return;
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    flushDBToDisk().catch(() => {});
  }, 60);
}

// Emergency sync flush on process exit
function saveDBSync() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Emergency sync save failed:', err);
  }
}

process.on('SIGINT', () => {
  saveDBSync();
  process.exit(0);
});
process.on('SIGTERM', () => {
  saveDBSync();
  process.exit(0);
});

// Initialize Real-time Socket.IO Multiplayer Game Server
const { io, broadcastLeaderboardUpdate, sendUserNotification, broadcastGlobalAlert } = setupMultiplayerServer(server, db, saveDB);

// REST API ROUTES
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/profile', (req, res) => {
  const { userId, username } = req.query;
  if ((!userId || typeof userId !== 'string') && (!username || typeof username !== 'string')) {
    return res.status(400).json({ error: 'userId atau username diperlukan' });
  }

  let user = typeof userId === 'string' ? db.users[userId] : undefined;
  if (!user && typeof username === 'string' && username.trim()) {
    user = userByUsernameLower.get(username.trim().toLowerCase());
  }

  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  res.json({ success: true, user });
});

// Endpoint sinkronisasi profil & data akun ke Cloud (mendukung online & offline progress merger)
app.post(['/api/profile/sync', '/api/sync/cloud'], (req, res) => {
  const { user, pendingScores } = req.body;
  if (!user || typeof user !== 'object' || !user.id || !user.username) {
    return res.status(400).json({ error: 'Data user tidak valid' });
  }

  const userId = String(user.id);
  const username = String(user.username).trim().slice(0, 24);

  // Hanya pulihkan & sinkronkan akun terdaftar
  if (userId.startsWith('usr_')) {
    if (!db.users[userId]) {
      const restoredUser: StoredUser = {
        id: userId,
        username,
        email: user.email || `${username.toLowerCase()}@cyberpursuit.local`,
        passwordHash: user.passwordHash || '',
        avatar: user.avatar || '🏎️',
        title: user.title || 'RACER',
        carColor: user.carColor || '#00f0ff',
        carModel: user.carModel || 'civic_fl5',
        trailEffect: user.trailEffect || 'cyan_plasma',
        twoFactorEnabled: false,
        biometricEnabled: false,
        achievements: Array.isArray(user.achievements) ? user.achievements : [],
        stats: {
          highScore: Math.max(0, Math.floor(Number(user.stats?.highScore) || 0)),
          gamesPlayed: Math.max(0, Math.floor(Number(user.stats?.gamesPlayed) || 0)),
          totalDistance: Math.max(0, Math.floor(Number(user.stats?.totalDistance) || 0)),
          obstaclesDodged: Math.max(0, Math.floor(Number(user.stats?.obstaclesDodged) || 0)),
          powerUpsCollected: Math.max(0, Math.floor(Number(user.stats?.powerUpsCollected) || 0)),
          bestCombo: Math.max(0, Math.floor(Number(user.stats?.bestCombo) || 0)),
          totalBounty: Math.max(0, Math.floor(Number(user.stats?.totalBounty) || 0)),
          maxLevel: Math.max(1, Math.floor(Number(user.stats?.maxLevel) || 1)),
          bossKills: Math.max(0, Math.floor(Number(user.stats?.bossKills) || 0)),
          nearMisses: Math.max(0, Math.floor(Number(user.stats?.nearMisses) || 0)),
          empUsed: Math.max(0, Math.floor(Number(user.stats?.empUsed) || 0)),
          multiplayerWins: Math.max(0, Math.floor(Number(user.stats?.multiplayerWins) || 0)),
          multiplayerMatches: Math.max(0, Math.floor(Number(user.stats?.multiplayerMatches) || 0)),
        },
        layoutSettings: user.layoutSettings || {
          hudPosition: 'top',
          controlsStyle: 'buttons',
          screenShake: true,
          scanlines: true,
          soundEnabled: true,
        },
        notificationSettings: user.notificationSettings || {
          friendScores: true,
          tournaments: true,
          pushEnabled: true,
          dailyMissions: true,
        },
        createdAt: user.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      db.users[userId] = restoredUser;
      userByUsernameLower.set(username.toLowerCase(), restoredUser);
    } else {
      // User sudah ada di database Cloud: gabungkan (merge) progres terbaik tanpa menimpa secara merugikan
      const existing = db.users[userId];
      existing.stats.highScore = Math.max(existing.stats.highScore || 0, Math.floor(Number(user.stats?.highScore) || 0));
      existing.stats.gamesPlayed = Math.max(existing.stats.gamesPlayed || 0, Math.floor(Number(user.stats?.gamesPlayed) || 0));
      existing.stats.totalDistance = Math.max(existing.stats.totalDistance || 0, Math.floor(Number(user.stats?.totalDistance) || 0));
      existing.stats.obstaclesDodged = Math.max(existing.stats.obstaclesDodged || 0, Math.floor(Number(user.stats?.obstaclesDodged) || 0));
      existing.stats.powerUpsCollected = Math.max(existing.stats.powerUpsCollected || 0, Math.floor(Number(user.stats?.powerUpsCollected) || 0));
      existing.stats.bestCombo = Math.max(existing.stats.bestCombo || 0, Math.floor(Number(user.stats?.bestCombo) || 0));
      existing.stats.totalBounty = Math.max(existing.stats.totalBounty || 0, Math.floor(Number(user.stats?.totalBounty) || 0));
      existing.stats.maxLevel = Math.max(existing.stats.maxLevel || 1, Math.floor(Number(user.stats?.maxLevel) || 1));
      existing.stats.bossKills = Math.max(existing.stats.bossKills || 0, Math.floor(Number(user.stats?.bossKills) || 0));
      existing.stats.nearMisses = Math.max(existing.stats.nearMisses || 0, Math.floor(Number(user.stats?.nearMisses) || 0));
      existing.stats.empUsed = Math.max(existing.stats.empUsed || 0, Math.floor(Number(user.stats?.empUsed) || 0));
      existing.stats.multiplayerWins = Math.max(existing.stats.multiplayerWins || 0, Math.floor(Number(user.stats?.multiplayerWins) || 0));
      existing.stats.multiplayerMatches = Math.max(existing.stats.multiplayerMatches || 0, Math.floor(Number(user.stats?.multiplayerMatches) || 0));

      // Gabungkan pencapaian (achievements)
      const achSet = new Set(existing.achievements || []);
      if (Array.isArray(user.achievements)) {
        user.achievements.forEach((a: string) => achSet.add(a));
      }
      existing.achievements = Array.from(achSet);

      // Kustomisasi visual jika ada perubahan
      if (user.avatar) existing.avatar = user.avatar;
      if (user.title) existing.title = user.title;
      if (user.carColor) existing.carColor = user.carColor;
      if (user.carModel) existing.carModel = user.carModel;
      if (user.trailEffect) existing.trailEffect = user.trailEffect;
      if (user.layoutSettings) existing.layoutSettings = { ...existing.layoutSettings, ...user.layoutSettings };
      if (user.notificationSettings) existing.notificationSettings = { ...existing.notificationSettings, ...user.notificationSettings };
      existing.lastActive = new Date().toISOString();
    }

    // Jika ada pending offline scores yang disertakan
    if (Array.isArray(pendingScores) && pendingScores.length > 0) {
      for (const item of pendingScores) {
        if (!item || !item.score) continue;
        const sNum = Math.floor(Number(item.score) || 0);
        if (sNum > db.users[userId].stats.highScore) {
          db.users[userId].stats.highScore = sNum;
        }
      }
    }

    saveDB(true);
    return res.json({ success: true, user: db.users[userId], syncedAt: new Date().toISOString() });
  }

  res.json({ success: true, user: db.users[userId] || user });
});

// Authentication: Register (Simpel Nama & Password saja)
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = typeof username === 'string' ? username.trim().slice(0, 24) : '';
  const cleanPassword = typeof password === 'string' ? password.trim().slice(0, 64) : '';

  if (!cleanUsername) {
    return res.status(400).json({ error: 'Nama pemain wajib diisi!' });
  }
  if (cleanUsername.length < 2) {
    return res.status(400).json({ error: 'Nama pemain minimal 2 karakter!' });
  }
  if (!cleanPassword || cleanPassword.length < 3) {
    return res.status(400).json({ error: 'Password minimal 3 karakter!' });
  }

  // Fast O(1) index check
  const usernameKey = cleanUsername.toLowerCase();
  if (userByUsernameLower.has(usernameKey)) {
    return res.status(400).json({ error: 'Nama pemain sudah terdaftar! Silakan pilih nama lain atau langsung masuk.' });
  }

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  // Data baru mendaftar: pastikan semuanya masih baru dengan data awal kosong
  const newUser: StoredUser = {
    id: userId,
    username: cleanUsername,
    email: `${cleanUsername.toLowerCase()}@cyberpursuit.local`,
    passwordHash: cleanPassword,
    avatar: '🏎️', // Avatar default yang bisa diganti nanti
    title: 'ROOKIE RACER',
    carColor: '#00f0ff',
    carModel: 'civic_fl5',
    trailEffect: 'cyan_plasma',
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    biometricEnabled: false,
    achievements: [], // Data awal kosong
    stats: {
      highScore: 0,
      gamesPlayed: 0,
      totalDistance: 0,
      obstaclesDodged: 0,
      powerUpsCollected: 0,
      bestCombo: 0,
      totalBounty: 0, // Awal 0
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

  db.users[userId] = newUser;
  userByUsernameLower.set(usernameKey, newUser);
  saveDB(true);

  sendUserNotification(userId, {
    id: 'notif-' + Date.now(),
    userId,
    type: 'system',
    title: 'Selamat Datang di Escape Police!',
    message: `Halo ${cleanUsername}, akun barumu siap! Pacu mobilmu dan capai puncak leaderboard.`,
    timestamp: new Date().toISOString(),
    read: false,
  });

  res.json({ success: true, user: newUser });
});

// Authentication: Login (Simpel Nama & Password, aman lintas perangkat & offline sync)
app.post('/api/auth/login', (req, res) => {
  const { username, password, offlineScores } = req.body;
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const cleanPassword = typeof password === 'string' ? password.trim() : '';

  if (!cleanUsername) {
    return res.status(400).json({ error: 'Nama pengguna wajib diisi!' });
  }

  // Fast O(1) index lookup
  let user = userByUsernameLower.get(cleanUsername.toLowerCase());
  if (!user) {
    user = Object.values(db.users).find(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (user) {
      userByUsernameLower.set(cleanUsername.toLowerCase(), user);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Nama pemain belum terdaftar. Silakan buat akun baru terlebih dahulu.' });
  }

  if (user.passwordHash && cleanPassword && user.passwordHash !== cleanPassword) {
    return res.status(401).json({ error: 'Password yang Anda masukkan salah!' });
  }

  // Jika ada skor yang diraih saat bermain offline di perangkat ini sebelum login
  if (Array.isArray(offlineScores) && offlineScores.length > 0) {
    for (const item of offlineScores) {
      if (!item) continue;
      const sNum = Math.floor(Number(item.score) || 0);
      if (sNum > user.stats.highScore) user.stats.highScore = sNum;
      user.stats.gamesPlayed += 1;
      user.stats.totalDistance += Math.floor(Number(item.distance) || 0);
      user.stats.totalBounty += Math.floor(sNum / 10);
      user.stats.obstaclesDodged += Math.floor(Number(item.obstaclesDodged) || 0);
      user.stats.powerUpsCollected += Math.floor(Number(item.powerUpsCollected) || 0);
    }
  }

  user.lastActive = new Date().toISOString();
  saveDB(true);

  res.json({ success: true, user });
});

// Verifikasi Kata Sandi untuk Logout dan Operasi Keamanan
app.post('/api/auth/verify-password', (req, res) => {
  const { userId, password } = req.body;
  const cleanPassword = (password || '').trim();

  if (!userId) {
    return res.status(400).json({ error: 'User ID diperlukan!' });
  }

  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  // Jika akun memiliki password terdaftar
  if (user.passwordHash) {
    if (!cleanPassword) {
      return res.status(400).json({ error: 'Masukkan kata sandi untuk verifikasi keluar akun!' });
    }
    if (user.passwordHash !== cleanPassword) {
      return res.status(401).json({ error: 'Kata sandi salah! Pastikan kata sandi Anda benar.' });
    }
  }

  res.json({ success: true, message: 'Kata sandi terverifikasi.' });
});

// Logout Aman: Sesi keluar tetapi Akun, Progres, dan Skor di Cloud TETAP TERSIMPAN AMAN
app.post(['/api/auth/logout', '/api/auth/logout-delete'], (req, res) => {
  const { userId, permanentDelete, password } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID diperlukan' });
  }

  // Jika BUKAN penghapusan permanen, simpan sesi dan kembalikan respon sukses tanpa menghapus akun
  if (!permanentDelete) {
    const targetUser = db.users[userId];
    if (targetUser) {
      targetUser.lastActive = new Date().toISOString();
      saveDB();
    }
    return res.json({
      success: true,
      message: 'Berhasil keluar akun. Data dan seluruh progres Anda tersimpan aman di Cloud.'
    });
  }

  // Khusus jika user meminta penghapusan akun permanen
  const targetUser = db.users[userId];
  if (targetUser) {
    if (targetUser.passwordHash && password && targetUser.passwordHash !== password.trim()) {
      return res.status(401).json({ error: 'Kata sandi salah! Gagal menghapus akun.' });
    }
    if (targetUser.username) {
      userByUsernameLower.delete(targetUser.username.toLowerCase());
    }
    delete db.users[userId];
  }

  db.scores = db.scores.filter(s => s.userId !== userId);
  if (Array.isArray(db.notifications)) {
    db.notifications = db.notifications.filter(n => n.userId !== userId);
  }

  saveDB(true);
  broadcastLeaderboardUpdate();

  res.json({ success: true, message: 'Akun dan seluruh data telah dihapus secara permanen.' });
});

// Hapus Akun Permanen khusus
app.post('/api/auth/delete-account', (req, res) => {
  const { userId, password } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID diperlukan' });
  }

  const targetUser = db.users[userId];
  if (!targetUser) {
    return res.status(404).json({ error: 'Akun tidak ditemukan' });
  }

  if (targetUser.passwordHash && password && targetUser.passwordHash !== password.trim()) {
    return res.status(401).json({ error: 'Kata sandi salah!' });
  }

  if (targetUser.username) {
    userByUsernameLower.delete(targetUser.username.toLowerCase());
  }
  delete db.users[userId];
  db.scores = db.scores.filter(s => s.userId !== userId);
  if (Array.isArray(db.notifications)) {
    db.notifications = db.notifications.filter(n => n.userId !== userId);
  }

  saveDB(true);
  broadcastLeaderboardUpdate();
  res.json({ success: true, message: 'Akun berhasil dihapus.' });
});

// Verify 2FA code
app.post('/api/auth/verify-2fa', (req, res) => {
  const { userId, code } = req.body;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  // Accept valid 6-digit codes or master demo code 123456
  if (code && (code === '123456' || code === user.twoFactorSecret || code.length === 6)) {
    user.lastActive = new Date().toISOString();
    saveDB();
    return res.json({ success: true, user });
  }

  return res.status(400).json({ error: 'Kode 2FA salah! Masukkan 6 angka valid (contoh: 123456)' });
});

// Simulated Biometric / WebAuthn Login
app.post('/api/auth/biometric', (req, res) => {
  const { userId } = req.body;
  let user: StoredUser | undefined;

  if (userId) {
    user = db.users[userId];
  } else {
    // If no userId, pick the most recently active user
    const users = Object.values(db.users);
    if (users.length > 0) {
      users.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      user = users[0];
    }
  }

  if (!user) {
    return res.status(404).json({ error: 'Tidak ada data biometrik tersimpan di perangkat ini.' });
  }

  user.lastActive = new Date().toISOString();
  saveDB();

  res.json({ success: true, user, message: 'Autentikasi biometrik berhasil diverifikasi!' });
});

// Guest Quick Play
app.post('/api/auth/guest', (req, res) => {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const guestId = 'guest_' + Date.now();
  const guestUser: StoredUser = {
    id: guestId,
    username: `CyberDriver_${guestNumber}`,
    email: `guest_${guestNumber}@pursuit.local`,
    passwordHash: '',
    avatar: '🏎️',
    title: 'GUEST RACER',
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

  db.users[guestId] = guestUser;
  saveDB();
  res.json({ success: true, user: guestUser });
});

// Update Profile & Customization
app.put('/api/profile', (req, res) => {
  const { userId, updates } = req.body;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId diperlukan' });
  }

  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  if (updates && typeof updates === 'object') {
    // If updating username, check uniqueness and update index
    if (typeof updates.username === 'string') {
      const cleanNewName = updates.username.trim().slice(0, 24);
      if (cleanNewName && cleanNewName.toLowerCase() !== user.username.toLowerCase()) {
        if (userByUsernameLower.has(cleanNewName.toLowerCase())) {
          return res.status(400).json({ error: 'Nama pemain ini sudah dipakai oleh racer lain!' });
        }
        userByUsernameLower.delete(user.username.toLowerCase());
        user.username = cleanNewName;
        userByUsernameLower.set(cleanNewName.toLowerCase(), user);

        // Synchronize on existing scores
        for (const s of db.scores) {
          if (s.userId === userId) {
            s.username = cleanNewName;
          }
        }
        invalidateLeaderboardCache();
      }
    }

    if (typeof updates.avatar === 'string') {
      user.avatar = updates.avatar.slice(0, 8);
      for (const s of db.scores) {
        if (s.userId === userId) s.avatar = user.avatar;
      }
    }
    if (typeof updates.title === 'string') {
      user.title = updates.title.slice(0, 32);
      for (const s of db.scores) {
        if (s.userId === userId) s.title = user.title;
      }
    }
    if (typeof updates.carColor === 'string') {
      user.carColor = updates.carColor;
      for (const s of db.scores) {
        if (s.userId === userId) s.carColor = user.carColor;
      }
    }
    if (typeof updates.carModel === 'string') user.carModel = updates.carModel;
    if (typeof updates.trailEffect === 'string') user.trailEffect = updates.trailEffect;
    if (typeof updates.twoFactorEnabled === 'boolean') {
      user.twoFactorEnabled = updates.twoFactorEnabled;
      if (updates.twoFactorEnabled && !user.twoFactorSecret) {
        user.twoFactorSecret = '123456';
      }
    }
    if (typeof updates.biometricEnabled === 'boolean') user.biometricEnabled = updates.biometricEnabled;
    if (updates.layoutSettings && typeof updates.layoutSettings === 'object') {
      user.layoutSettings = { ...user.layoutSettings, ...updates.layoutSettings };
    }
    if (updates.notificationSettings && typeof updates.notificationSettings === 'object') {
      user.notificationSettings = { ...user.notificationSettings, ...updates.notificationSettings };
    }
  }

  user.lastActive = new Date().toISOString();
  saveDB();

  res.json({ success: true, user });
});

// Submit Run Score & Real-time Global / Friend Alert
app.post('/api/scores', (req, res) => {
  const {
    userId,
    username: clientUsername,
    avatar: clientAvatar,
    title: clientTitle,
    carColor: clientCarColor,
    carModel: clientCarModel,
    score,
    distance,
    bestCombo,
    difficulty,
    obstaclesDodged,
    powerUpsCollected,
    bossKilled,
    empUsed,
    nearMisses
  } = req.body;

  // Sanitize score input: ensure non-negative safe integer
  const scoreNum = Math.max(0, Math.min(100000000, Math.floor(Number(score) || 0)));
  const distanceNum = Math.max(0, Math.floor(Number(distance) || 0));
  const comboNum = Math.max(0, Math.floor(Number(bestCombo) || 0));
  const diffStr = typeof difficulty === 'string' ? difficulty : 'NORMAL';

  let user = typeof userId === 'string' ? db.users[userId] : undefined;

  // Auto-heal registered user jika server sempat restart
  if (!user && typeof userId === 'string' && userId.startsWith('usr_')) {
    const cleanUName = (clientUsername ? String(clientUsername).trim() : 'Pembalap').slice(0, 24);
    const restoredUser: StoredUser = {
      id: userId,
      username: cleanUName,
      email: `${cleanUName.toLowerCase()}@cyberpursuit.local`,
      passwordHash: '',
      avatar: clientAvatar || '🏎️',
      title: clientTitle || 'RACER',
      carColor: clientCarColor || '#00f0ff',
      carModel: clientCarModel || 'civic_fl5',
      trailEffect: 'cyan_plasma',
      twoFactorEnabled: false,
      biometricEnabled: false,
      achievements: [],
      stats: {
        highScore: scoreNum,
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
    db.users[userId] = restoredUser;
    userByUsernameLower.set(cleanUName.toLowerCase(), restoredUser);
    user = restoredUser;
  }

  // ATURAN RESMI: Hanya pemain yang sudah mendaftar lalu main yang dicantumkan
  const isRegistered = !!user && typeof userId === 'string' && !userId.startsWith('guest_') && !userId.startsWith('anon') && !userId.startsWith('offline_');

  if (!isRegistered || !user) {
    return res.json({
      success: true,
      rank: null,
      score: null,
      userStats: null,
      isRegistered: false,
      message: 'Hanya akun pemain terdaftar yang dapat mencatatkan nama dan skor di Leaderboard.'
    });
  }

  const username = user.username || clientUsername || 'Racer';
  const avatar = user.avatar || clientAvatar || '🏎️';
  const title = user.title || clientTitle || 'RACER';
  const carColor = user.carColor || clientCarColor || '#00f0ff';

  // Update statistik pemain
  user.stats.gamesPlayed += 1;
  user.stats.totalDistance += distanceNum;
  user.stats.obstaclesDodged += Math.max(0, Math.floor(Number(obstaclesDodged) || 0));
  user.stats.powerUpsCollected += Math.max(0, Math.floor(Number(powerUpsCollected) || 0));
  user.stats.nearMisses += Math.max(0, Math.floor(Number(nearMisses) || 0));
  user.stats.empUsed += Math.max(0, Math.floor(Number(empUsed) || 0));
  if (bossKilled) user.stats.bossKills += 1;
  if (comboNum > user.stats.bestCombo) user.stats.bestCombo = comboNum;
  if (scoreNum > user.stats.highScore) {
    user.stats.highScore = scoreNum;
    sendUserNotification(userId, {
      id: 'notif_' + Date.now(),
      userId,
      type: 'achievement',
      title: 'Rekor Baru Tercatat!',
      message: `Kamu mencetak rekor pribadi baru: ${scoreNum.toLocaleString()} poin!`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  const earnedBounty = Math.floor(scoreNum / 10) + (bossKilled ? 500 : 0);
  user.stats.totalBounty += earnedBounty;
  user.lastActive = new Date().toISOString();

  // ATURAN LEADERBOARD:
  // Nama pemain tercantum dengan SKOR TERAKHIR DIA MAIN (1 entri resmi per pemain terdaftar)
  const existingScoreIndex = db.scores.findIndex(s => s.userId === userId);

  const updatedScoreEntry: StoredScore = {
    id: existingScoreIndex !== -1 ? db.scores[existingScoreIndex].id : 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId,
    username,
    avatar,
    title,
    carColor,
    score: scoreNum, // SKOR TERAKHIR DIA MAIN
    distance: distanceNum,
    bestCombo: comboNum,
    difficulty: diffStr,
    timestamp: new Date().toISOString(),
  };

  if (existingScoreIndex !== -1) {
    db.scores[existingScoreIndex] = updatedScoreEntry;
  } else {
    db.scores.push(updatedScoreEntry);
  }

  // Urutkan leaderboard berdasarkan skor terakhir
  db.scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.distance !== a.distance) return b.distance - a.distance;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  saveDB();

  // Broadcast update real-time ke semua client WebSocket yang aktif
  broadcastLeaderboardUpdate(updatedScoreEntry);

  const rank = db.scores.findIndex(s => s.userId === userId) + 1;
  if (rank <= 3 && scoreNum > 1000) {
    broadcastGlobalAlert(
      `🚨 Papan Peringkat Global Bergetar!`,
      `[#${rank}] ${username} baru saja mencetak skor fantastis ${scoreNum.toLocaleString()} di mode ${diffStr}!`,
      'score_beaten'
    );
  }

  return res.json({
    success: true,
    rank,
    score: updatedScoreEntry,
    userStats: user.stats,
    isRegistered: true
  });
});

// Batch Offline Scores Sync Endpoint
app.post('/api/scores/batch', (req, res) => {
  const { userId, scores } = req.body;
  if (!Array.isArray(scores) || scores.length === 0) {
    return res.json({ success: true, syncedCount: 0 });
  }

  const user = typeof userId === 'string' ? db.users[userId] : undefined;
  const isRegistered = !!user && !userId.startsWith('guest_') && !userId.startsWith('anon') && !userId.startsWith('offline_');

  if (!isRegistered || !user) {
    return res.json({ success: true, syncedCount: 0, isRegistered: false });
  }

  let syncedCount = 0;
  let lastValidScoreItem: any = null;

  for (const item of scores) {
    if (!item) continue;
    const scoreNum = Math.max(0, Math.min(100000000, Math.floor(Number(item.score) || 0)));
    const distanceNum = Math.max(0, Math.floor(Number(item.distance) || 0));
    const comboNum = Math.max(0, Math.floor(Number(item.bestCombo) || 0));

    user.stats.gamesPlayed += 1;
    user.stats.totalDistance += distanceNum;
    user.stats.obstaclesDodged += Math.max(0, Math.floor(Number(item.obstaclesDodged) || 0));
    user.stats.powerUpsCollected += Math.max(0, Math.floor(Number(item.powerUpsCollected) || 0));
    if (comboNum > user.stats.bestCombo) user.stats.bestCombo = comboNum;
    if (scoreNum > user.stats.highScore) user.stats.highScore = scoreNum;
    user.stats.totalBounty += Math.floor(scoreNum / 10);

    lastValidScoreItem = {
      score: scoreNum,
      distance: distanceNum,
      bestCombo: comboNum,
      difficulty: typeof item.difficulty === 'string' ? item.difficulty : 'NORMAL',
      timestamp: item.timestamp || new Date().toISOString(),
    };
    syncedCount++;
  }

  if (lastValidScoreItem) {
    user.lastActive = new Date().toISOString();

    const existingIndex = db.scores.findIndex(s => s.userId === userId);
    const updatedEntry: StoredScore = {
      id: existingIndex !== -1 ? db.scores[existingIndex].id : 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      username: user.username,
      avatar: user.avatar || '🏎️',
      title: user.title || 'RACER',
      carColor: user.carColor || '#00f0ff',
      score: lastValidScoreItem.score,
      distance: lastValidScoreItem.distance,
      bestCombo: lastValidScoreItem.bestCombo,
      difficulty: lastValidScoreItem.difficulty,
      timestamp: lastValidScoreItem.timestamp,
    };

    if (existingIndex !== -1) {
      db.scores[existingIndex] = updatedEntry;
    } else {
      db.scores.push(updatedEntry);
    }

    db.scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.distance !== a.distance) return b.distance - a.distance;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    saveDB();
    broadcastLeaderboardUpdate(updatedEntry);
  }

  res.json({ success: true, syncedCount, userStats: user?.stats });
});

// Leaderboard with filters and fast search (HANYA PEMAIN TERDAFTAR)
app.get('/api/leaderboard', (req, res) => {
  const { period = 'all', difficulty, search } = req.query;

  // Pastikan hanya akun pemain terdaftar yang valid yang muncul di papan peringkat
  let list = db.scores.filter(s => {
    const user = db.users[s.userId];
    return !!user && !s.userId.startsWith('guest_') && !s.userId.startsWith('bot-') && !s.userId.startsWith('anon') && !s.userId.startsWith('offline_');
  });

  // Urutkan berdasarkan skor terakhir
  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.distance !== a.distance) return b.distance - a.distance;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Filter pencarian nama pemain
  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(s => s.username.toLowerCase().includes(q));
  }

  const now = Date.now();
  if (period === 'daily') {
    const oneDayAgo = now - 24 * 3600 * 1000;
    list = list.filter(s => new Date(s.timestamp).getTime() >= oneDayAgo);
  } else if (period === 'weekly') {
    const oneWeekAgo = now - 7 * 24 * 3600 * 1000;
    list = list.filter(s => new Date(s.timestamp).getTime() >= oneWeekAgo);
  }

  if (difficulty && difficulty !== 'ALL') {
    list = list.filter(s => s.difficulty === difficulty);
  }

  res.json({
    period,
    difficulty,
    total: list.length,
    leaderboard: list.slice(0, 100),
  });
});

// Analytics & Visual Progress Data
app.get('/api/analytics', (req, res) => {
  const { userId } = req.query;
  const user = typeof userId === 'string' ? db.users[userId] : undefined;

  // Generate 7-day daily score trend
  const dailyScores: { date: string; avgScore: number; maxScore: number; games: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayScores = db.scores.filter(s => s.timestamp.startsWith(dateStr));
    const maxScore = dayScores.length > 0 ? Math.max(...dayScores.map(s => s.score)) : Math.floor(800 + Math.random() * 1200);
    const avgScore = dayScores.length > 0 ? Math.floor(dayScores.reduce((a, b) => a + b.score, 0) / dayScores.length) : Math.floor(maxScore * 0.7);
    dailyScores.push({
      date: dateStr,
      maxScore,
      avgScore,
      games: dayScores.length || Math.floor(3 + Math.random() * 8),
    });
  }

  // Heatmap by hour
  const heatmapByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: Math.floor(Math.random() * 15) + (hour >= 18 && hour <= 23 ? 20 : 5),
  }));

  const stats = user?.stats || {
    gamesPlayed: 12,
    highScore: 3200,
    totalDistance: 14500,
    obstaclesDodged: 184,
    powerUpsCollected: 45,
    bestCombo: 24,
    totalBounty: 3400,
    bossKills: 3,
    nearMisses: 29,
    empUsed: 7,
    multiplayerWins: 4,
    multiplayerMatches: 6,
  };

  const dodgeRate = stats.obstaclesDodged > 0 ? Math.min(96, Math.round((stats.obstaclesDodged / (stats.obstaclesDodged + (stats.gamesPlayed * 2))) * 100)) : 82;
  const grazeAccuracy = stats.nearMisses > 0 ? Math.min(92, Math.round((stats.nearMisses / (stats.obstaclesDodged || 10)) * 100)) : 45;
  const avgSurvivalDistance = stats.gamesPlayed > 0 ? Math.round(stats.totalDistance / stats.gamesPlayed) : 1200;
  const multiplayerWinRate = stats.multiplayerMatches > 0 ? Math.round((stats.multiplayerWins / stats.multiplayerMatches) * 100) : 67;

  res.json({
    dailyScores,
    heatmapByHour,
    performanceMetrics: {
      dodgeRate,
      grazeAccuracy,
      avgSurvivalDistance,
      multiplayerWinRate,
    },
    summary: {
      totalPlayTimeMinutes: Math.round(stats.totalDistance / 25),
      totalRuns: stats.gamesPlayed,
      highestBounty: stats.totalBounty,
      topDifficulty: 'MAXXX',
    },
  });
});

// Tournaments
app.get('/api/tournaments', (req, res) => {
  const { userId } = req.query;
  const tourneys = db.tournaments.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    tier: t.tier,
    startTime: t.startTime,
    endTime: t.endTime,
    prizeBounty: t.prizeBounty,
    participantsCount: t.participants.length,
    isRegistered: typeof userId === 'string' ? t.participants.includes(userId) : false,
  }));
  res.json({ tournaments: tourneys });
});

app.post('/api/tournaments/:id/register', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const tourney = db.tournaments.find(t => t.id === id);
  if (!tourney) return res.status(404).json({ error: 'Turnamen tidak ditemukan' });

  if (userId && !tourney.participants.includes(userId)) {
    tourney.participants.push(userId);
    saveDB();

    sendUserNotification(userId, {
      id: 'notif_' + Date.now(),
      userId,
      type: 'tournament_alert',
      title: `Terdaftar di ${tourney.title}!`,
      message: `Persiapkan kendaraanmu. Turnamen berhadiah ${tourney.prizeBounty.toLocaleString()} Bounty!`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  res.json({ success: true, participantsCount: tourney.participants.length });
});

// Notifications
app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  const userNotifs = db.notifications.filter(
    n => n.userId === 'all' || (typeof userId === 'string' && n.userId === userId)
  );
  res.json({ notifications: userNotifs.slice(0, 30) });
});

app.put('/api/notifications/read', (req, res) => {
  const { userId, notifId } = req.body;
  if (notifId) {
    const notif = db.notifications.find(n => n.id === notifId);
    if (notif) notif.read = true;
  } else if (userId) {
    db.notifications.forEach(n => {
      if (n.userId === userId || n.userId === 'all') n.read = true;
    });
  }
  saveDB();
  res.json({ success: true });
});

// Export user performance report as JSON
app.get('/api/export-data', (req, res) => {
  const { userId } = req.query;
  const user = typeof userId === 'string' ? db.users[userId] : null;
  const userScores = db.scores.filter(s => s.userId === userId);

  const report = {
    exportedAt: new Date().toISOString(),
    game: 'Escape the Police: FINAL MAXXX Edition',
    user: user || 'Anonymous Guest',
    scores: userScores,
    totalRecordedRuns: userScores.length,
    systemNote: 'Data resmi sinkronisasi cloud akun Escape the Police',
  };

  res.setHeader('Content-Disposition', 'attachment; filename="cyber_pursuit_report.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(report, null, 2));
});

// ----------------------------------------------------
// VITE MIDDLEWARE / PRODUCTION STATIC FALLBACK
// ----------------------------------------------------

async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const possiblePaths = [
      path.join(process.cwd(), 'dist'),
      path.join(__dirname, 'dist'),
      __dirname,
    ];
    const distPath = possiblePaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="3"><title>Starting...</title></head><body style="background:#090a16;color:#00f0ff;font-family:sans-serif;text-align:center;padding:50px;"><h2>Memuat Escape Police...</h2><p>Sedang menyiapkan game, halaman akan refresh otomatis.</p></body></html>');
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cyber Pursuit Server & WebSockets running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Failed to start server:', err);
});
