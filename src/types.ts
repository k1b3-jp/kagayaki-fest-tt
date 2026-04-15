
export interface Slot {
  id: string;
  group: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  stage: string;
  day: '18' | '19';
  benefitStart?: string;
  benefitEnd?: string;
  benefitLocation?: string;
}

export interface AppState {
  favorites: string[]; // Slot IDs
  notes: Record<string, string>; // Slot ID -> Note
  oshi: string | null; // Group name
}
