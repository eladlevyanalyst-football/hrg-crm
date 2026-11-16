export type Profile = { id: string; full_name: string; role: string; job_title: string | null };
export type Player = {
  id: string; full_name: string; shirt_number: number | null; position: string | null;
  birth_date: string | null; nationality: string | null; phone: string | null; email: string | null;
  height_cm: number | null; weight_kg: number | null; foot: string | null; contract_until: string | null;
  agent: string | null; notes: string | null; photo_url: string | null; active: boolean;
  availability: string | null; injury_note: string | null;
};
export type Match = {
  id: string; round: string | null; opponent: string; match_date: string | null; home: boolean;
  competition: string | null; goals_for: number | null; goals_against: number | null; notes: string | null;
};
export type MatchFile = {
  id: string; match_id: string; category: string; title: string; storage_path: string | null;
  external_url: string | null; player_id: string | null; uploaded_by: string | null; created_at: string;
};
export type EventRow = {
  id: string; title: string; kind: string; starts_at: string; ends_at: string | null;
  location: string | null; notes: string | null; match_id: string | null;
};
export type Task = {
  id: string; title: string; description: string | null; assignee_id: string | null; due_date: string | null;
  status: string; priority: string; match_id: string | null; created_by: string | null;
};
export type Wellness = {
  id: string; player_id: string; entry_date: string; sleep_hours: number | null; sleep_quality: number | null;
  fatigue: number | null; soreness: number | null; stress: number | null; mood: number | null; notes: string | null;
};
export type Rpe = {
  id: string; player_id: string; entry_date: string; session_type: string; rpe: number;
  duration_min: number; load: number; notes: string | null;
};
export type DataImport = {
  id: string; source: string; title: string; data_date: string | null; match_id: string | null;
  columns: string[]; rows: Record<string, string | number | null>[]; created_at: string;
};
export type ScoutList = { id: string; name: string; description: string | null };
export type ScoutPlayer = {
  id: string; list_id: string | null; full_name: string; club: string | null; position: string | null;
  birth_year: number | null; nationality: string | null; foot: string | null; agent: string | null;
  status: string; rating: number | null; video_url: string | null; notes: string | null;
};
export type ScoutReport = {
  id: string; scouting_player_id: string; author_id: string | null; match_watched: string | null;
  report_date: string | null; rating: number | null; body: string | null; storage_path: string | null;
};
export type Slot = { x: number; y: number; label: string; player_id: string | null };
export type Lineup = {
  id: string; name: string; formation: string; slots: Slot[]; bench: string[]; match_id: string | null;
};
