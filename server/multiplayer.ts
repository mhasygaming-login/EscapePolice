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
  laneIndex?: number;
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
  raceStartTime?: number;
  recordingFrames?: any[];
  recordingTimer?: NodeJS.Timeout;
  lastSavedReplayId?: string;
}

export function setupMultiplayerServer(
  server: http.Server,
  db: { users: Record<string, any>; scores: StoredScore[]; notifications: StoredNotification[]; replays?: any[] },
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
        laneIndex: p.laneIndex ?? 0,
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

  // Authoritative Race Countdown Controller (Server-Authoritative, Synchronization Buffer & Fresh Initial State)
  function startRaceCountdown(room: Room) {
    if (room.countdownTimer) {
      clearTimeout(room.countdownTimer as any);
      clearInterval(room.countdownTimer as any);
      room.countdownTimer = undefined;
    }

    if (room.status === 'countdown' || room.status === 'in_game') {
      return;
    }

    room.status = 'countdown';
    room.winnerId = undefined;

    // Distribusi jalur start grid unik (0: Kiri, 2: Kanan, 1: Tengah)
    const laneDistribution = [0, 2, 1];
    let laneIdx = 0;
    const initialPlayersPrep: Record<string, any> = {};

    for (const p of room.players.values()) {
      const assignedLane = laneDistribution[laneIdx % laneDistribution.length];
      p.laneIndex = assignedLane;
      p.status = 'countdown';
      p.x = 0;
      p.y = 0;
      p.speed = 0;
      p.distance = 0;
      p.steer = 0;
      p.gas = false;
      p.brake = false;
      p.nitro = false;
      p.score = 0;
      p.hp = 3;
      p.combo = 0;

      initialPlayersPrep[p.id] = {
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        carColor: p.carColor,
        carModel: p.carModel,
        laneIndex: assignedLane,
        x: 0,
        y: 0,
        speed: 0,
        distance: 0,
        lap: 1,
        steer: 0,
        gas: false,
        brake: false,
        nitro: false,
        hp: 3,
        score: 0,
        combo: 0,
        status: 'countdown',
      };
      laneIdx++;
    }

    // Inisialisasi status countdown tanpa buffer jeda ekstra
    room.countdownSeconds = 3;
    broadcastRoomState(room);

    let currentCount = 3;

    const executeCountdownStep = () => {
      const message =
        currentCount === 3
          ? '3 - BERSIAP...'
          : currentCount === 2
          ? '2 - SIAP-SIAP...'
          : '1 - INJAK GAS!';

      room.countdownSeconds = currentCount;
      io.to(room.code).emit('countdown_tick', {
        count: currentCount,
        message,
        room: serializeRoom(room),
        initialPlayers: initialPlayersPrep,
      });
      broadcastRoomState(room);

      currentCount -= 1;

      if (currentCount > 0) {
        room.countdownTimer = setTimeout(executeCountdownStep, 1000) as any;
      } else {
        // Tepat setelah angka "1" tampil genap 1 detik (1000ms), langsung eksekusi GO tanpa jeda diam ekstra
        room.countdownTimer = setTimeout(() => {
          // EKSEKUSI AUTHORITATIVE "GO" & EMIT ULANG SELURUH STATE AWAL REMOTE PLAYER
          room.status = 'in_game';
          room.countdownSeconds = 0;
          room.countdownTimer = undefined;
          room.raceStartTime = Date.now();
          room.recordingFrames = [];

          const finalFreshPlayers: Record<string, any> = {};
          let fIdx = 0;
          for (const p of room.players.values()) {
            p.status = 'playing';
            p.speed = 0;
            p.distance = 0;
            p.steer = 0;
            p.gas = false;
            p.brake = false;
            p.nitro = false;
            p.hp = 3;
            p.score = 0;
            p.combo = 0;
            if (p.laneIndex === undefined) {
              p.laneIndex = laneDistribution[fIdx % laneDistribution.length];
            }

            finalFreshPlayers[p.id] = {
              id: p.id,
              username: p.username,
              avatar: p.avatar,
              carColor: p.carColor,
              carModel: p.carModel,
              laneIndex: p.laneIndex,
              x: 0,
              y: 0,
              speed: 0,
              distance: 0,
              lap: 1,
              steer: 0,
              gas: false,
              brake: false,
              nitro: false,
              hp: 3,
              score: 0,
              combo: 0,
              status: 'playing',
            };
            fIdx++;
          }

          // Rekam frame pertama replay (t = 0)
          const initialSnapshot: Record<string, any> = {};
          for (const [id, p] of room.players) {
            initialSnapshot[id] = {
              id: p.id,
              username: p.username,
              avatar: p.avatar,
              carColor: p.carColor,
              carModel: p.carModel,
              laneIndex: p.laneIndex,
              x: Math.round(p.x),
              y: Math.round(p.y),
              speed: 0,
              distance: 0,
              steer: 0,
              gas: false,
              brake: false,
              nitro: false,
              hp: 3,
              score: 0,
              status: 'playing',
            };
          }
          room.recordingFrames.push({ t: 0, players: initialSnapshot });

          // Mulai perekaman telemetri replay tiap 100ms
          if (room.recordingTimer) clearInterval(room.recordingTimer);
          room.recordingTimer = setInterval(() => {
            if (room.status !== 'in_game' || !room.raceStartTime) {
              if (room.recordingTimer) clearInterval(room.recordingTimer);
              return;
            }
            const relTime = Date.now() - room.raceStartTime;
            const snapshot: Record<string, any> = {};
            for (const [id, p] of room.players) {
              snapshot[id] = {
                id: p.id,
                username: p.username,
                avatar: p.avatar,
                carColor: p.carColor,
                carModel: p.carModel,
                laneIndex: p.laneIndex,
                x: Math.round(p.x),
                y: Math.round(p.y),
                speed: Math.round(p.speed),
                distance: Math.round(p.distance),
                steer: p.steer,
                gas: p.gas,
                brake: p.brake,
                nitro: p.nitro,
                hp: p.hp,
                score: Math.round(p.score),
                status: p.status,
              };
            }
            if (room.recordingFrames) {
              room.recordingFrames.push({ t: relTime, players: snapshot });
              if (room.recordingFrames.length > 3600) {
                room.recordingFrames.shift();
              }
            }
          }, 100) as any;

          // 1. Broadcast sinyal "GO" bersama state awal yang bersih dan terverifikasi
          io.to(room.code).emit('countdown_tick', {
            count: 0,
            message: 'GO! BALAPAN DIMULAI!',
            room: serializeRoom(room),
            initialPlayers: finalFreshPlayers,
            startTime: Date.now(),
          });

          // 2. Broadcast authoritative event race_start
          io.to(room.code).emit('race_start', {
            targetDistance: room.targetDistance,
            room: serializeRoom(room),
            initialPlayers: finalFreshPlayers,
            startTime: Date.now(),
          });

          // 3. Emit ulang fresh opponent_sync untuk setiap player tepat saat GO
          for (const freshP of Object.values(finalFreshPlayers)) {
            io.to(room.code).emit('opponent_sync', {
              userId: freshP.id,
              username: freshP.username,
              avatar: freshP.avatar,
              carColor: freshP.carColor,
              carModel: freshP.carModel,
              laneIndex: freshP.laneIndex,
              x: 0,
              y: 0,
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
              status: 'playing',
            });
          }

          broadcastRoomState(room);
        }, 1000) as any;
      }
    };

    // Mulai hitungan mundur langsung 3 -> 2 -> 1 -> GO tanpa jeda buffer awal
    executeCountdownStep();
  }

  // Check race finish condition (first to reach targetDistance or last survivor)
  function evaluateRaceOutcome(room: Room) {
    if (room.status !== 'in_game' || room.players.size === 0) return;

    // 1. Check if any player has completed the race or reached target distance
    for (const [id, p] of room.players) {
      if ((p.status === 'finished' || p.distance >= room.targetDistance) && p.status !== 'crashed') {
        p.status = 'finished';
        finishRace(room, id, `Menyentuh Garis Finish (${room.targetDistance}m)!`);
        return;
      }
    }

    // 2. Multi-player race evaluations
    if (room.players.size > 1) {
      const playingPlayers = Array.from(room.players.values()).filter((pl) => pl.status === 'playing');
      const crashedPlayers = Array.from(room.players.values()).filter((pl) => pl.status === 'crashed');
      const finishedPlayers = Array.from(room.players.values()).filter((pl) => pl.status === 'finished');

      // If everyone is done (no one left actively playing)
      if (playingPlayers.length === 0) {
        // If someone finished, top finished player wins; otherwise top score among all
        let topPlayer = Array.from(room.players.values())[0];
        for (const pl of room.players.values()) {
          const isBetter =
            (pl.status === 'finished' && topPlayer.status !== 'finished') ||
            (pl.score > (topPlayer.score || 0)) ||
            (pl.score === (topPlayer.score || 0) && pl.distance > topPlayer.distance);
          if (isBetter) topPlayer = pl;
        }
        finishRace(room, topPlayer?.id, 'Skor & Jarak Tertinggi dalam Balapan!');
        return;
      }

      // If only 1 player remains playing and all other opponents crashed
      if (playingPlayers.length === 1 && crashedPlayers.length === room.players.size - 1 && finishedPlayers.length === 0) {
        finishRace(room, playingPlayers[0].id, 'Satu-satunya yang Bertahan Melawan Armada Polisi!');
        return;
      }
    }
  }

  function finishRace(room: Room, winnerId?: string, reason?: string) {
    if (room.status === 'finished') return;
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    if (room.recordingTimer) {
      clearInterval(room.recordingTimer);
      room.recordingTimer = undefined;
    }

    room.status = 'finished';
    room.winnerId = winnerId;

    for (const p of room.players.values()) {
      p.status = 'finished';
    }

    // Simpan data ghost replay autoritatif balapan ini ke database
    if (room.recordingFrames && room.recordingFrames.length > 0) {
      const replayId = 'replay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const winnerPlayer = winnerId ? room.players.get(winnerId) : undefined;
      const replayRecord = {
        id: replayId,
        roomCode: room.code,
        matchName: room.name,
        difficulty: room.difficulty,
        mapId: 'kota',
        targetDistance: room.targetDistance,
        winnerId: winnerId || null,
        winnerName: winnerPlayer ? winnerPlayer.username : (winnerId ? 'Pemenang' : null),
        durationMs: room.raceStartTime ? Date.now() - room.raceStartTime : 0,
        playerSummary: Array.from(room.players.values()).map(p => ({
          id: p.id,
          username: p.username,
          avatar: p.avatar,
          carColor: p.carColor,
          carModel: p.carModel,
          distance: Math.round(p.distance),
          score: Math.round(p.score),
          status: p.status,
        })),
        frames: room.recordingFrames,
        createdAt: new Date().toISOString(),
      };

      if (!db.replays) db.replays = [];
      db.replays.unshift(replayRecord);
      if (db.replays.length > 50) {
        db.replays = db.replays.slice(0, 50);
      }
      room.lastSavedReplayId = replayId;
      saveDB();
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
      replayId: room.lastSavedReplayId,
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
          const roomCodeToUse = currentRoomCode || data.code || data.roomCode;
          if (!roomCodeToUse) return;
          const room = activeRooms.get(roomCodeToUse);
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
        case 'sync_player':
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
          const roomCodeToUse = currentRoomCode || data.code || data.roomCode;
          if (!roomCodeToUse) return;
          const room = activeRooms.get(roomCodeToUse);
          if (!room) return;

          if (currentUserId && room.players.has(currentUserId)) {
            const p = room.players.get(currentUserId)!;
            if (data.action === 'crashed') {
              p.status = 'crashed';
              p.hp = 0;
            } else if (data.action === 'completed') {
              p.status = 'finished';
            }
            if (data.score !== undefined) p.score = Math.floor(data.score);
            if (data.distance !== undefined) p.distance = Math.floor(data.distance);
          }

          socket.to(room.code).emit('opponent_action', {
            userId: currentUserId,
            username: data.username,
            action: data.action,
            value: data.value,
            score: data.score,
            distance: data.distance,
          });

          if (data.action === 'crashed' || data.action === 'completed') {
            evaluateRaceOutcome(room);
          }
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
      'sync_player',
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
