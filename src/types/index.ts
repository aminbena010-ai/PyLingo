export type Stage = 'theory' | 'challenge';

export type ChallengeKind = 'code' | 'choice' | 'arrange' | 'debug';
export type ChallengeDifficulty = 'basico' | 'intermedio' | 'avanzado';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type DashboardSection = 'map' | 'stats' | 'missions' | 'session' | 'profile';

export interface LessonContent {
  objective: string;
  theory: string[];
  example: string;
  realWorldUse: string;
}

export interface Challenge {
  id: number;
  kind: ChallengeKind;
  difficulty: ChallengeDifficulty;
  skillTag: string;
  realContext: string;
  xpReward: number;
  microTheory: string;
  prompt: string;
  targetCode: string;
  hint: string;
  starterCode?: string;
  choices?: string[];
  fragments?: string[];
  buggyCode?: string;
}

export interface LearningLevel {
  id: number;
  unit: number;
  title: string;
  lesson: LessonContent;
  challenges: Challenge[];
}

export interface UserProfile {
  fullName: string;
  username: string;
  dailyGoalMinutes: number;
  experience: ExperienceLevel;
  placementScore: number;
  joinedAt: string;
}

export interface PersistentProgress {
  currentLevelIdx: number;
  hearts: number;
  xp: number;
  streak: number;
  adrenaline: number;
  lastStudyDate: string;
  unlockedLevelIds: number[];
  completedLevelIds: number[];
  lessonQuestionProgress: Record<string, number>;
}

