/** Mirrors the backend's /api/v1/me contract (ambrace-backend/app/schemas/profile.py). */

export const BOARDS = ["CBSE", "ICSE", "STATE_BOARD", "OTHER"] as const;
export type Board = (typeof BOARDS)[number];

export const BOARD_LABELS: Record<Board, string> = {
  CBSE: "CBSE",
  ICSE: "ICSE",
  STATE_BOARD: "State board",
  OTHER: "Other",
};

export const MIN_CLASS_LEVEL = 5;
export const MAX_CLASS_LEVEL = 12;
export const CLASS_LEVELS = Array.from(
  { length: MAX_CLASS_LEVEL - MIN_CLASS_LEVEL + 1 },
  (_, index) => MIN_CLASS_LEVEL + index,
);

export type Profile = {
  name: string;
  class_level: number;
  board: Board | null;
  school_name: string | null;
  school_address: string | null;
  created_at: string;
  updated_at: string;
};

/** What the student can set. Only the name and the class are required. */
export type ProfileUpdate = {
  name: string;
  class_level: number;
  board?: Board | null;
  school_name?: string | null;
  school_address?: string | null;
};

export type Me = {
  user_id: string;
  onboarding_complete: boolean;
  profile: Profile | null;
};
