import { io, Socket } from 'socket.io-client';
import { NotificationItem } from '../types/game';
import { getServerBaseUrl, DEFAULT_CLOUD_BACKEND_URL } from '../utils/serverUrl';
import { peerMultiplayer } from './peerMultiplayer';

type MessageHandler = (data: any) => void;

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private currentUserId: string | null = null;
  private sendQueue: any[] = [];
  public isConnected: boolean = false;
  public isP2P: boolean = false;
  public ping: number = 0;
  private pingInterval: any = null;
  private activeServerUrl: string = '';
  private triedFallback: boolean = false;
  private p2pEventsWired: boolean = false;

  constructor() {
    this.wireP2PEvents();
  }

  private wireP2PEvents() {
    if (this.p2pEventsWired) return;
    this.p2pEventsWired = true;

    const p2pEvents = [
      'room_list',
      'room_state',
      'countdown_tick',
      'race_start',
      'race_finish',
      'opponent_sync',
      'opponent_action',
      'opponent_left',
      'chat_message',
      'error',
      'connect',
    ];

    p2pEvents.forEach((ev) => {
      peerMultiplayer.on(ev, (data: any) => {
        if (ev === 'connect') {
          this.isConnected = true;
          this.isP2P = true;
        }
        this.trigger(ev, data);
      });
    });
  }

  public getConnectedUrl(): string {
    if (this.isP2P) return 'P2P WebRTC Direct';
    return this.activeServerUrl || getServerBaseUrl();
  }

  public reconnect(newUrl?: string) {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch {}
      this.socket = null;
    }
    peerMultiplayer.cleanup();
    this.isConnected = false;
    this.isP2P = false;
    this.triedFallback = false;
    if (newUrl) {
      this.activeServerUrl = newUrl;
    }
    this.connect(this.currentUserId || undefined);
  }

  public connect(userId?: string) {
    if (userId) {
      this.currentUserId = userId;
    }

    if (this.socket && this.socket.connected) {
      if (this.currentUserId) {
        this.emit('auth_register', { userId: this.currentUserId });
      }
      return;
    }

    const targetUrl = this.activeServerUrl || getServerBaseUrl();
    this.activeServerUrl = targetUrl;

    // Check if targetUrl is valid for Socket.IO
    if (!this.socket) {
      try {
        this.socket = io(targetUrl, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 4,
          reconnectionDelay: 1000,
          timeout: 4000,
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.isP2P = false;
          this.trigger('connect', true);

          if (this.currentUserId) {
            this.emit('auth_register', { userId: this.currentUserId });
          }

          // Flush any queued messages
          while (this.sendQueue.length > 0) {
            const item = this.sendQueue.shift();
            this.send(item);
          }

          this.startPingMeasurement();
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          this.trigger('disconnect', reason);
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
        });

        this.socket.on('connect_error', () => {
          // If server cannot be reached (e.g. static host like Vercel),
          // activate resilient WebRTC Peer-to-Peer mode!
          this.isP2P = true;
          this.isConnected = true;
          this.trigger('connect', true);

          // Flush queued messages through P2P
          while (this.sendQueue.length > 0) {
            const item = this.sendQueue.shift();
            peerMultiplayer.send(item);
          }
        });

        // Handle server ping measurement
        this.socket.on('pong_check', (timestamp: number) => {
          if (timestamp) {
            this.ping = Math.max(1, Date.now() - timestamp);
            this.trigger('ping_update', this.ping);
          }
        });

        // Map dynamic incoming socket events to listeners
        const coreEvents = [
          'room_list',
          'room_state',
          'countdown_tick',
          'race_start',
          'race_finish',
          'opponent_sync',
          'opponent_action',
          'opponent_left',
          'leaderboard_update',
          'push_notification',
          'error',
          'chat_message',
        ];

        for (const ev of coreEvents) {
          this.socket.on(ev, (data: any) => {
            this.trigger(ev, data);
          });
        }

        // Catch-all for any custom server events
        this.socket.onAny((event: string, ...args: any[]) => {
          const payload = args.length > 0 ? args[0] : null;
          this.trigger(event, payload);
        });
      } catch (err) {
        // Fallback directly to P2P
        this.isP2P = true;
        this.isConnected = true;
        this.trigger('connect', true);
      }
    } else if (!this.socket.connected && !this.isP2P) {
      this.socket.connect();
    }
  }

  private startPingMeasurement() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    // Send lightweight ping check every 3 seconds
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping_check', Date.now());
      }
    }, 3000);
  }

  /**
   * Universal send method compatible with Socket.IO & P2P WebRTC
   */
  public send(payload: any) {
    if (!payload) return;

    // Route to Socket.IO if connected to a live server
    if (this.socket && this.socket.connected) {
      const eventName = payload.type || 'message';
      try {
        this.socket.emit(eventName, payload);
        return;
      } catch (e) {
        console.error('Socket.IO emit error:', e);
      }
    }

    // Otherwise route through WebRTC Peer-to-Peer
    if (this.isP2P || !this.socket || !this.socket.connected) {
      peerMultiplayer.send(payload);
    }
  }

  public emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else if (data) {
      this.send({ type: event, ...data });
    }
  }

  public disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.currentUserId = null;
    this.isConnected = false;
    this.isP2P = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    peerMultiplayer.cleanup();
  }

  public on(event: string, handler: MessageHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: MessageHandler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private trigger(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
  }
}

export const socket = new SocketClient();
