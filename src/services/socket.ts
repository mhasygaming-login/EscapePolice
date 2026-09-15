import { MultiplayerRoom, NotificationItem } from '../types/game';

type MessageHandler = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: any = null;
  private currentUserId: string | null = null;
  private sendQueue: any[] = [];
  public isConnected: boolean = false;

  public connect(userId?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (userId && userId !== this.currentUserId) {
        this.currentUserId = userId;
        this.send({ type: 'auth_register', userId });
      }
      return;
    }

    if (userId) this.currentUserId = userId;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}//${host}`);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.trigger('connect', true);
        if (this.currentUserId) {
          this.send({ type: 'auth_register', userId: this.currentUserId });
        }
        // Flush pending queued messages
        while (this.sendQueue.length > 0) {
          const queued = this.sendQueue.shift();
          try {
            this.ws?.send(JSON.stringify(queued));
          } catch {}
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'ping') {
            this.send({ type: 'pong', timestamp: Date.now() });
            return;
          }
          this.trigger(payload.type, payload);
        } catch (e) {
          console.error('Failed to parse WS incoming message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.trigger('disconnect', false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.trigger('error', null);
      };
    } catch (e) {
      console.warn('WebSocket connection not supported or failed:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.currentUserId || undefined);
    }, 4000);
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (e) {
        this.sendQueue.push(payload);
      }
    } else {
      // Buffer until connected (max 50 to avoid memory buildup)
      if (this.sendQueue.length < 50) {
        this.sendQueue.push(payload);
      }
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.currentUserId = null;
    this.isConnected = false;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
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
      handlers.forEach(h => {
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
