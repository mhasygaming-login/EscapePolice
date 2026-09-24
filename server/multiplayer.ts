import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface StoredNotification {
  id: string;
  userId: string;
  type: 'score_beaten' | 'friend_activity' | 'tournament_alert' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface StoredScore {
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

export interface PlayerConnection {
  socket: Socket;
  id: string;
  username: string;
  avatar: string;
  carColor: string;
  carModel: string;
  x: number;
  y: number;
  speed: number;
  distance: number;
  lap: number;
  steer: number; // -1: kiri, 0: lurus, 1: kanan
  gas: boolean;
  brake: boolean;
  nitro: boolean;
  score: number;
  hp: number;
  combo: number;
  ping: number;
  status: 'ready' | 'waiting' | 'countdown' | 'playing' | 'crashed' | 'finished';
  isHost: boolean;
}

export interface Room {
  code: string;
  name: string;
  status: 'waiting' | 'starting' | 'countdown' | 'in_game' | 'finished';
  difficulty: string;
  targetDistance: number; // Target finish distance in meters
  players: Map<string, PlayerConnection>;
  winnerId?: string;
  countdownSeconds?: number;
  countdownTimer?: NodeJS.Timeout;
  createdAt: number;
}

export function setupMultiplayerServer(
  server: http.Server,
  db: { users: Record<string, any>; scores: StoredScore[]; notifications: StoredNotification[] },
  saveDB: () => void
) {
  const io = new SocketIOServer(server, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
  });

  const userSockets = new Map<string, Socket>();
  const activeRooms = new Map<string, Room>();

  // Seed default public racing rooms
  activeRooms.set('NEON-77', {
    code: 'NEON-77',
    name: 'Cyber Duel Arena',
    status: 'waiting',
    difficulty: 'MAXXX',
    targetDistance: 1500,
    players: new Map(),
    createdAt: Date.now(),
  });

  activeRooms.set('RACE-01', {
    code: 'RACE-01',
    name: 'Highway Sprint 1v1',
    status: 'waiting',
    difficulty: 'HARD',
    targetDistance: 1200,
    players: new Map(),
    createdAt: Date.now(),
  });

  function serializeRoom(room: Room) {
    const playersObj: Record<string, any> = {};
    for (const [id, p] of room.players) {
      playersObj[id] = {
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        carColor: p.carColor,
        carModel: p.carModel,
        x: p.x,
        y: p.y,
        speed: p.speed,
        distance: p.distance,
        lap: p.lap,
        steer: p.steer,
        gas: p.gas,
        brake: p.brake,
        nitro: p.nitro,
        score: p.score,
        hp: p.hp,
        combo: p.combo,
        ping: p.ping,
        status: p.status,
        isHost: p.isHost,
      };
    }

    return {
      code: room.code,
      name: room.name,
      status: room.status,
      difficulty: room.difficulty,
      targetDistance: room.targetDistance,
      countdownSeconds: room.countdownSeconds,
      winnerId: room.winnerId,
      players: playersObj,
      playerCount: room.players.size,
    };
  }

  function broadcastRoomState(room: Room) {
    io.to(room.code).emit('room_state', { room: serializeRoom(room) });
  }

  // Authoritative Race Countdown Controller (3... 2... 1... GO!)
  function startRaceCountdown(room: Room) {
    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
    }

    room.status = 'countdown';
    room.countdownSeconds = 3;
    room.winnerId = undefined;

    for (const p of room.players.values()) {
      p.status = 'countdown';
      p.distance = 0;
      p.score = 0;
      p.hp = 3;
      p.combo = 0;
    }

    broadcastRoomState(room);
    io.to(room.code).emit('countdown_tick', {
      count: 3,
      message: 'BERSIAP...',
      room: serializeRoom(room),
    });

    room.countdownTimer = setInterval(() => {
      if (!room.countdownSeconds) room.countdownSeconds = 0;
      room.countdownSeconds -= 1;

      if (room.countdownSeconds > 0) {
        const msg = room.countdownSeconds === 2 ? 'SIAP-SIAP...' : 'INJAK GAS!';
        io.to(room.code).emit('countdown_tick', {
          count: room.countdownSeconds,
          message: msg,
          room: serializeRoom(room),
        });
        broadcastRoomState(room);
      } else {
        // COUNTDOWN FINISHED -> BALAPAN DIMULAI!
        if (room.countdownTimer) {
          clearInterval(room.countdownTimer);
          room.countdownTimer = undefined;
        }
        room.status = 'in_game';
        room.countdownSeconds = 0;

        for (const p of room.players.values()) {
          p.status = 'playing';
        }

        io.to(room.code).emit('countdown_tick', {
          count: 0,
          message: 'GO! BALAPAN DIMULAI!',
          room: serializeRoom(room),
        });

        io.to(room.code).emit('race_start', {
          targetDistance: room.targetDistance,
          room: serializeRoom(room),
        });

        broadcastRoomState(room);
      }
    }, 1000);
  }

  // Check race finish condition (first to reach targetDistance or last survivor)
  function evaluateRaceOutcome(room: Room) {
    if (room.status !== 'in_game' || room.players.size === 0) return;

    // 1. Check distance victory
    for (const [id, p] of room.players) {
      if (p.status === 'playing' && p.distance >= room.targetDistance) {
        finishRace(room, id, `Menyentuh Garis Finish (${room.targetDistance}m)!`);
        return;
      }
    }

    // 2. Check survivor status
    if (room.players.size > 1) {
      const activePlayers = Array.from(room.players.values()).filter((pl) => pl.status === 'playing');
      if (activePlayers.length === 1) {
        finishRace(room, activePlayers[0].id, 'Satu-satunya yang Bertahan Melawan Armada Polisi!');
        return;
      } else if (activePlayers.length === 0) {
        // All crashed: Highest distance wins
        let topPlayer = Array.from(room.players.values())[0];
        for (const pl of room.players.values()) {
          if (pl.distance > topPlayer.distance) topPlayer = pl;
        }
        finishRace(room, topPlayer?.id, 'Jarak Terjauh Sebelum Tabrakan!');
        return;
      }
    }
  }

  function finishRace(room: Room, winnerId?: string, reason?: string) {
    if (room.status === 'finished') return;
    if (room.countdownTimer) clearInterval(room.countdownTimer);

    room.status = 'finished';
    room.winnerId = winnerId;

    for (const p of room.players.values()) {
      p.status = 'finished';
    }

    // Award stats & bounty to winner in database
    if (winnerId && db.users[winnerId]) {
      const winnerUser = db.users[winnerId];
      winnerUser.stats.multiplayerWins = (winnerUser.stats.multiplayerWins || 0) + 1;
      winnerUser.stats.totalBounty = (winnerUser.stats.totalBounty || 0) + 1000;
      saveDB();
    }

    // Update multiplayer match count for all participants
    for (const p of room.players.values()) {
      if (p.id && db.users[p.id]) {
        db.users[p.id].stats.multiplayerMatches = (db.users[p.id].stats.multiplayerMatches || 0) + 1;
      }
    }
    saveDB();

    io.to(room.code).emit('race_finish', {
      winnerId,
      reason: reason || 'Balapan Selesai!',
      room: serializeRoom(room),
    });

    broadcastRoomState(room);
  }

  io.on('connection', (socket: Socket) => {
    let currentUserId: string | null = null;
    let currentRoomCode: string | null = null;

    // Latency measurement
    socket.on('ping_check', (timestamp: number) => {
      socket.emit('pong_check', timestamp);
    });

    function handleClientAction(type: string, data: any) {
      switch (type) {
        case 'auth_register': {
          if (data.userId) {
            currentUserId = data.userId;
            userSockets.set(currentUserId, socket);
            socket.join(`user_${currentUserId}`);
          }
          break;
        }

        case 'list_rooms': {
          const roomList = Array.from(activeRooms.values()).map((r) => ({
            code: r.code,
            name: r.name,
            status: r.status,
            difficulty: r.difficulty,
            targetDistance: r.targetDistance,
            playerCount: r.players.size,
          }));
          socket.emit('room_list', { rooms: roomList });
          break;
        }

        case 'create_room': {
          leaveCurrentRoom();
          const roomCode = (data.code || 'ROOM-' + Math.floor(1000 + Math.random() * 9000)).trim().toUpperCase();
          const targetDist = data.difficulty === 'MAXXX' ? 2000 : data.difficulty === 'HARD' ? 1500 : 1200;

          const room: Room = {
            code: roomCode,
            name: data.name || `${data.username}'s Lobby`,
            status: 'waiting',
            difficulty: data.difficulty || 'NORMAL',
            targetDistance: targetDist,
            players: new Map(),
            createdAt: Date.now(),
          };

          const playerObj: PlayerConnection = {
            socket,
            id: data.userId || 'user_' + Date.now(),
            username: data.username || 'Pembalap 1',
            avatar: data.avatar || '🏎️',
            carColor: data.carColor || '#00f0ff',
            carModel: data.carModel || 'civic_fl5',
            x: 180,
            y: 500,
            speed: 0,
            distance: 0,
            lap: 1,
            steer: 0,
            gas: false,
            brake: false,
            nitro: false,
            score: 0,
            hp: 3,
            combo: 0,
            ping: 10,
            status: 'ready',
            isHost: true,
          };

          room.players.set(playerObj.id, playerObj);
          activeRooms.set(roomCode, room);
          currentRoomCode = roomCode;
          currentUserId = playerObj.id;

          socket.join(roomCode);
          broadcastRoomState(room);
          break;
        }

        case 'join_room': {
          const targetCode = (data.code || '').trim().toUpperCase();
          let room = activeRooms.get(targetCode);
          if (!room) {
            for (const [c, r] of activeRooms) {
              if (c.toUpperCase() === targetCode) {
                room = r;
                break;
              }
            }
          }

          if (!room) {
            socket.emit('error', { message: `Room "${targetCode}" tidak ditemukan! Periksa kembali kode.` });
            return;
          }

          if (room.players.has(data.userId)) {
            const existing = room.players.get(data.userId)!;
            existing.socket = socket;
            existing.username = data.username || existing.username;
            existing.avatar = data.avatar || existing.avatar;
            existing.carColor = data.carColor || existing.carColor;
            existing.carModel = data.carModel || existing.carModel;
            currentRoomCode = room.code;
            currentUserId = data.userId;
            socket.join(room.code);
            broadcastRoomState(room);
            return;
          }

          if (room.status === 'in_game') {
            socket.emit('error', { message: 'Balapan di room ini sedang berlangsung! Tunggu hingga selesai.' });
            return;
          }

          if (room.players.size >= 4) {
            socket.emit('error', { message: 'Room sudah penuh (maksimal 4 pemain)!' });
            return;
          }

          const laneOffset = room.players.size === 1 ? 240 : room.players.size === 2 ? 120 : 300;

          const playerObj: PlayerConnection = {
            socket,
            id: data.userId || 'guest_' + Date.now(),
            username: data.username || 'Pembalap 2',
            avatar: data.avatar || '🏎️',
            carColor: data.carColor || '#ff2d6b',
            carModel: data.carModel || 'civic_fl5',
            x: laneOffset,
            y: 500,
            speed: 0,
            distance: 0,
            lap: 1,
            steer: 0,
            gas: false,
            brake: false,
            nitro: false,
            score: 0,
            hp: 3,
            combo: 0,
            ping: 10,
            status: 'ready',
            isHost: room.players.size === 0,
          };

          room.players.set(playerObj.id, playerObj);
          currentRoomCode = room.code;
          currentUserId = playerObj.id;

          socket.join(room.code);
          broadcastRoomState(room);
          break;
        }

        case 'toggle_ready': {
          if (!currentRoomCode || !currentUserId) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          const p = room.players.get(currentUserId);
          if (p) {
            p.status = p.status === 'ready' ? 'waiting' : 'ready';
            broadcastRoomState(room);
          }
          break;
        }

        case 'start_game':
        case 'rematch_room': {
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          startRaceCountdown(room);
          break;
        }

        case 'return_to_lobby': {
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          if (room.countdownTimer) clearInterval(room.countdownTimer);
          room.status = 'waiting';
          room.winnerId = undefined;
          for (const p of room.players.values()) {
            p.status = 'ready';
            p.score = 0;
            p.hp = 3;
            p.combo = 0;
            p.distance = 0;
          }
          broadcastRoomState(room);
          break;
        }

        // Real-time Controls Input Sync (Gas, Rem, Belok Kiri/Kanan, Nitro)
        case 'player_input': {
          if (!currentRoomCode || !currentUserId) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room || room.status !== 'in_game') return;
          const p = room.players.get(currentUserId);
          if (!p || p.status === 'crashed') return;

          p.steer = data.steer ?? p.steer;
          p.gas = !!data.gas;
          p.brake = !!data.brake;
          p.nitro = !!data.nitro;

          // Physics calculation on inputs
          if (p.steer !== 0) {
            p.x = Math.max(50, Math.min(394, p.x + p.steer * 5));
          }

          const topSpeed = p.nitro ? 240 : 180;
          if (p.gas) {
            p.speed = Math.min(topSpeed, p.speed + 4);
          } else if (p.brake) {
            p.speed = Math.max(0, p.speed - 8);
          } else {
            p.speed = Math.max(60, p.speed - 1);
          }

          p.distance += (p.speed / 3600) * 1000 * 0.05;

          socket.to(room.code).emit('opponent_sync', {
            userId: currentUserId,
            username: p.username,
            avatar: p.avatar,
            carColor: p.carColor,
            carModel: p.carModel,
            x: p.x,
            y: p.y,
            speed: Math.round(p.speed),
            distance: Math.round(p.distance),
            lap: p.lap,
            steer: p.steer,
            gas: p.gas,
            brake: p.brake,
            nitro: p.nitro,
            score: p.score,
            hp: p.hp,
            combo: p.combo,
            status: p.status,
          });

          evaluateRaceOutcome(room);
          break;
        }

        // Full Telemetry Sync Packet
        case 'player_sync': {
          if (!currentRoomCode || !currentUserId) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          const p = room.players.get(currentUserId);
          if (!p) return;

          p.x = data.x ?? p.x;
          p.y = data.y ?? p.y;
          p.speed = data.speed ?? p.speed;
          p.distance = data.distance ?? p.distance;
          p.lap = data.lap ?? p.lap;
          p.steer = data.steer ?? p.steer;
          p.gas = data.gas ?? p.gas;
          p.brake = data.brake ?? p.brake;
          p.nitro = data.nitro ?? p.nitro;
          p.score = data.score ?? p.score;
          p.hp = data.hp ?? p.hp;
          p.combo = data.combo ?? p.combo;
          p.status = data.status ?? p.status;
          if (data.carColor) p.carColor = data.carColor;
          if (data.carModel) p.carModel = data.carModel;
          if (data.username) p.username = data.username;
          if (data.avatar) p.avatar = data.avatar;

          socket.to(room.code).emit('opponent_sync', {
            userId: currentUserId,
            username: p.username,
            avatar: p.avatar,
            carColor: p.carColor,
            carModel: p.carModel,
            x: p.x,
            y: p.y,
            speed: Math.round(p.speed),
            distance: Math.round(p.distance),
            lap: p.lap,
            steer: p.steer,
            gas: p.gas,
            brake: p.brake,
            nitro: p.nitro,
            score: p.score,
            hp: p.hp,
            combo: p.combo,
            status: p.status,
          });

          evaluateRaceOutcome(room);
          break;
        }

        case 'collision': {
          if (!currentRoomCode || !currentUserId) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;
          const p = room.players.get(currentUserId);
          if (!p) return;

          p.hp = Math.max(0, p.hp - (data.damage || 1));
          if (p.hp <= 0) {
            p.status = 'crashed';
          }

          socket.to(room.code).emit('opponent_action', {
            userId: currentUserId,
            username: p.username,
            action: p.hp <= 0 ? 'crashed' : 'collision',
            value: data.obstacleType || 'rintangan',
          });

          evaluateRaceOutcome(room);
          break;
        }

        case 'player_action': {
          if (!currentRoomCode) return;
          const room = activeRooms.get(currentRoomCode);
          if (!room) return;

          socket.to(room.code).emit('opponent_action', {
            userId: currentUserId,
            username: data.username,
            action: data.action,
            value: data.value,
          });
          break;
        }

        case 'leave_room': {
          leaveCurrentRoom();
          break;
        }
      }
    }

    function leaveCurrentRoom() {
      if (currentRoomCode && currentUserId) {
        const room = activeRooms.get(currentRoomCode);
        if (room) {
          room.players.delete(currentUserId);
          socket.leave(currentRoomCode);

          socket.to(currentRoomCode).emit('opponent_left', {
            userId: currentUserId,
          });

          if (room.players.size === 0) {
            if (room.code !== 'NEON-77' && room.code !== 'RACE-01') {
              if (room.countdownTimer) clearInterval(room.countdownTimer);
              activeRooms.delete(currentRoomCode);
            } else {
              room.status = 'waiting';
              room.winnerId = undefined;
            }
          } else {
            const remaining = Array.from(room.players.values());
            if (!remaining.some((pl) => pl.isHost)) {
              remaining[0].isHost = true;
            }
            broadcastRoomState(room);
            evaluateRaceOutcome(room);
          }
        }
        currentRoomCode = null;
      }
    }

    const directEvents = [
      'auth_register',
      'list_rooms',
      'create_room',
      'join_room',
      'toggle_ready',
      'start_game',
      'rematch_room',
      'return_to_lobby',
      'player_input',
      'player_sync',
      'collision',
      'player_action',
      'leave_room',
    ];

    for (const ev of directEvents) {
      socket.on(ev, (data: any) => {
        handleClientAction(ev, data || {});
      });
    }

    socket.on('message', (data: any) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed && parsed.type) {
          handleClientAction(parsed.type, parsed);
        }
      } catch {}
    });

    socket.on('disconnect', () => {
      leaveCurrentRoom();
      if (currentUserId) {
        userSockets.delete(currentUserId);
      }
    });
  });

  function broadcastLeaderboardUpdate(newEntry?: StoredScore) {
    io.emit('leaderboard_update', {
      score: newEntry,
      timestamp: new Date().toISOString(),
    });
  }

  function sendUserNotification(userId: string, notification: StoredNotification) {
    db.notifications.unshift(notification);
    saveDB();
    io.to(`user_${userId}`).emit('push_notification', { notification });
  }

  function broadcastGlobalAlert(
    title: string,
    message: string,
    type: 'system' | 'tournament_alert' | 'score_beaten' | 'achievement' = 'system'
  ) {
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
    io.emit('push_notification', { notification: notif });
  }

  return {
    io,
    broadcastLeaderboardUpdate,
    sendUserNotification,
    broadcastGlobalAlert,
  };
}
