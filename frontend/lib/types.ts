export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
export type LicenseCategory = 'A' | 'B' | 'C' | 'D' | 'BE' | 'CE';
export type LessonStatus = 'REZERVUAR' | 'PERFUNDUAR' | 'ANULUAR' | 'MUNGESE';
export type QuizCategory = 'SHENJA_RRUGORE' | 'RREGULLA' | 'SIGURIA' | 'PARKIMI' | 'PERPARESIA';

export const QUIZ_CATEGORY_LABELS: Record<QuizCategory, string> = {
  SHENJA_RRUGORE: 'Shenja Rrugore',
  RREGULLA: 'Rregulla',
  SIGURIA: 'Siguria',
  PARKIMI: 'Parkimi',
  PERPARESIA: 'Përparësia',
};

export interface AuthUser {
  id: string;
  emri: string;
  email: string;
  role: Role;
  studentId?: string;
  instructorId?: string;
}

export interface AvailabilitySlot {
  id: string;
  instructorId: string;
  data: string;
  oraFillimit: string;
  oraMbarimit: string;
  iZene: boolean;
}

export interface InstructorSummary {
  id: string;
  specializimi: LicenseCategory[];
  user: { id: string; emri: string; email: string };
}

export interface DrivingLesson {
  id: string;
  studentId: string;
  instructorId: string;
  data: string;
  oraFillimit: string;
  oraMbarimit: string;
  statusi: LessonStatus;
  instructor?: { user: { emri: string } };
  student?: { user: { emri: string } };
}

export interface StudentProgress {
  student: { id: string; emri: string; kategoria: LicenseCategory; statusi: string };
  ore: { kryera: number; minimumi: number; perqindja: number };
  aftesite: { skillCategoryId: string; emri: string; mesatarja: number }[];
  quizMeMireRezultat: { rezultati: number; data: string; iKaluar: boolean } | null;
  gatishmeria: 'JESHIL' | 'VERDHE' | 'KUQ';
}

export interface QuizQuestion {
  id: string;
  teksti: string;
  kategoria: QuizCategory;
  imazhi?: string | null;
  veshtiresia: 'LEHTE' | 'MESATARE' | 'VESHTIRE';
  answers: { id: string; teksti: string }[];
}

export interface QuizGenerateResponse {
  questions: QuizQuestion[];
  timeLimitMinutes: number;
  passThreshold: number;
}

export interface QuizSubmitResponse {
  attemptId: string;
  rezultati: number;
  iKaluar: boolean;
  saktesia: string;
  breakdown: { questionId: string; eSakte: boolean; correctAnswerId?: string; answerId: string | null }[];
}
