import React from 'react';
import { sound } from '../../services';

export const DEFAULT_TITLES = [
  'CYBER ACE',
  'DRIFT MASTER',
  'ROAD WARRIOR',
  'SPEED DEMON',
  'NITRO EMPEROR',
  'STREET PHANTOM',
  'MAXXX OVERLORD',
  'OUTLAW KING',
];

export interface TitleBadgeListProps {
  titles?: string[];
  selectedTitle: string;
  unlockedTitles?: string[];
  onSelectTitle: (title: string) => void;
}

export const TitleBadgeList: React.FC<TitleBadgeListProps> = ({
  titles = DEFAULT_TITLES,
  selectedTitle,
  unlockedTitles,
  onSelectTitle,
}) => {
  return (
    <div className="w-full select-none">
      <div className="grid grid-cols-2 gap-1.5">
        {titles.map(title => {
          const isSelected = selectedTitle.toUpperCase() === title.toUpperCase();
          const isUnlocked = !unlockedTitles || unlockedTitles.includes(title);

          return (
            <button
              key={title}
              type="button"
              onClick={() => {
                sound.play('click');
                onSelectTitle(title);
              }}
              className={`w-full py-1.5 px-2 rounded-full text-center text-[10px] sm:text-[10.5px] font-display transition-all duration-200 cursor-pointer truncate ${
                isSelected
                  ? 'bg-[#ffb703] text-black font-black shadow-[0_0_12px_rgba(255,183,3,0.7)] scale-[1.02] border border-[#ffb703]'
                  : isUnlocked
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/20 text-gray-300 hover:text-white font-bold'
                  : 'bg-transparent border border-gray-700/60 text-gray-500 cursor-not-allowed opacity-50'
              }`}
              title={title}
            >
              {title}
            </button>
          );
        })}
      </div>
    </div>
  );
};
