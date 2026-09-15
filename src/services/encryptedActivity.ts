// Local Encrypted Activity Storage for player history privacy
export interface EncryptedActivityRecord {
  id: string;
  timestamp: string;
  type: 'race_completed' | 'game_run' | 'caught_by_police' | 'new_record' | 'multiplayer_duel' | 'account_registered';
  title: string;
  score: number;
  distance: number;
  obstaclesDodged: number;
  bountyEarned: number;
  difficulty: string;
  carModel?: string;
  details?: string;
}

export type ActivityRecord = EncryptedActivityRecord;

const STORAGE_KEY = 'cyber_pursuit_enc_activity_vault';
const ENCRYPTION_SALT = 'CYBER_POLICE_SECURE_SALT_2026';

// Helper to derive a 256-bit AES-GCM CryptoKey using PBKDF2 or fallback
async function getCryptoKey(secret: string): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret + ENCRYPTION_SALT),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(ENCRYPTION_SALT),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}

// Fallback reversible cipher (XOR + Base64 with rolling salt) for environments without WebCrypto
function fallbackEncrypt(text: string, secret: string): string {
  const enc = new TextEncoder();
  const textBytes = enc.encode(text);
  const keyBytes = enc.encode(secret + ENCRYPTION_SALT);
  const out = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    out[i] = textBytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 37) & 0xff);
  }
  return 'fb:' + btoa(String.fromCharCode(...out));
}

function fallbackDecrypt(cipher: string, secret: string): string {
  if (!cipher.startsWith('fb:')) return '';
  const raw = atob(cipher.slice(3));
  const textBytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    textBytes[i] = raw.charCodeAt(i);
  }
  const keyBytes = new TextEncoder().encode(secret + ENCRYPTION_SALT);
  const out = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    out[i] = textBytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 37) & 0xff);
  }
  return new TextDecoder().decode(out);
}

export const encryptedActivityService = {
  // Get all activity records decrypted for current user
  async getActivities(userId: string): Promise<EncryptedActivityRecord[]> {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (!raw) return [];

      // Check if stored with WebCrypto AES-GCM
      if (raw.startsWith('aes:')) {
        const payload = JSON.parse(raw.slice(4));
        const key = await getCryptoKey(userId);
        if (key && window.crypto.subtle) {
          const iv = new Uint8Array(payload.iv);
          const data = new Uint8Array(payload.data);
          const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
          );
          const text = new TextDecoder().decode(decrypted);
          return JSON.parse(text);
        }
      } else if (raw.startsWith('fb:')) {
        const decrypted = fallbackDecrypt(raw, userId);
        return JSON.parse(decrypted);
      }
    } catch (e) {
      console.warn('Gagal mendekripsi riwayat aktivitas lokal:', e);
    }
    return [];
  },

  // Save new activity item securely encrypted
  async addActivity(userId: string, item: Omit<EncryptedActivityRecord, 'id' | 'timestamp'>): Promise<void> {
    if (!userId) return;
    try {
      const existing = await this.getActivities(userId);
      const newRecord: EncryptedActivityRecord = {
        ...item,
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
      };

      // Keep latest 50 activities to save storage
      const updated = [newRecord, ...existing].slice(0, 50);
      const jsonStr = JSON.stringify(updated);

      const key = await getCryptoKey(userId);
      if (key && window.crypto.subtle) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encData = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          new TextEncoder().encode(jsonStr)
        );

        const envelope = {
          iv: Array.from(iv),
          data: Array.from(new Uint8Array(encData)),
        };
        localStorage.setItem(`${STORAGE_KEY}_${userId}`, 'aes:' + JSON.stringify(envelope));
      } else {
        // Fallback cipher
        const encrypted = fallbackEncrypt(jsonStr, userId);
        localStorage.setItem(`${STORAGE_KEY}_${userId}`, encrypted);
      }
    } catch (err) {
      console.error('Failed to save encrypted activity:', err);
    }
  },

  // Clear activity history
  clearActivities(userId: string): void {
    if (!userId) return;
    localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
  },
};
