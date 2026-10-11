import React from 'react';
import { Check } from 'lucide-react';
import { sound } from '../../services';

export interface ColorItem {
  id: string;
  name: string;
  hex: string;
  oem?: string;
}

export const DEFAULT_COLOR_SWATCHES: ColorItem[] = [
  { id: 'white', name: 'Championship White', hex: '#ffffff', oem: 'White' },
  { id: 'blue', name: 'Bayside Blue', hex: '#0284c7', oem: 'Blue' },
  { id: 'red', name: 'Rosso Corsa', hex: '#dc2626', oem: 'Red' },
  { id: 'grey', name: 'Grigio Telesto', hex: '#475569', oem: 'Grey' },
  { id: 'cyan', name: 'Cyan Volt', hex: '#00f0ff', oem: 'Cyan' },
  { id: 'pink', name: 'Hot Magenta', hex: '#ff2d6b', oem: 'Pink' },
  { id: 'purple', name: 'Electric Violet', hex: '#7c5cff', oem: 'Purple' },
  { id: 'green', name: 'Neon Emerald', hex: '#06ffa5', oem: 'Green' },
];

export interface ColorSwatchPickerProps {
  colors?: ColorItem[];
  selectedColor: string;
  onSelectColor: (hex: string) => void;
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  colors = DEFAULT_COLOR_SWATCHES,
  selectedColor,
  onSelectColor,
}) => {
  return (
    <div className="w-full select-none">
      {/* 8-Color Grid (Clean 8 columns) */}
      <div className="grid grid-cols-8 gap-2 items-center justify-items-center">
        {colors.map(item => {
          const isSelected = selectedColor.toLowerCase() === item.hex.toLowerCase();

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sound.play('click');
                onSelectColor(item.hex);
              }}
              className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center p-0.5 ${
                isSelected
                  ? 'ring-3 ring-[#ffb703] ring-offset-2 ring-offset-[#070814] scale-110 shadow-[0_0_15px_rgba(255,183,3,0.7)] z-10'
                  : 'hover:scale-105 border border-white/20 hover:border-white/60 opacity-90 hover:opacity-100'
              }`}
              style={{
                backgroundColor: item.hex,
                boxShadow: isSelected
                  ? `0 0 14px ${item.hex}88, inset 0 0 6px rgba(0,0,0,0.4)`
                  : `0 0 4px ${item.hex}33`,
              }}
              title={`${item.name} (${item.hex})`}
            >
              {/* Glossy top specular reflection highlight */}
              <span className="absolute top-0.5 left-1.5 right-1.5 h-2 rounded-full bg-white/40 blur-[0.5px] pointer-events-none" />

              {/* Active Golden Checkmark in Center */}
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 text-[#ffb703] stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Color Name Readout */}
      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px]">
        <span className="text-gray-400 font-medium">Cat Aktif:</span>
        <span className="font-mono font-bold text-cyan-300">
          {colors.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || selectedColor}
        </span>
      </div>
    </div>
  );
};
