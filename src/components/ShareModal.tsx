import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  ExternalLink,
  MessageCircle,
  Send,
  Users,
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';
import { getPublicGameUrl, copyTextToClipboard, PUBLIC_APP_URL } from '../utils/share';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomCode }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  if (!isOpen) return null;

  const publicUrl = getPublicGameUrl(roomCode);
  const rawBaseUrl = getPublicGameUrl();

  const handleCopyLink = async () => {
    const success = await copyTextToClipboard(publicUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyRoom = async () => {
    if (!roomCode) return;
    const success = await copyTextToClipboard(roomCode);
    if (success) {
      setCopiedRoomCode(true);
      setTimeout(() => setCopiedRoomCode(false), 2000);
    }
  };

  const safeOpenUrl = (url: string) => {
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const text = roomCode
      ? `Ayo balapan bareng aku di Escape Police! Masuk ke room: ${roomCode}\nKlik link: ${publicUrl}`
      : `Ayo main game balap liar Escape Police bareng aku secara real-time!\nKlik link: ${publicUrl}`;
    safeOpenUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  };

  const handleTelegramShare = () => {
    const text = roomCode
      ? `Ayo balapan bareng aku di Escape Police! Masuk ke room: ${roomCode}`
      : `Ayo main game balap liar Escape Police bareng aku secara real-time!`;
    safeOpenUrl(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0b0c1a] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-transparent to-fuchsia-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-black text-white tracking-wide flex items-center gap-1.5">
                Bagikan & Main Bersama
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans font-bold uppercase">
                  Publik
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Akses instan dari HP, tablet, laptop, atau komputer tanpa install aplikasi!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4.5 overflow-y-auto">
          {/* Room Code Card (If in room) */}
          {roomCode && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-transparent border border-cyan-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-cyan-300">
                  Kode Room Aktif Kamu
                </span>
                <div className="text-2xl font-display font-black text-white tracking-widest mt-0.5">
                  {roomCode}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyRoom}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                {copiedRoomCode ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRoomCode ? 'Disalin!' : 'Salin Kode'}</span>
              </button>
            </div>
          )}

          {/* Public Link Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{roomCode ? 'Link Undangan Langsung ke Room' : 'Link Publik Game'}</span>
            </label>
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-2 focus-within:border-cyan-500/60 transition-colors">
              <input
                type="text"
                readOnly
                value={publicUrl}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent text-xs text-cyan-300 font-mono focus:outline-none px-1 selection:bg-cyan-500 selection:text-black"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
            <p className="text-[10.5px] text-gray-500 leading-relaxed">
              Kirim tautan ini ke teman. Saat dibuka di browser manapun, mereka akan langsung masuk ke game
              {roomCode ? ` dan otomatis bergabung ke room ${roomCode}` : ''}!
            </p>
          </div>

          {/* Quick Share to Social Apps */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Bagikan Langsung:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-display font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 font-display font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* Guide for Page Not Found (404) */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-left">
            <div className="flex items-center gap-2 text-amber-300 font-display font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Cara Mengaktifkan Link Publik (Jika Masih Muncul "Page Not Found"):</span>
            </div>
            <ol className="text-[11px] text-gray-300 space-y-1 list-decimal list-inside pl-0.5 leading-relaxed">
              <li>Lihat ke <strong>pojok kanan atas antarmuka Google AI Studio</strong> Anda.</li>
              <li>Klik tombol <strong>"Share"</strong> (di sebelah tombol Run/Pengaturan).</li>
              <li>Pilih <strong>"Anyone with the link can view"</strong> lalu klik <strong>"Publish"</strong> atau <strong>"Update"</strong>.</li>
              <li>Tunggu beberapa detik. Link publik <code>{PUBLIC_APP_URL}</code> akan langsung aktif dan bisa dibuka oleh siapapun tanpa login!</li>
            </ol>
          </div>

          {/* Multi-Device Feature Highlights */}
          <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
            <div className="text-[11px] font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dukungan Multi-Perangkat Real-Time</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10.5px] text-gray-400 pt-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>HP Android & iPhone (Sentuh layar)</span>
              </div>
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>PC & Laptop (Keyboard A/D & Panah)</span>
              </div>
            </div>
          </div>

          {/* Open in new tab link */}
          <div className="text-center pt-1">
            <a
              href={rawBaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium transition-colors"
            >
              <span>Buka Game di Tab Browser Baru (Layar Penuh)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Server WebSocket Aktif & Siap Duel
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-display font-bold text-xs uppercase transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
