import Peer, { DataConnection } from 'peerjs';
import { MultiplayerRoom, MultiplayerPlayerState, DifficultyLevel } from '../types';
import { api } from './api';

type EventCallback = (data: any) => void;

interface PeerMessage {
  type: string;
  [key: string]: any;
}

export class PeerMultiplayerService {
  private peer: any = null;
  private peerId: string = '';
  private isHost: boolean = false;
  private currentRoomCode: string = '';
  private currentUserId: string = '';
  private currentUsername: string = '';
  private currentAvatar: string = '🏎️';
  private currentCarColor: string = '#00f0ff';
  private currentCarModel: string = 'civic_fl5';

  // Active P2P Connections (Host holds multiple, Guest holds connection to host)
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;

  // Local authoritative room state (for host) or mirror state (for guest)
  private currentRoom: MultiplayerRoom | null = null;
  private countdownTimer: any = null;
  private isConnecting: boolean = false;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  public isP2PActive: boolean = false;
  public connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'hosting' = 'disconnected';

  constructor() {
    // STUN config for robust NAT traversal across mobile networks and Wi-Fi
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  public trigger(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in P2P event ${event}:`, e);
        }
      });
    }
  }

  private cleanRoomCode(code: string): string {
    return (code || 'RACE-1').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  }

  private getHostPeerId(code: string): string {
    const clean = this.cleanRoomCode(code).toLowerCase().replace(/[^a-z0-9]/g, '');
    return `cprace-room-${clean}`;
  }

  private async getPeerConstructor(): Promise<any> {
    try {
      const mod = await import('peerjs');
      return (mod as any).Peer || (mod as any).default?.Peer || (mod as any).default;
    } catch (e) {
      console.error('Failed to import peerjs:', e);
      throw e;
    }
  }

  private async createPeerInstance(preferredId?: string): Promise<any> {
    const PeerClass = await this.getPeerConstructor();
    const config = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com' },
        ],
      },
    };

    return new Promise((resolve, reject) => {
      let instance: any;
      if (preferredId) {
        instance = new PeerClass(preferredId, config);
      } else {
        instance = new PeerClass(config);
      }

      const timeout = setTimeout(() => {
        if (!instance.open) {
          resolve(instance);
        }
      }, 5000);

      instance.on('open', (id: string) => {
        clearTimeout(timeout);
        this.peerId = id;
        resolve(instance);
      });

      instance.on('error', (err: any) => {
        clearTimeout(timeout);
        console.warn('PeerJS instance error:', err?.type || err?.message || err);
        // If preferred ID is unavailable (e.g. ID taken), resolve anyway to handle fallback
        if (err?.type === 'unavailable-id') {
          resolve(instance);
        } else {
          resolve(instance);
        }
      });
    });
  }

  public setPlayerInfo(info: {
    userId: string;
    username: string;
    avatar?: string;
    carColor?: string;
    carModel?: string;
  }) {
    this.currentUserId = info.userId;
    this.currentUsername = info.username;
    if (info.avatar) this.currentAvatar = info.avatar;
    if (info.carColor) this.currentCarColor = info.carColor;
    if (info.carModel) this.currentCarModel = info.carModel;
  }

  /**
   * HOST: Creates a P2P Room with the given room code
   */
  public async createRoom(params: {
    code?: string;
    name?: string;
    difficulty?: DifficultyLevel;
    userId: string;
    username: string;
    avatar?: string;
    carColor?: string;
    carModel?: string;
  }) {
    this.cleanup();
    this.setPlayerInfo(params);
    this.isHost = true;
    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    const roomCode = this.cleanRoomCode(params.code || 'RACE-' + Math.floor(1000 + Math.random() * 9000));
    this.currentRoomCode = roomCode;
    const hostPeerId = this.getHostPeerId(roomCode);

    try {
      this.peer = await this.createPeerInstance(hostPeerId);
      this.isP2PActive = true;
      this.connectionStatus = 'hosting';

      const targetDist = params.difficulty === 'MAXXX' ? 2000 : params.difficulty === 'HARD' ? 1500 : 1200;

      const hostPlayer: MultiplayerPlayerState = {
        id: params.userId,
        username: params.username,
        avatar: params.avatar || this.currentAvatar,
        carColor: params.carColor || this.currentCarColor,
        carModel: params.carModel || this.currentCarModel,
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
        ping: 15,
        status: 'ready',
        isHost: true,
      };

      this.currentRoom = {
        code: roomCode,
        name: params.name || `${params.username}'s Arena`,
        status: 'waiting',
        difficulty: params.difficulty || 'NORMAL',
        targetDistance: targetDist,
        players: {
          [params.userId]: hostPlayer,
        },
        createdAt: Date.now(),
      };

      // Listen for incoming guest connections
      this.peer.on('connection', (conn: DataConnection) => {
        this.handleIncomingGuest(conn);
      });

      this.trigger('room_state', { room: this.currentRoom });
      this.trigger('connect', true);
    } catch (e: any) {
      console.error('Failed to create P2P room:', e);
      this.trigger('error', { message: 'Gagal membuat ruangan P2P. Periksa koneksi internet.' });
      this.connectionStatus = 'disconnected';
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * GUEST: Joins an existing P2P Room created by the host
   */
  public async joinRoom(params: {
    code: string;
    userId: string;
    username: string;
    avatar?: string;
    carColor?: string;
    carModel?: string;
  }) {
    this.cleanup();
    this.setPlayerInfo(params);
    this.isHost = false;
    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    const roomCode = this.cleanRoomCode(params.code);
    this.currentRoomCode = roomCode;
    const hostPeerId = this.getHostPeerId(roomCode);

    try {
      this.peer = await this.createPeerInstance(); // Guest gets a random peer ID
      this.isP2PActive = true;

      // Connect to host
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
      });

      this.hostConnection = conn;

      const connTimeout = setTimeout(() => {
        if (!conn.open) {
          this.trigger('error', {
            message: `Tidak dapat menemukan Host untuk Room "${roomCode}". Pastikan teman Anda sudah menekan "Buat Ruangan".`,
          });
          this.connectionStatus = 'disconnected';
        }
      }, 7000);

      conn.on('open', () => {
        clearTimeout(connTimeout);
        this.connectionStatus = 'connected';
        this.trigger('connect', true);

        // Send join payload to host
        conn.send({
          type: 'join_room',
          userId: params.userId,
          username: params.username,
          avatar: params.avatar || this.currentAvatar,
          carColor: params.carColor || this.currentCarColor,
          carModel: params.carModel || this.currentCarModel,
        });
      });

      conn.on('data', (raw: any) => {
        this.handleMessageFromHost(raw);
      });

      conn.on('close', () => {
        this.connectionStatus = 'disconnected';
        this.trigger('opponent_left', {
          userId: 'host',
          username: 'Host Ruangan',
        });
        this.trigger('error', { message: 'Koneksi ke Host terputus.' });
      });

      conn.on('error', (err: any) => {
        clearTimeout(connTimeout);
        console.warn('Guest connection error:', err);
        this.trigger('error', {
          message: `Gagal terhubung ke Room "${roomCode}". Periksa kode ruangan Anda.`,
        });
      });
    } catch (e: any) {
      console.error('Failed to join P2P room:', e);
      this.trigger('error', { message: 'Gagal bergabung ke ruangan P2P.' });
      this.connectionStatus = 'disconnected';
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * HOST: Handles an incoming peer guest connection
   */
  private handleIncomingGuest(conn: DataConnection) {
    let guestUserId: string = '';

    conn.on('open', () => {
      // Connection open, awaiting join payload
    });

    conn.on('data', (raw: any) => {
      const msg = raw as PeerMessage;
      if (!msg || !msg.type) return;

      if (msg.type === 'join_room') {
        guestUserId = msg.userId || 'guest_' + Date.now();
        this.connections.set(guestUserId, conn);

        if (!this.currentRoom) return;

        // Assign starting lane offset for guest (e.g. 260px)
        const guestPlayer: MultiplayerPlayerState = {
          id: guestUserId,
          username: msg.username || 'Pembalap 2',
          avatar: msg.avatar || '🏎️',
          carColor: msg.carColor || '#ff2d6b',
          carModel: msg.carModel || 'civic_fl5',
          x: 260,
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
          ping: 20,
          status: 'ready',
          isHost: false,
        };

        this.currentRoom.players[guestUserId] = guestPlayer;

        // Record guest into local player registry for Leaderboard
        api.recordPeerPlayer({
          userId: guestUserId,
          username: guestPlayer.username,
          avatar: guestPlayer.avatar,
          carColor: guestPlayer.carColor,
          carModel: guestPlayer.carModel,
          difficulty: this.currentRoom.difficulty,
        });

        // Broadcast updated room state to all guests and host UI
        this.broadcastToGuests({
          type: 'room_state',
          room: this.currentRoom,
        });
        this.trigger('room_state', { room: this.currentRoom });
        return;
      }

      // Handle real-time synchronization messages from guests
      if (msg.type === 'player_sync') {
        // Forward opponent sync to Host UI and other guests
        const syncPayload = {
          userId: msg.userId || guestUserId,
          username: msg.username,
          avatar: msg.avatar,
          carColor: msg.carColor,
          carModel: msg.carModel,
          x: msg.x,
          y: msg.y,
          speed: msg.speed,
          distance: msg.distance,
          score: msg.score,
          hp: msg.hp,
          combo: msg.combo,
          status: msg.status,
        };

        this.trigger('opponent_sync', syncPayload);

        if (syncPayload.score || syncPayload.distance) {
          api.recordPeerPlayer({
            userId: syncPayload.userId,
            username: syncPayload.username,
            avatar: syncPayload.avatar,
            carColor: syncPayload.carColor,
            carModel: syncPayload.carModel,
            score: syncPayload.score,
            distance: syncPayload.distance,
            bestCombo: syncPayload.combo,
          });
        }

        // Forward to any other guests in the room
        for (const [id, c] of this.connections) {
          if (id !== guestUserId && c.open) {
            c.send({ type: 'opponent_sync', ...syncPayload });
          }
        }
        return;
      }

      if (msg.type === 'player_action') {
        const actionPayload = {
          userId: guestUserId,
          username: msg.username || 'Teman',
          action: msg.action,
          value: msg.value,
          score: msg.score,
          distance: msg.distance,
        };
        this.trigger('opponent_action', actionPayload);
        this.broadcastToGuests({ type: 'opponent_action', ...actionPayload }, guestUserId);
        if (msg.action === 'completed' && this.isHost) {
          this.handleRaceFinish(guestUserId, `${msg.username || 'Teman'} Mencapai Garis Finish!`);
        }
        return;
      }

      if (msg.type === 'race_finish') {
        this.handleRaceFinish(msg.winnerId || guestUserId, msg.reason);
        return;
      }

      if (msg.type === 'leave_room') {
        this.removeGuest(guestUserId);
        return;
      }
    });

    conn.on('close', () => {
      if (guestUserId) {
        this.removeGuest(guestUserId);
      }
    });
  }

  /**
   * GUEST: Handles messages received from host
   */
  private handleMessageFromHost(raw: any) {
    const msg = raw as PeerMessage;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'room_state':
        this.currentRoom = msg.room;
        if (msg.room?.players) {
          Object.values(msg.room.players).forEach((p: any) => {
            if (p && p.id !== this.currentUserId) {
              api.recordPeerPlayer({
                userId: p.id,
                username: p.username,
                avatar: p.avatar,
                carColor: p.carColor,
                carModel: p.carModel,
                difficulty: msg.room.difficulty,
              });
            }
          });
        }
        this.trigger('room_state', { room: msg.room });
        break;

      case 'countdown_tick':
        this.trigger('countdown_tick', { count: msg.count, message: msg.message });
        break;

      case 'race_start':
        this.trigger('race_start', { room: this.currentRoom });
        break;

      case 'opponent_sync':
        if (msg.score || msg.distance) {
          api.recordPeerPlayer({
            userId: msg.userId,
            username: msg.username,
            avatar: msg.avatar,
            carColor: msg.carColor,
            carModel: msg.carModel,
            score: msg.score,
            distance: msg.distance,
            bestCombo: msg.combo,
          });
        }
        this.trigger('opponent_sync', msg);
        break;

      case 'opponent_action':
        this.trigger('opponent_action', msg);
        break;

      case 'opponent_left':
        this.trigger('opponent_left', msg);
        break;

      case 'race_finish':
        this.trigger('race_finish', msg);
        break;

      case 'chat_message':
        this.trigger('chat_message', msg);
        break;

      case 'error':
        this.trigger('error', { message: msg.message });
        break;
    }
  }

  private broadcastToGuests(payload: any, exceptUserId?: string) {
    for (const [id, conn] of this.connections) {
      if (id !== exceptUserId && conn.open) {
        try {
          conn.send(payload);
        } catch (e) {
          console.error(`Failed to send message to guest ${id}:`, e);
        }
      }
    }
  }

  private removeGuest(guestUserId: string) {
    const guestPlayer = this.currentRoom?.players[guestUserId];
    const guestName = guestPlayer?.username || 'Pemain';

    this.connections.delete(guestUserId);
    if (this.currentRoom && this.currentRoom.players[guestUserId]) {
      delete this.currentRoom.players[guestUserId];
      this.broadcastToGuests({
        type: 'opponent_left',
        userId: guestUserId,
        username: guestName,
      });
      this.broadcastToGuests({
        type: 'room_state',
        room: this.currentRoom,
      });
      this.trigger('opponent_left', {
        userId: guestUserId,
        username: guestName,
      });
      this.trigger('room_state', { room: this.currentRoom });
    }
  }

  /**
   * HOST: Starts the race with a 3-second countdown
   */
  public startRace() {
    if (!this.currentRoom) return;
    this.isHost = true;

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    let count = 3;
    this.currentRoom.status = 'countdown';
    this.currentRoom.countdownSeconds = count;

    // Immediately notify both Host and Guests to switch to the Game Canvas!
    this.broadcastToGuests({
      type: 'room_state',
      room: this.currentRoom,
    });
    this.trigger('room_state', { room: this.currentRoom });

    const tick = () => {
      this.broadcastToGuests({
        type: 'countdown_tick',
        count,
        message: count > 0 ? `${count}` : 'GO! BALAPAN DIMULAI!',
      });
      this.trigger('countdown_tick', {
        count,
        message: count > 0 ? `${count}` : 'GO! BALAPAN DIMULAI!',
      });

      if (count <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        if (this.currentRoom) {
          this.currentRoom.status = 'in_game';
          this.broadcastToGuests({
            type: 'room_state',
            room: this.currentRoom,
          });
          this.trigger('room_state', { room: this.currentRoom });
        }
      } else {
        count--;
      }
    };

    tick();
    this.countdownTimer = setInterval(tick, 1000);
  }

  /**
   * Handles race finish condition and declares winner
   */
  public handleRaceFinish(winnerId: string, reason?: string) {
    if (this.currentRoom) {
      this.currentRoom.status = 'finished';
      this.currentRoom.winnerId = winnerId;
    }

    const payload = {
      type: 'race_finish',
      winnerId,
      reason: reason || 'Garis Finish Tercapai!',
      room: this.currentRoom,
    };

    if (this.isHost) {
      this.broadcastToGuests(payload);
    } else if (this.hostConnection?.open) {
      this.hostConnection.send(payload);
    }

    this.trigger('race_finish', payload);
    if (this.currentRoom) {
      this.trigger('room_state', { room: this.currentRoom });
    }
  }

  /**
   * Rematch: resets the race and starts countdown again
   */
  public rematch() {
    if (this.isHost) {
      this.startRace();
    } else if (this.hostConnection?.open) {
      this.hostConnection.send({ type: 'rematch_room' });
    }
  }

  /**
   * Return to Room Lobby
   */
  public returnToLobby() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    if (this.currentRoom) {
      this.currentRoom.status = 'waiting';
      this.currentRoom.winnerId = undefined;
      for (const p of Object.values(this.currentRoom.players)) {
        p.status = 'ready';
        p.score = 0;
        p.hp = 3;
        p.combo = 0;
        p.distance = 0;
      }
    }

    if (this.isHost) {
      this.broadcastToGuests({
        type: 'room_state',
        room: this.currentRoom,
      });
    } else if (this.hostConnection?.open) {
      this.hostConnection.send({ type: 'return_to_lobby' });
    }

    if (this.currentRoom) {
      this.trigger('room_state', { room: this.currentRoom });
    }
  }

  /**
   * Universal message sending method (called by socket wrapper)
   */
  public send(payload: any) {
    if (!payload || !payload.type) return;

    switch (payload.type) {
      case 'create_room':
        this.createRoom(payload);
        break;

      case 'join_room':
        this.joinRoom(payload);
        break;

      case 'start_game':
        this.startRace();
        break;

      case 'rematch_room':
        this.rematch();
        break;

      case 'return_to_lobby':
        this.returnToLobby();
        break;

      case 'leave_room':
        this.cleanup();
        break;

      case 'player_sync':
        if (this.isHost) {
          const syncPayload = {
            userId: this.currentUserId,
            username: payload.username || this.currentUsername,
            avatar: payload.avatar || this.currentAvatar,
            carColor: payload.carColor || this.currentCarColor,
            carModel: payload.carModel || this.currentCarModel,
            x: payload.x,
            y: payload.y,
            speed: payload.speed,
            distance: payload.distance,
            score: payload.score,
            hp: payload.hp,
            combo: payload.combo,
            status: payload.status,
          };
          this.broadcastToGuests({ type: 'opponent_sync', ...syncPayload });
        } else if (this.hostConnection?.open) {
          this.hostConnection.send({
            type: 'player_sync',
            userId: this.currentUserId,
            ...payload,
          });
        }
        break;

      case 'player_action':
        if (this.isHost) {
          const actionPayload = {
            userId: this.currentUserId,
            username: this.currentUsername,
            action: payload.action,
            value: payload.value,
            score: payload.score,
            distance: payload.distance,
          };
          this.broadcastToGuests({ type: 'opponent_action', ...actionPayload });
          if (payload.action === 'completed') {
            this.handleRaceFinish(this.currentUserId, 'Kamu Mencapai Garis Finish!');
          }
        } else if (this.hostConnection?.open) {
          this.hostConnection.send({
            type: 'player_action',
            userId: this.currentUserId,
            username: this.currentUsername,
            action: payload.action,
            value: payload.value,
            score: payload.score,
            distance: payload.distance,
          });
        }
        break;

      case 'list_rooms':
        // Default preset community racing rooms available for immediate matching
        this.trigger('room_list', {
          rooms: [
            {
              code: 'NEON-77',
              name: 'Cyber Duel Arena',
              status: 'waiting',
              difficulty: 'MAXXX',
              playerCount: 1,
            },
            {
              code: 'RACE-01',
              name: 'Highway Sprint 1v1',
              status: 'waiting',
              difficulty: 'HARD',
              playerCount: 1,
            },
            {
              code: 'TURBO-99',
              name: 'Speedway Turbo Run',
              status: 'waiting',
              difficulty: 'NORMAL',
              playerCount: 1,
            },
          ],
        });
        break;

      default:
        if (this.isHost) {
          this.broadcastToGuests(payload);
        } else if (this.hostConnection?.open) {
          this.hostConnection.send(payload);
        }
        break;
    }
  }

  public cleanup() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    for (const conn of this.connections.values()) {
      try {
        conn.close();
      } catch {}
    }
    this.connections.clear();

    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch {}
      this.hostConnection = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    this.isHost = false;
    this.currentRoom = null;
    this.currentRoomCode = '';
    this.isP2PActive = false;
    this.connectionStatus = 'disconnected';
  }
}

export const peerMultiplayer = new PeerMultiplayerService();
