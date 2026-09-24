export type DifficultyLevel = 'EASY' | 'NORMAL' | 'HARD' | 'MAXXX';

export type ActiveTab = 'game' | 'multiplayer' | 'leaderboard' | 'garage' | 'tournaments' | 'analytics' | 'achievements' | 'maps';

export interface UserStats {
  highScore: number;
  gamesPlayed: number;
  totalDistance: number;
  obstaclesDodged: number;
  powerUpsCollected: number;
  bestCombo: number;
  totalBounty: number;
  maxLevel: number;
  bossKills: number;
  nearMisses: number;
  empUsed: number;
  multiplayerWins: number;
  multiplayerMatches: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string; // icon identifier or emoji
  title: string;
  carColor: string; // hex
  carModel:
    | 'civic_fl5'
    | 'toyota_supra'
    | 'nissan_gtr'
    | 'bmw_m4_gt3'
    | 'lamborghini_aventador'
    | 'porsche_911'
    | 'rx7_fd'
    | 'mustang_gt500'
    | 'hunter'
    | 'phantom'
    | 'cruiser'
    | 'vortex'
    | string;
  trailEffect: 'none' | 'cyan_plasma' | 'magenta_laser' | 'amber_sparks';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  biometricEnabled: boolean;
  stats: UserStats;
  achievements: string[];
  createdAt: string;
  lastActive: string;
  layoutSettings: {
    hudPosition: 'top' | 'compact' | 'minimal';
    controlsStyle: 'buttons' | 'dpad' | 'split';
    screenShake: boolean;
    scanlines: boolean;
    soundEnabled: boolean;
  };
  notificationSettings: {
    friendScores: boolean;
    tournaments: boolean;
    pushEnabled: boolean;
    dailyMissions: boolean;
  };
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  title: string;
  carColor: string;
  score: number;
  distance: number;
  bestCombo: number;
  difficulty: DifficultyLevel;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'score_beaten' | 'friend_activity' | 'tournament_alert' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  tier: 'ROOKIE' | 'ELITE' | 'CYBER_LEGEND';
  startTime: string;
  endTime: string;
  prizeBounty: number;
  participantsCount: number;
  isRegistered?: boolean;
}

export interface MultiplayerPlayerState {
  id: string;
  username: string;
  avatar: string;
  carColor: string;
  carModel: string;
  x: number;
  y: number;
  speed?: number;
  distance?: number;
  lap?: number;
  steer?: number; // -1: kiri, 0: lurus, 1: kanan
  gas?: boolean;
  brake?: boolean;
  nitro?: boolean;
  score: number;
  hp: number;
  combo: number;
  ping?: number;
  status: 'ready' | 'waiting' | 'countdown' | 'playing' | 'crashed' | 'finished';
  isHost: boolean;
}

export interface MultiplayerRoom {
  code: string;
  name: string;
  status: 'waiting' | 'starting' | 'countdown' | 'in_game' | 'finished';
  difficulty: DifficultyLevel;
  players: Record<string, MultiplayerPlayerState>;
  countdownSeconds?: number;
  targetDistance?: number;
  winnerId?: string;
  createdAt: number;
}

export interface AnalyticsData {
  dailyScores: { date: string; avgScore: number; maxScore: number; games: number }[];
  heatmapByHour: { hour: number; count: number }[];
  performanceMetrics: {
    dodgeRate: number; // percentage
    grazeAccuracy: number;
    avgSurvivalDistance: number;
    multiplayerWinRate: number;
  };
  summary: {
    totalPlayTimeMinutes: number;
    totalRuns: number;
    highestBounty: number;
    topDifficulty: string;
  };
}
