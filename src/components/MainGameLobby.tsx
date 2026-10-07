import React from 'react';
import { UserProfile, DifficultyLevel, GameMapId, getMapData } from '../types';
import { getCarModel } from '../services';
import { InteractiveSelector, DifficultyId } from './ui/interactive-selector';

interface MainGameLobbyProps {
  user: UserProfile | null;
  difficulty: DifficultyLevel;
  onChangeDifficulty: (difficulty: DifficultyLevel) => void;
  onStartGame: () => void;
  onOpenGarage?: () => void;
  onOpenPoliceFleet?: () => void;
  selectedMapId?: GameMapId;
  onSelectMap?: (mapId: GameMapId) => void;
  onOpenMapSelect?: () => void;
}

export const MainGameLobby: React.FC<MainGameLobbyProps> = ({
  user,
  difficulty,
  onChangeDifficulty,
  onStartGame,
  onOpenGarage,
  onOpenPoliceFleet,
  selectedMapId = 'kota',
  onSelectMap,
  onOpenMapSelect,
}) => {
  const currentCar = getCarModel(user?.carModel || 'civic_fl5');
  const currentMap = getMapData(selectedMapId);

  // Convert game DifficultyLevel to InteractiveSelector DifficultyId
  const mapDifficultyToId = (lvl: DifficultyLevel): DifficultyId => {
    switch (lvl) {
      case 'EASY':
        return 'santai';
      case 'NORMAL':
        return 'normal';
      case 'HARD':
        return 'sulit';
      case 'MAXXX':
        return 'maxxx';
      default:
        return 'normal';
    }
  };

  const mapIdToDifficulty = (id: DifficultyId): DifficultyLevel => {
    switch (id) {
      case 'santai':
        return 'EASY';
      case 'normal':
        return 'NORMAL';
      case 'sulit':
        return 'HARD';
      case 'maxxx':
        return 'MAXXX';
      default:
        return 'NORMAL';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 overflow-y-auto select-none">
      {/* 1. DYNAMIC THEMED MAP BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-[#060812]">
        <img
          key={selectedMapId}
          src={currentMap.backgroundImage || "/maps/kota.jpg"}
          alt={currentMap.name}
          className="w-full h-full object-cover object-center filter brightness-90 contrast-[1.05] opacity-85 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] animate-fadeIn"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Vignette Gradient for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070814]/80 via-[#070814]/40 to-[#070814]/90 pointer-events-none" />
      </div>

      {/* 2. HERO CARD CONTAINER WITH ACCORDION INTERACTIVE SELECTOR */}
      <div
        className="relative z-10 w-full max-w-4xl my-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-cyan-500/25 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_35px_rgba(0,229,255,0.18)] bg-[#080b15]/92 backdrop-blur-2xl"
      >
        <InteractiveSelector
          selectedMapId={selectedMapId}
          onSelectMap={(mapId) => {
            onSelectMap?.(mapId);
          }}
          defaultDifficulty={mapDifficultyToId(difficulty)}
          onDifficultyChange={(id) => {
            onChangeDifficulty(mapIdToDifficulty(id));
          }}
          carName={currentCar.shortName}
          carHp={currentCar.hp}
          fleetCount={20}
          onChangeCar={onOpenGarage}
          onStart={(diffId, mapId) => {
            onChangeDifficulty(mapIdToDifficulty(diffId));
            onSelectMap?.(mapId);
            onStartGame();
          }}
          onOpenFleet={onOpenPoliceFleet}
          initialMode="map"
        />
      </div>
    </div>
  );
};
export default MainGameLobby;
