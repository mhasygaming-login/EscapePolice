import React from 'react';
import { sound } from '../../services';

export const DEFAULT_AVATARS = [
  '⛑️', '⚡', '💀', '👑', '🤖', '🕶️',
  '🏎️', '👾', '🔥', '🚀', '💎', '🦾',
];

export interface AvatarGridProps {
  avatars?: string[];
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
}

export const AvatarGrid: React.FC<AvatarGridProps> = ({
  avatars = DEFAULT_AVATARS,
  selectedAvatar,
  onSelectAvatar,
}) => {
  return (
    <div className="w-full select-none">
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2 items-center justify-items-center">
        {avatars.map((emoji, idx) => {
          const isSelected = selectedAvatar === emoji;

          return (
            <button
              key={`${emoji}-${idx}`}
              type="button"
              onClick={() => {
                sound.play('click');
                onSelectAvatar(emoji);
              }}
              className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center text-base sm:text-lg transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#00f0ff] bg-[#00f0ff]/20 shadow-[0_0_12px_rgba(0,240,255,0.7)] scale-105 z-10'
                  : 'bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/30 opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              title={`Pilih Avatar ${emoji}`}
            >
              <span>{emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
