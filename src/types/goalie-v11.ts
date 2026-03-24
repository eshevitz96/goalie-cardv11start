export type SupportedSport = 'hockey' | 'soccer' | 'lacrosse-boys' | 'lacrosse-girls' | 'lacrosse-box';
export type ContentType = 'game' | 'film' | 'mental' | 'physical' | 'stats_logging';
export type EnergyLevel = 'high' | 'low' | 'neutral';
export type TargetEvent = 'pre-game' | 'post-game' | 'off-day' | 'any';

export interface GoalieCardContent {
  id: string;
  title: string;
  type: ContentType;
  category: string;
  description: string;
  durationMinutes: number;
  energyLevel: EnergyLevel;
  targetEvent: TargetEvent;
  thumbnailUrl: string;
  icon: string;
  actionUrl: string;
  currentScore?: number;
  matchScore?: number;
}

export interface GoalieContext {
  userId: string;
  sport: SupportedSport;
  schedule: {
    nextEventDate: Date;
    nextEventType: 'game' | 'practice' | 'none';
    lastEventDate: Date;
    seasonPhase: 'pre-season' | 'in-season' | 'playoffs' | 'off-season';
  };
  readiness: {
    sorenessLevel: number;
    sleepQuality: number;
  };
  priorities: string[];
  struggles: string[];
  lastCompleted: Record<ContentType, string>; // ISO string dates
  pendingCoachFeedbackCount: number;
  unchartedVideosCount: number;
}

export type ShotResult = 'save' | 'goal' | 'miss' | 'blocked' | 'pipe' | 'penalty-shot' | 'empty-net';
export type ShotType = 'wrist' | 'snap' | 'slap' | 'backhand' | 'deflection' | 'wrap-around' | 'overhand' | 'sidearm' | 'underhand' | 'bounce' | 'behind-back' | 'unspecified' | 'standard';

export interface ShotEvent {
  id: string;
  gameId: string;
  sport: SupportedSport;
  period: number;
  time?: string;
  shooterNumber?: string;
  result: ShotResult;
  shotType: ShotType;
  originX: number; // 0-100
  originY: number; // 0-100
  targetX?: number; // -1 to 1
  targetY?: number; // 0 to 1
  isShorthanded: boolean;
  isPowerPlay: boolean;
  hasTraffic: boolean;
  isOddManRush: boolean;
  clipStart?: number;
  clipEnd?: number;
  filmUrl?: string;
}

export interface GameStatsLog {
  gameId: string;
  date: string;
  opponent: string;
  shots: ShotEvent[];
  totalShots: number;
  totalSaves: number;
  savePercentage: number;
  goalsAgainst: number;
}

export interface ActivityLogEntry {
  id: string;
  date: string;
  activity: string;
  detail: string;
  type: 'game' | 'training' | 'film' | 'recovery';
}

export interface TrainingPlan {
  currentProgress: number; // 0-100
  nextSession: string;
  timeRemaining: string;
}

export interface TeamScheduleEntry {
  id: string;
  type: 'practice' | 'game' | 'off';
  title: string;
  time: string;
}

export interface VideoSession {
  id: string;
  title: string;
  videoUrl: string;
  uploadedDate: string;
  isCharted: boolean;
  shotsPlotted: ShotEvent[];
}

export interface CoachFeedback {
  id: string;
  videoId: string;
  coachId: string;
  coachName: string;
  comment: string;
  timestamp?: string; // Specific video timestamp
  correctionDrills?: string[]; // IDs of recommended GoalieCardContent items
  isRead: boolean;
}

export interface GoalieCardV11ViewModel {
  headerTitle: string;
  readinessScore: number;
  sleepScore: number;
  nutritionStatus: {
    hydration: string;
    mealPlan: string;
  };
  recoveryStatus: 'Good' | 'Needs Attention' | 'Recovery Day';
  heroAction: GoalieCardContent;
  exploreGrid: GoalieCardContent[];
  recentGameSummary?: GameStatsLog;
  activityLog: ActivityLogEntry[];
  trainingPlan: TrainingPlan;
  teamSchedule: TeamScheduleEntry[];
  goalieId: string;
  seasonSavePercentage: number;
  seasonGamesPlayed: number;
  seasonWins: number;
  seasonSO: number;
  seasonGAA: number;
}
