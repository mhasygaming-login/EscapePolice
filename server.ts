import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

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

// Initial default database state
let db: DB = {
  users: {},
  scores: [
    {
      id: 'score-1',
      userId: 'bot-1',
      username: 'NeonRider_99',
      avatar: '🏎️',
      title: 'CYBER ACE',
      carColor: '#00f0ff',
      score: 4820,
      distance: 3840,
      bestCombo: 34,
      difficulty: 'MAXXX',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'score-2',
      userId: 'bot-2',
      username: 'ViperShadow',
      avatar: '⚡',
      title: 'OUTLAW KING',
      carColor: '#ff2d6b',
      score: 3950,
      distance: 3120,
      bestCombo: 28,
      difficulty: 'HARD',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'score-3',
      userId: 'bot-3',
      username: 'GhostPursuit',
      avatar: '👻',
      title: 'DRIFT MASTER',
      carColor: '#7c5cff',
      score: 3400,
      distance: 2750,
      bestCombo: 22,
      difficulty: 'NORMAL',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'score-4',
      userId: 'bot-4',
      username: 'BountyHunterX',
      avatar: '🤖',
      title: 'ROAD WARRIOR',
      carColor: '#ffb703',
      score: 2890,
      distance: 2190,
      bestCombo: 19,
      difficulty: 'NORMAL',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'score-5',
      userId: 'bot-5',
      username: 'CyberBlade',
      avatar: '🔥',
      title: 'SPEED DEMON',
      carColor: '#06ffa5',
      score: 2150,
      distance: 1800,
      bestCombo: 15,
      difficulty: 'EASY',
      timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
    }
  ],
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
      participants: ['bot-1', 'bot-2', 'bot-3']
    },
    {
      id: 'tourney-2',
      title: 'Neon Drift Sprint Championship',
      description: 'Pertarungan combo streak tertinggi di jalan tol neon malam.',
      tier: 'ELITE',
      startTime: new Date(Date.now() + 3600000 * 14).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 38).toISOString(),
      prizeBounty: 10000,
      participants: ['bot-4', 'bot-5']
    },
    {
      id: 'tourney-3',
      title: 'Rookie Highway Escape',
      description: 'Kejuaraan harian untuk pengemudi pemula mengasah refleks.',
      tier: 'ROOKIE',
      startTime: new Date(Date.now() + 3600000 * 1).toISOString(),
      endTime: new Date(Date.now() + 3600000 * 8).toISOString(),
      prizeBounty: 5000,
      participants: ['bot-5']
    }
  ]
};

// Load DB from file if available
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = { ...db, ...parsed };
  } catch (err) {
    console.error('Failed to parse db.json, using fallback defaults', err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json', err);
  }
}

// Global active WebSocket connections map for user push notifications
const connectedClients = new Map<string, WebSocket>();

// Multiplayer Rooms in memory
interface PlayerConnection {
  ws: WebSocket;
  id: string;
  username: string;
  avatar: string;
  carColor: string;
  carModel: string;
  x: number;
  y: number;
  score: number;
  hp: number;
  combo: number;
  status: 'ready' | 'playing' | 'crashed' | 'finished';
  isHost: boolean;
}

interface Room {
  code: string;
  name: string;
  status: 'waiting' | 'starting' | 'in_game' | 'finished';
  difficulty: string;
  players: Map<string, PlayerConnection>;
  winnerId?: string;
  createdAt: number;
}

const activeRooms = new Map<string, Room>();

// Seed a couple of public multiplayer lobby rooms for instant join
activeRooms.set('NEON-77', {
  code: 'NEON-77',
  name: 'Cyber Duel Arena',
  status: 'waiting',
  difficulty: 'MAXXX',
  players: new Map(),
  createdAt: Date.now(),
});

activeRooms.set('RACE-01', {
  code: 'RACE-01',
  name: 'Highway Sprint 1v1',
  status: 'waiting',
  difficulty: 'HARD',
  players: new Map(),
  createdAt: Date.now(),
});

// Setup WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  let currentUserId: string | null = null;
  let currentRoomCode: string | null = null;

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'auth_register': {
          currentUserId = data.userId;
          if (currentUserId) {
            connectedClients.set(currentUserId, ws);
          }
          break;
        }

        case 'list_rooms': {
          const roomList = Array.from(activeRooms.values()).map(r => ({
            code: r.code,
            name: r.name,
            status: r.status,
            difficulty: r.difficulty,
            playerCount: r.players.size,
          }));
          ws.send(JSON.stringify({ type: 'room_list', rooms: roomList }));
          break;
        }

        case 'create_room': {
          leaveCurrentRoom();
          const roomCode = (data.code || 'ROOM-' + Math.floor(1000 + Math.random() * 9000)).trim().toUpperCase();
          const room: Room = {
            code: roomCode,
            name: data.name || `${data.username}'s Lobby`,
            status: 'waiting',
            difficulty: data.difficulty || 'NORMAL',
            players: new Map(),
            createdAt: Date.now(),
          };

          const playerObj: PlayerConnection = {
            ws,
            id: data.userId,
            username: data.username,
            avatar: data.avatar || '🏎️',
            carColor: data.carColor || '#00f0ff',
            carModel: data.carModel || 'civic_fl5',
            x: 200,
            y: 500,
            score: 0,
            hp: 3,
            combo: 0,
            status: 'ready',
            isHost: true,
          };

          room.players.set(data.userId, playerObj);
          activeRooms.set(roomCode, room);
          currentRoomCode = roomCode;
          currentUserId = data.userId;

          broadcastRoomState(room);
          break;
        }

        case 'join_room': {
          const targetCode = (data.code || '').trim().toUpperCase();
          let room = activeRooms.get(targetCode);
          if (!room) {
            // Case-insensitive fallback
            for (const [c, r] of activeRooms) {
              if (c.toUpperCase() === targetCode) {
                room = r;
                break;
              }
            }
          }

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: `Room "${targetCode}" tidak ditemukan! Periksa kembali kode.` }));
            return;
          }

          // If reconnecting player
          if (room.players.has(data.userId)) {
            const existing = room.players.get(data.userId)!;
            existing.ws = ws;
            existing.username = data.username || existing.username;
            existing.avatar = data.avatar || existing.avatar;
            existing.carColor = data.carColor || existing.carColor;
            existing.carModel = data.carModel || existing.carModel;
            currentRoomCode = room.code;
            currentUserId = data.userId;
            broadcastRoomState(room);
            return;
          }

          if (room.status === 'in_game') {
            ws.send(JSON.stringify({ type: 'error', message: 'Balapan di room ini sedang berlangsung! Tunggu hingga selesai.' }));
            return;
          }

          if (room.players.size >= 4) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room sudah penuh (maksimal 4 pemain)!' }));
            return;
          }

          const playerObj: PlayerConnection = {
            ws,
            id: data.userId,
            username: data.username,
            avatar: data.avatar || '🏎️',
            carColor: data.carColor || '#ff2d6b',
            carModel: data.carModel || 'civic_fl5',
            x: 200,
            y: 500,
            score: 0,
            hp: 3,
            combo: 0,
            status: 'ready',
            isHost: room.players.size === 0,
          };

          room.players.set(data.userId, playerObj);
          currentRoomCode = room.code;
          currentUserId = data.userId;

          broadcastRoomState(room);
          break;
        }

        case 'toggle_ready': {
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room || !currentUserId) return;
          const p = room.players.get(currentUserId);
          if (p) {
            p.status = p.status === 'ready' ? ('waiting' as any) : 'ready';
            broadcastRoomState(room);
          }
          break;
        }

        case 'start_game': {
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          room.status = 'in_game';
          room.winnerId = undefined;
          for (const p of room.players.values()) {
            p.status = 'playing';
            p.score = 0;
            p.hp = 3;
            p.combo = 0;
          }
          broadcastRoomState(room);
          break;
        }

        case 'rematch_room': {
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          room.status = 'in_game';
          room.winnerId = undefined;
          for (const p of room.players.values()) {
            p.status = 'playing';
            p.score = 0;
            p.hp = 3;
            p.combo = 0;
          }
          broadcastRoomState(room);
          break;
        }

        case 'return_to_lobby': {
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          room.status = 'waiting';
          room.winnerId = undefined;
          for (const p of room.players.values()) {
            p.status = 'ready';
            p.score = 0;
            p.hp = 3;
            p.combo = 0;
          }
          broadcastRoomState(room);
          break;
        }

        case 'player_sync': {
          if (!currentRoomCode || !currentUserId) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          const p = room.players.get(currentUserId);
          if (p) {
            p.x = data.x ?? p.x;
            p.y = data.y ?? p.y;
            p.score = data.score ?? p.score;
            p.hp = data.hp ?? p.hp;
            p.combo = data.combo ?? p.combo;
            p.status = data.status ?? p.status;
            if (data.carColor) p.carColor = data.carColor;
            if (data.carModel) p.carModel = data.carModel;
            if (data.username) p.username = data.username;
            if (data.avatar) p.avatar = data.avatar;

            // Broadcast position and status to all other players in room
            const payload = JSON.stringify({
              type: 'opponent_sync',
              userId: currentUserId,
              username: p.username,
              avatar: p.avatar,
              carColor: p.carColor,
              carModel: p.carModel,
              x: p.x,
              y: p.y,
              score: p.score,
              hp: p.hp,
              combo: p.combo,
              status: p.status,
            });

            for (const [id, otherPlayer] of room.players) {
              if (id !== currentUserId && otherPlayer.ws.readyState === WebSocket.OPEN) {
                otherPlayer.ws.send(payload);
              }
            }

            // Check if only one player remains standing in multiplayer match
            if (room.status === 'in_game' && room.players.size > 1) {
              const activePlayers = Array.from(room.players.values()).filter(pl => pl.status === 'playing');
              if (activePlayers.length === 1) {
                room.status = 'finished';
                room.winnerId = activePlayers[0].id;
                broadcastRoomState(room);
              } else if (activePlayers.length === 0) {
                // If all crashed, highest score wins!
                let topPlayer = Array.from(room.players.values())[0];
                for (const pl of room.players.values()) {
                  if (pl.score > topPlayer.score) topPlayer = pl;
                }
                room.status = 'finished';
                room.winnerId = topPlayer?.id;
                broadcastRoomState(room);
              }
            }
          }
          break;
        }

        case 'player_action': {
          // e.g. attack/EMP, boost, crash, or chat reaction sent to opponents
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          const broadcastMsg = JSON.stringify({
            type: 'opponent_action',
            userId: currentUserId,
            username: data.username,
            action: data.action,
            value: data.value,
          });
          for (const [id, pl] of room.players) {
            if (id !== currentUserId && pl.ws.readyState === WebSocket.OPEN) {
              pl.ws.send(broadcastMsg);
            }
          }
          break;
        }

        case 'leave_room': {
          leaveCurrentRoom();
          break;
        }
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  });

  function leaveCurrentRoom() {
    if (currentRoomCode && currentUserId) {
      const room = activeRooms.get(currentRoomCode);
      if (room) {
        room.players.delete(currentUserId);

        // Notify remaining opponents that this player left
        const leaveMsg = JSON.stringify({
          type: 'opponent_left',
          userId: currentUserId,
        });
        for (const [id, pl] of room.players) {
          if (id !== currentUserId && pl.ws.readyState === WebSocket.OPEN) {
            pl.ws.send(leaveMsg);
          }
        }

        if (room.players.size === 0) {
          // Don't delete default public rooms
          if (!['NEON-77', 'RACE-01'].includes(room.code)) {
            activeRooms.delete(currentRoomCode);
          } else {
            room.status = 'waiting';
            room.winnerId = undefined;
          }
        } else {
          // Reassign host if host left
          const remaining = Array.from(room.players.values());
          if (!remaining.some(p => p.isHost)) {
            remaining[0].isHost = true;
          }

          // If in game and only 1 player remains, finish and crown them winner
          if (room.status === 'in_game') {
            const activePlayers = remaining.filter(pl => pl.status === 'playing');
            if (activePlayers.length <= 1) {
              room.status = 'finished';
              if (activePlayers.length === 1) {
                room.winnerId = activePlayers[0].id;
              }
            }
          }

          broadcastRoomState(room);
        }
      }
      currentRoomCode = null;
    }
  }

  ws.on('close', () => {
    leaveCurrentRoom();
    if (currentUserId) {
      connectedClients.delete(currentUserId);
    }
  });
});

function broadcastRoomState(room: Room) {
  const playersObj: Record<string, any> = {};
  for (const [id, p] of room.players) {
    playersObj[id] = {
      id: p.id,
      username: p.username,
      avatar: p.avatar,
      carColor: p.carColor,
      carModel: p.carModel,
      score: p.score,
      hp: p.hp,
      combo: p.combo,
      status: p.status,
      isHost: p.isHost,
    };
  }

  const payload = JSON.stringify({
    type: 'room_state',
    room: {
      code: room.code,
      name: room.name,
      status: room.status,
      difficulty: room.difficulty,
      winnerId: room.winnerId,
      players: playersObj,
    },
  });

  for (const p of room.players.values()) {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload);
    }
  }
}

// Broadcast notification to a specific user or globally
function sendUserNotification(userId: string, notification: StoredNotification) {
  db.notifications.unshift(notification);
  saveDB();
  const clientWs = connectedClients.get(userId);
  if (clientWs && clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify({ type: 'push_notification', notification }));
  }
}

function broadcastGlobalAlert(title: string, message: string, type: 'system' | 'tournament_alert' | 'score_beaten' | 'achievement' = 'system') {
  const notif: StoredNotification = {
    id: 'notif-' + Date.now(),
    userId: 'all',
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  };
  db.notifications.unshift(notif);
  saveDB();

  const payload = JSON.stringify({ type: 'push_notification', notification: notif });
  for (const ws of connectedClients.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/profile', (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId diperlukan' });
  }
  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  res.json({ success: true, user });
});

// Authentication: Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username dan email wajib diisi!' });
  }

  const existing = Object.values(db.users).find(
    u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'Username atau email sudah terdaftar!' });
  }

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newUser: StoredUser = {
    id: userId,
    username,
    email,
    passwordHash: password || 'cyberpass',
    avatar: '🏎️',
    title: 'ROOKIE RACER',
    carColor: '#f8fafc',
    carModel: 'civic_fl5',
    trailEffect: 'cyan_plasma',
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    biometricEnabled: true,
    achievements: ['first'],
    stats: {
      highScore: 0,
      gamesPlayed: 0,
      totalDistance: 0,
      obstaclesDodged: 0,
      powerUpsCollected: 0,
      bestCombo: 0,
      totalBounty: 100,
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
  saveDB();

  sendUserNotification(userId, {
    id: 'notif-' + Date.now(),
    userId,
    type: 'system',
    title: 'Selamat Datang di Escape the Police!',
    message: 'Akun Anda berhasil dibuat. Dapatkan bounty pertamamu di jalanan cyber!',
    timestamp: new Date().toISOString(),
    read: false,
  });

  res.json({ success: true, user: newUser });
});

// Authentication: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username atau email diperlukan!' });
  }

  const user = Object.values(db.users).find(
    u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: 'Pengguna tidak ditemukan. Silakan daftar akun baru.' });
  }

  // Check if 2FA is required
  if (user.twoFactorEnabled) {
    return res.json({
      require2FA: true,
      userId: user.id,
      message: 'Kode autentikasi 2FA diperlukan.',
    });
  }

  user.lastActive = new Date().toISOString();
  saveDB();

  res.json({ success: true, user });
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
  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  if (updates.username) user.username = updates.username;
  if (updates.avatar) user.avatar = updates.avatar;
  if (updates.title) user.title = updates.title;
  if (updates.carColor) user.carColor = updates.carColor;
  if (updates.carModel) user.carModel = updates.carModel;
  if (updates.trailEffect) user.trailEffect = updates.trailEffect;
  if (typeof updates.twoFactorEnabled === 'boolean') {
    user.twoFactorEnabled = updates.twoFactorEnabled;
    if (updates.twoFactorEnabled && !user.twoFactorSecret) {
      user.twoFactorSecret = '123456';
    }
  }
  if (typeof updates.biometricEnabled === 'boolean') user.biometricEnabled = updates.biometricEnabled;
  if (updates.layoutSettings) user.layoutSettings = { ...user.layoutSettings, ...updates.layoutSettings };
  if (updates.notificationSettings) user.notificationSettings = { ...user.notificationSettings, ...updates.notificationSettings };

  user.lastActive = new Date().toISOString();
  saveDB();

  res.json({ success: true, user });
});

// Submit Run Score & Real-time Global / Friend Alert
app.post('/api/scores', (req, res) => {
  const { userId, score, distance, bestCombo, difficulty, obstaclesDodged, powerUpsCollected, bossKilled, empUsed, nearMisses } = req.body;

  const scoreNum = Math.floor(score || 0);
  const user = db.users[userId];
  const username = user?.username || 'Guest Driver';
  const avatar = user?.avatar || '🏎️';
  const title = user?.title || 'RACER';
  const carColor = user?.carColor || '#00f0ff';

  const newScore: StoredScore = {
    id: 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId: userId || 'anon',
    username,
    avatar,
    title,
    carColor,
    score: scoreNum,
    distance: Math.floor(distance || 0),
    bestCombo: bestCombo || 0,
    difficulty: difficulty || 'NORMAL',
    timestamp: new Date().toISOString(),
  };

  db.scores.push(newScore);

  // Update user stats if user exists
  if (user) {
    user.stats.gamesPlayed += 1;
    user.stats.totalDistance += Math.floor(distance || 0);
    user.stats.obstaclesDodged += obstaclesDodged || 0;
    user.stats.powerUpsCollected += powerUpsCollected || 0;
    user.stats.nearMisses += nearMisses || 0;
    user.stats.empUsed += empUsed || 0;
    if (bossKilled) user.stats.bossKills += 1;
    if (bestCombo > user.stats.bestCombo) user.stats.bestCombo = bestCombo;
    if (scoreNum > user.stats.highScore) {
      user.stats.highScore = scoreNum;
      // Send High Score achievement notification
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
  }

  // Sort scores and keep top 200
  db.scores.sort((a, b) => b.score - a.score);
  if (db.scores.length > 200) {
    db.scores = db.scores.slice(0, 200);
  }

  saveDB();

  // If this score entered top 3, broadcast real-time alert to all players!
  const rank = db.scores.findIndex(s => s.id === newScore.id) + 1;
  if (rank <= 3 && scoreNum > 1000) {
    broadcastGlobalAlert(
      `🚨 Papan Peringkat Global Bergetar!`,
      `[#${rank}] ${username} baru saja mencetak skor fantastis ${scoreNum.toLocaleString()} di mode ${difficulty}!`,
      'score_beaten'
    );
  }

  res.json({ success: true, rank, score: newScore, userStats: user?.stats });
});

// Leaderboard with filters
app.get('/api/leaderboard', (req, res) => {
  const { period = 'all', difficulty, search } = req.query;

  let list = [...db.scores];

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

  if (search && typeof search === 'string') {
    const query = search.toLowerCase();
    list = list.filter(s => s.username.toLowerCase().includes(query) || s.title.toLowerCase().includes(query));
  }

  list.sort((a, b) => b.score - a.score);

  res.json({
    period,
    difficulty,
    total: list.length,
    leaderboard: list.slice(0, 50),
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
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cyber Pursuit Server & WebSockets running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Failed to start server:', err);
});
