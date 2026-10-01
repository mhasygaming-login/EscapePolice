export const PUBLIC_APP_URL = 'https://ais-pre-ohvu3ldljbu2zszu353vkc-311469337722.asia-southeast1.run.app';

/**
 * Checks if current runtime is in a private developer preview container
 */
export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const origin = window.location.origin || '';
  return origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('ais-dev-');
}

/**
 * Returns the best public shareable URL for the game or a specific multiplayer room.
 * Ensures private dev domains (ais-dev-...) are NEVER handed out to friends.
 */
export function getPublicGameUrl(roomCode?: string): string {
  let baseUrl = PUBLIC_APP_URL;

  try {
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      // Use current window.location for any deployment domain (e.g. *.vercel.app, custom domains, or local)
      if (origin && !origin.includes('ais-dev-') && origin !== 'null' && origin.startsWith('http')) {
        baseUrl = `${origin}${window.location.pathname.replace(/\/$/, '')}`;
      }
    }
  } catch {}

  if (roomCode) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}room=${encodeURIComponent(roomCode.trim().toUpperCase())}`;
  }

  return baseUrl;
}

/**
 * Robust clipboard copy utility with fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  // Fallback for older browsers or restricted iframe environments
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Native Web Share API helper
 */
export async function shareGame(data: { title?: string; text?: string; roomCode?: string }): Promise<boolean> {
  const url = getPublicGameUrl(data.roomCode);
  const title = data.title || 'Main Escape Police - Balapan Neon Multiplayer!';
  const text = data.text || (data.roomCode 
    ? `Ayo balapan real-time denganku di Neon Highway! Kode Room: ${data.roomCode}`
    : 'Ayo main game balap liar Escape Police multiplayer bersama!');

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      // User canceled or failed, fallback to copy
    }
  }

  return await copyTextToClipboard(url);
}
