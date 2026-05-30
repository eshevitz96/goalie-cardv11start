export type SportType = 'Hockey' | 'Mens Lacrosse' | 'Womens Lacrosse' | 'Soccer' | 'Field Hockey';

export interface Point {
  x: number;
  y: number;
}

export interface Clip {
  id: string;
  name: string;
  size: number;
  url: string;
  file: File | null;
  deletedAt?: number;
}

export type ShotTypeType = 
  | 'Wrist' | 'Slap' | 'Snap' | 'Backhand' | 'Tip-in' // Hockey
  | 'Overhand' | 'Sidearm' | 'Underhand' | 'BTB'      // Lacrosse
  | 'Instep' | 'Inside foot' | 'Outside foot' | 'Header' | 'Volley' // Soccer
  | 'Push' | 'Hit' | 'Flick' | 'Scoop' | 'Slap'      // Field Hockey
  | 'Other';

export interface Shot {
  id: string;
  clipId: string;
  timestamp: number;
  period: string;
  shotType: ShotTypeType;
  isDeflected: boolean;
  isScreened: boolean;
  isSave: boolean;
  netLocation: Point | null;
  rinkLocation: Point | null;
  videoTime?: number;
}

export interface GameReport {
  id: string;
  title: string;
  date: string;
  clips: Clip[];
  shots: Shot[];
  sport?: SportType;
}

export type NavTab = 'library' | 'workspace' | 'report';
