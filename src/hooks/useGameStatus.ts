import { useEffect, useMemo, useState } from 'react';
import type { PersistentProgress } from '../types';
import { STORAGE_KEYS } from '../config/storageKeys';

const STORAGE_KEY = STORAGE_KEYS.progress;
const INITIAL_HEARTS = 5;

const todayIso = () => new Date().toISOString().slice(0, 10);

const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const defaultState: PersistentProgress = {
  currentLevelIdx: 0,
  hearts: INITIAL_HEARTS,
  xp: 0,
  streak: 0,
  adrenaline: 0,
  lastStudyDate: '',
  unlockedLevelIds: [1],
  completedLevelIds: [],
  lessonQuestionProgress: {}
};

const sanitizeLevelIds = (ids: number[] | undefined, totalLevels: number) =>
  (ids ?? []).filter((id) => Number.isInteger(id) && id >= 1 && id <= totalLevels);

const loadState = (totalLevels: number): PersistentProgress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<PersistentProgress>;
    const unlocked = sanitizeLevelIds(parsed.unlockedLevelIds, totalLevels);
    const completed = sanitizeLevelIds(parsed.completedLevelIds, totalLevels);
    const safeCurrentLevelIdx = Math.max(
      0,
      Math.min(totalLevels - 1, parsed.currentLevelIdx ?? defaultState.currentLevelIdx)
    );

    return {
      ...defaultState,
      ...parsed,
      adrenaline: Math.max(0, Math.min(100, parsed.adrenaline ?? defaultState.adrenaline)),
      currentLevelIdx: safeCurrentLevelIdx,
      unlockedLevelIds: unlocked.length ? unlocked : [1],
      completedLevelIds: completed,
      lessonQuestionProgress: parsed.lessonQuestionProgress ?? {}
    };
  } catch {
    return defaultState;
  }
};

export const useGameStatus = (totalLevels: number) => {
  const [state, setState] = useState<PersistentProgress>(() => loadState(totalLevels));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const isGameOver = state.hearts <= 0;

  const progressPercent = useMemo(
    () => Math.min(100, Math.round((state.completedLevelIds.length / totalLevels) * 100)),
    [state.completedLevelIds.length, totalLevels]
  );

  const addXp = (amount: number) => {
    setState((prev) => ({ ...prev, xp: prev.xp + amount }));
  };

  const gainAdrenaline = (amount: number) => {
    if (amount <= 0) return;
    setState((prev) => ({ ...prev, adrenaline: Math.min(100, prev.adrenaline + amount) }));
  };

  const spendAdrenaline = (amount: number) => {
    if (amount <= 0) return;
    setState((prev) => {
      if (prev.adrenaline < amount) return prev;
      return { ...prev, adrenaline: prev.adrenaline - amount };
    });
  };

  const loseHeart = () => {
    setState((prev) => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) }));
  };

  const updateLessonQuestionProgress = (levelId: number, solvedCount: number) => {
    setState((prev) => {
      const key = String(levelId);
      const current = prev.lessonQuestionProgress[key] ?? 0;
      if (solvedCount <= current) return prev;

      return {
        ...prev,
        lessonQuestionProgress: {
          ...prev.lessonQuestionProgress,
          [key]: solvedCount
        }
      };
    });
  };

  const completeLevel = (levelId: number, levelIdx: number, questionCount: number) => {
    setState((prev) => {
      const completed = prev.completedLevelIds.includes(levelId)
        ? prev.completedLevelIds
        : [...prev.completedLevelIds, levelId];

      const nextLevelId = levelId + 1;
      const unlocked =
        nextLevelId <= totalLevels && !prev.unlockedLevelIds.includes(nextLevelId)
          ? [...prev.unlockedLevelIds, nextLevelId]
          : prev.unlockedLevelIds;

      const today = todayIso();
      const alreadyStudiedToday = prev.lastStudyDate === today;
      const nextStreak = alreadyStudiedToday
        ? prev.streak
        : prev.lastStudyDate === yesterdayIso()
          ? prev.streak + 1
          : 1;

      return {
        ...prev,
        xp: prev.xp + 20,
        adrenaline: Math.min(100, prev.adrenaline + 10),
        streak: nextStreak,
        lastStudyDate: today,
        completedLevelIds: completed,
        unlockedLevelIds: unlocked,
        currentLevelIdx: Math.max(prev.currentLevelIdx, levelIdx),
        lessonQuestionProgress: {
          ...prev.lessonQuestionProgress,
          [String(levelId)]: questionCount
        }
      };
    });
  };

  const initializePlacement = (startLevelIdx: number) => {
    const clamped = Math.max(0, Math.min(totalLevels - 1, startLevelIdx));
    const unlocked = Array.from({ length: clamped + 1 }, (_, i) => i + 1);

    setState((prev) => {
      if (prev.xp > 0 || prev.completedLevelIds.length > 0) {
        return prev;
      }

      return {
        ...prev,
        currentLevelIdx: clamped,
        unlockedLevelIds: unlocked
      };
    });
  };

  const setCurrentLevelIdx = (idx: number) => {
    setState((prev) => ({ ...prev, currentLevelIdx: idx }));
  };

  const restoreHearts = () => {
    setState((prev) => ({ ...prev, hearts: INITIAL_HEARTS }));
  };

  const resetAllProgress = () => {
    setState(defaultState);
  };

  return {
    ...state,
    isGameOver,
    progressPercent,
    addXp,
    gainAdrenaline,
    spendAdrenaline,
    loseHeart,
    updateLessonQuestionProgress,
    completeLevel,
    initializePlacement,
    setCurrentLevelIdx,
    restoreHearts,
    resetAllProgress
  };
};
