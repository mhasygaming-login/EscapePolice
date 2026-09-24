import { io, Socket } from 'socket.io-client';
import { NotificationItem } from '../types/game';

type MessageHandler = (data: any) => void;

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private currentUserId: string | null = null;
  private sendQueue: any[] = [];
  public isConnected: boolean = false;
  public ping: number = 0;
  private pingInterval: any = null;

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

    if (!this.socket) {
      this.socket = io(window.location.origin, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
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

      this.socket.on('connect_error', (err) => {
        this.isConnected = false;
        this.trigger('error', err);
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
    } else if (!this.socket.connected) {
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
   * Universal send method compatible with legacy { type, ... } payloads
   * as well as standard Socket.IO event emissions
   */
  public send(payload: any) {
    if (!payload) return;

    if (!this.socket || !this.socket.connected) {
      if (this.sendQueue.length < 50) {
        this.sendQueue.push(payload);
      }
      return;
    }

    const eventName = payload.type || 'message';
    try {
      // Emit named event directly with payload data
      this.socket.emit(eventName, payload);
    } catch (e) {
      console.error('Socket.IO emit error:', e);
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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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
