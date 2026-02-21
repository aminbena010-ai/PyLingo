import { useEffect, useMemo, useRef, useState } from 'react';
import { pythonLevels } from './data/levels';
import { useGameStatus } from './hooks/useGameStatus';
import { ProgressBar } from './components/ProgressBar';
import { CodeEditor } from './components/CodeEditor';
import { FeedbackBanner } from './components/FeedbackBanner';
import { LevelMap } from './components/LevelMap';
import { DesktopShell, type DashboardTabConfig } from './components/DesktopShell';
import { MobileShell } from './components/MobileShell';
import {
  BookIcon,
  ChartIcon,
  MapIcon,
  PlayIcon,
  PuzzleIcon,
  TargetIcon,
  TrophyIcon,
  UserIcon
} from './components/Icons';
import { useIsMobile } from './hooks/useIsMobile';
import { normalizePythonCode, simulatePython } from './utils/pythonSimulator';
import { STORAGE_KEYS } from './config/storageKeys';
import type { Challenge, DashboardSection, ExperienceLevel, Stage, UserProfile } from './types';
import logo from './assets/images/logo.png';

const PROFILE_KEY = STORAGE_KEYS.profile;
const USAGE_STREAK_KEY = STORAGE_KEYS.usageStreak;
const PROGRESS_KEY = STORAGE_KEYS.progress;

type PlacementQuestion = {
  id: number;
  question: string;
  options: string[];
  correct: string;
};

const placementQuestions: PlacementQuestion[] = [
  {
    id: 1,
    question: 'Cual asignacion es correcta en Python?',
    options: ['edad = 25', 'edad == 25', 'int edad = 25'],
    correct: 'edad = 25'
  },
  {
    id: 2,
    question: 'Cual es una lista valida?',
    options: ['usuarios = ["ana", "luis"]', 'usuarios = ("ana", "luis")', 'usuarios = {"ana", "luis"}'],
    correct: 'usuarios = ["ana", "luis"]'
  },
  {
    id: 3,
    question: 'Cual define una funcion?',
    options: ['func saludar():', 'def saludar():', 'function saludar()'],
    correct: 'def saludar():'
  },
  {
    id: 4,
    question: 'Cual condicion es valida?',
    options: ["if rol == 'admin':", "if rol = 'admin':", "if (rol === 'admin')"],
    correct: "if rol == 'admin':"
  },
  {
    id: 5,
    question: 'Cual bucle recorre una lista?',
    options: ['for item in items:', 'while item in items:', 'loop item in items:'],
    correct: 'for item in items:'
  }
];

const loadProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (
      typeof parsed.fullName !== 'string' ||
      typeof parsed.username !== 'string' ||
      typeof parsed.dailyGoalMinutes !== 'number' ||
      !parsed.experience ||
      typeof parsed.placementScore !== 'number' ||
      typeof parsed.joinedAt !== 'string'
    ) {
      return null;
    }

    return {
      fullName: parsed.fullName,
      username: parsed.username,
      dailyGoalMinutes: parsed.dailyGoalMinutes,
      experience: parsed.experience,
      placementScore: parsed.placementScore,
      joinedAt: parsed.joinedAt
    };
  } catch {
    return null;
  }
};

const experienceWeight: Record<ExperienceLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2
};

const isoDate = () => new Date().toISOString().slice(0, 10);

const yesterdayIsoDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const resolveUsageStreak = () => {
  try {
    const raw = localStorage.getItem(USAGE_STREAK_KEY);
    const today = isoDate();
    const yesterday = yesterdayIsoDate();

    if (!raw) {
      const initial = { streak: 1, lastOpenDate: today };
      localStorage.setItem(USAGE_STREAK_KEY, JSON.stringify(initial));
      return 1;
    }

    const parsed = JSON.parse(raw) as { streak?: number; lastOpenDate?: string };
    if (parsed.lastOpenDate === today) return parsed.streak ?? 1;

    const nextStreak = parsed.lastOpenDate === yesterday ? (parsed.streak ?? 0) + 1 : 1;
    localStorage.setItem(USAGE_STREAK_KEY, JSON.stringify({ streak: nextStreak, lastOpenDate: today }));
    return nextStreak;
  } catch {
    return 1;
  }
};

export default function App() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<'map' | 'playing'>('map');
  const [section, setSection] = useState<DashboardSection>('map');
  const [stage, setStage] = useState<Stage>('theory');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile());
  const [usageStreak] = useState(() => resolveUsageStreak());
  const [statsBoost, setStatsBoost] = useState(false);

  const [userInput, setUserInput] = useState('');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [arrangedFragments, setArrangedFragments] = useState<string[]>([]);
  const [combo, setCombo] = useState(0);
  const [adrenalineFeedback, setAdrenalineFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [runnerStdout, setRunnerStdout] = useState('');
  const [runnerStderr, setRunnerStderr] = useState('');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15);
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');
  const [placementAnswers, setPlacementAnswers] = useState<Record<number, string>>({});
  const [onboardingError, setOnboardingError] = useState('');
  const [dataOpsMessage, setDataOpsMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const {
    currentLevelIdx,
    hearts,
    xp,
    streak,
    adrenaline,
    unlockedLevelIds,
    completedLevelIds,
    lessonQuestionProgress,
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
  } = useGameStatus(pythonLevels.length);

  const currentLevel = pythonLevels[currentLevelIdx];
  const currentQuestion = currentLevel.challenges[questionIdx];
  const todayGoalXp = profile ? profile.dailyGoalMinutes * 2 : 30;
  const totalLessons = pythonLevels.length;
  const completedLessons = completedLevelIds.length;

  const accuracy = attempts === 0 ? 0 : Math.round((correctAnswers / attempts) * 100);

  const playerRank =
    xp >= 900 ? 'Leyenda' : xp >= 600 ? 'Experto' : xp >= 350 ? 'Avanzado' : xp >= 160 ? 'Intermedio' : 'Inicial';

  const missionLessonProgress = completedLessons > 0 ? 100 : 0;
  const missionXpProgress = Math.min(100, Math.round((xp / Math.max(1, todayGoalXp)) * 100));
  const missionStreakProgress = Math.min(100, Math.round((usageStreak / 7) * 100));
  const missionAdrenalineProgress = Math.min(100, adrenaline);
  const theoryChecklist = [
    `Aplica ${currentLevel.title.toLowerCase()} en un caso de ${currentQuestion.realContext.toLowerCase()}.`,
    `Mantiene sintaxis valida para un reto de tipo ${currentQuestion.kind}.`,
    `Objetivo del bloque: ${currentLevel.lesson.objective}`
  ];

  const achievements = [
    {
      id: 'first_steps',
      title: 'Primeros pasos',
      unlocked: completedLessons >= 1,
      description: 'Completa tu primera leccion'
    },
    {
      id: 'focus_coder',
      title: 'Codificador enfocado',
      unlocked: xp >= 250,
      description: 'Acumula 250 XP'
    },
    {
      id: 'streak_hero',
      title: 'Racha activa',
      unlocked: usageStreak >= 5,
      description: 'Manten 5 dias de uso seguidos'
    },
    {
      id: 'sharp_eye',
      title: 'Ojo de depuracion',
      unlocked: accuracy >= 80 && attempts >= 10,
      description: 'Alcanza 80% de precision'
    }
  ];
  const momentumScore = Math.min(100, Math.round((accuracy * 0.4) + (adrenaline * 0.35) + (Math.min(combo, 6) * 8)));
  const nextMilestoneXp = Math.ceil((xp + 1) / 100) * 100;
  const xpToMilestone = Math.max(0, nextMilestoneXp - xp);
  const completedAchievements = achievements.filter((item) => item.unlocked).length;

  useEffect(() => {
    if (!statsBoost) return;
    const timer = setTimeout(() => setStatsBoost(false), 1400);
    return () => clearTimeout(timer);
  }, [statsBoost]);

  const statCards = [
    {
      id: 'days',
      label: 'Dias',
      value: String(totalLessons),
      meta: `${completedLessons}/${totalLessons} completados`,
      percent: Math.round((completedLessons / Math.max(1, totalLessons)) * 100),
      tone: '#58cc02'
    },
    {
      id: 'xp',
      label: 'XP',
      value: String(xp),
      meta: `Objetivo global ${totalLessons * 20}`,
      percent: Math.min(100, Math.round((xp / Math.max(1, totalLessons * 20)) * 100)),
      tone: '#1cb0f6'
    },
    {
      id: 'streak',
      label: 'Racha',
      value: String(streak),
      meta: 'Meta semanal 7 dias',
      percent: Math.min(100, Math.round((streak / 7) * 100)),
      tone: '#ff9600'
    },
    {
      id: 'adrenaline',
      label: 'Adrenalina',
      value: `${adrenaline}%`,
      meta: 'Carga para proteger errores',
      percent: adrenaline,
      tone: '#f43f5e'
    },
    {
      id: 'accuracy',
      label: 'Precision',
      value: `${accuracy}%`,
      meta: 'Acierto acumulado',
      percent: accuracy,
      tone: '#8b5cf6'
    },
    {
      id: 'goal',
      label: 'Meta',
      value: `${profile?.dailyGoalMinutes ?? 15}m`,
      meta: 'Objetivo diario',
      percent: Math.min(100, Math.round(((profile?.dailyGoalMinutes ?? 15) / 40) * 100)),
      tone: '#ef4444'
    }
  ] as const;

  const dashboardTabs: DashboardTabConfig[] = [
    { key: 'map', label: 'Ruta', icon: <MapIcon className="tab-icon" /> },
    { key: 'stats', label: 'Estadisticas', icon: <ChartIcon className="tab-icon" /> },
    { key: 'missions', label: 'Misiones', icon: <TargetIcon className="tab-icon" /> },
    { key: 'session', label: 'Siguiente', icon: <PlayIcon className="tab-icon" /> },
    { key: 'profile', label: 'Perfil', icon: <UserIcon className="tab-icon" /> }
  ];

  const mobileDockTabs = dashboardTabs.slice(0, 4);

  const resolveStartQuestion = (levelId: number, total: number) => {
    const solved = lessonQuestionProgress[String(levelId)] ?? 0;
    if (solved >= total) return 0;
    return solved;
  };

  const resolveAdrenalineGain = (challenge: Challenge) => {
    const byDifficulty = challenge.difficulty === 'avanzado' ? 11 : challenge.difficulty === 'intermedio' ? 8 : 6;
    const byType = challenge.kind === 'debug' ? 4 : challenge.kind === 'code' ? 2 : 1;
    return byDifficulty + byType;
  };

  const resetChallengeState = (initialCode = '') => {
    setUserInput(initialCode);
    setSelectedChoice('');
    setArrangedFragments([]);
    setStatus('idle');
    setAdrenalineFeedback('');
    setRunnerStdout('');
    setRunnerStderr('');
  };

  const openLevel = (id: number) => {
    const level = pythonLevels[id - 1];
    setCurrentLevelIdx(id - 1);
    setQuestionIdx(resolveStartQuestion(id, level.challenges.length));
    setStage('theory');
    resetChallengeState();
    setView('playing');
  };

  const submittedCode = useMemo(() => {
    if (currentQuestion.kind === 'arrange') {
      return arrangedFragments.join(' ').trim();
    }
    if (currentQuestion.kind === 'choice') {
      return selectedChoice.trim();
    }

    const starter = currentQuestion.starterCode ?? '';
    const answer = userInput.trim();
    if (currentQuestion.kind === 'code' || currentQuestion.kind === 'debug') return answer;
    if (starter && currentQuestion.targetCode.startsWith(starter)) return `${starter}${answer}`.trim();
    return answer;
  }, [arrangedFragments, selectedChoice, userInput, currentQuestion]);

  const handleCheck = () => {
    setAttempts((prev) => prev + 1);
    const targetCode = currentQuestion.targetCode;
    const submitted = submittedCode;
    const normalizedTarget = normalizePythonCode(targetCode);
    const normalizedSubmitted = normalizePythonCode(submitted);

    let solved = false;
    if (currentQuestion.kind === 'choice' || currentQuestion.kind === 'arrange') {
      solved = normalizedSubmitted === normalizedTarget;
    } else {
      const submittedRun = simulatePython(submitted);
      const expectedRun = simulatePython(targetCode);
      setRunnerStdout(submittedRun.stdout);
      setRunnerStderr(submittedRun.stderr);

      if (!submittedRun.stderr && !expectedRun.stderr) {
        const sameOutput = submittedRun.stdout.trim() === expectedRun.stdout.trim();
        solved = sameOutput && (submittedRun.stdout.trim().length > 0 || normalizedSubmitted === normalizedTarget);
      } else {
        solved = false;
      }
    }

    if (solved) {
      setStatus('success');
      setCorrectAnswers((prev) => prev + 1);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      const baseXp = currentQuestion.xpReward ?? 5;
      const comboBonus = nextCombo >= 3 ? 3 : 0;
      addXp(baseXp + comboBonus);
      gainAdrenaline(resolveAdrenalineGain(currentQuestion));
      setAdrenalineFeedback(`Adrenalina +${resolveAdrenalineGain(currentQuestion)}%.`);
      return;
    }

    setStatus('error');
    setCombo(0);
    gainAdrenaline(5);
    if (adrenaline + 5 >= 35) {
      spendAdrenaline(35);
      setAdrenalineFeedback('Escudo adrenalina activado: no perdiste vida.');
      return;
    }
    loseHeart();
    setAdrenalineFeedback('Error detectado: perdiste 1 vida.');
  };

  const handleContinue = () => {
    const nextQuestion = questionIdx + 1;
    const totalQuestions = currentLevel.challenges.length;

    if (nextQuestion < totalQuestions) {
      setQuestionIdx(nextQuestion);
      updateLessonQuestionProgress(currentLevel.id, nextQuestion);
      setStage('theory');
      resetChallengeState();
      return;
    }

    updateLessonQuestionProgress(currentLevel.id, totalQuestions);
    completeLevel(currentLevel.id, currentLevelIdx, totalQuestions);
    setStage('theory');
    setView('map');
    setSection('stats');
    setStatsBoost(true);
    resetChallengeState();
  };

  const createAccount = () => {
    if (!fullName.trim() || !username.trim()) {
      setOnboardingError('Completa nombre y usuario para continuar.');
      return;
    }

    const answered = placementQuestions.filter((q) => placementAnswers[q.id]);
    if (answered.length < placementQuestions.length) {
      setOnboardingError('Responde todas las preguntas del test de nivel.');
      return;
    }

    const placementScore = placementQuestions.reduce((acc, q) => {
      return acc + (placementAnswers[q.id] === q.correct ? 1 : 0);
    }, 0);

    const weighted = placementScore + experienceWeight[experience];
    const startLevelIdx = Math.min(pythonLevels.length - 1, Math.floor(weighted / 2));

    const newProfile: UserProfile = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      dailyGoalMinutes,
      experience,
      placementScore,
      joinedAt: new Date().toISOString()
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);
    initializePlacement(startLevelIdx);
    setOnboardingError('');
  };

  const exportUserData = () => {
    try {
      const payload = {
        version: 'v0.1.1',
        exportedAt: new Date().toISOString(),
        profile: localStorage.getItem(PROFILE_KEY),
        progress: localStorage.getItem(PROGRESS_KEY),
        usageStreak: localStorage.getItem(USAGE_STREAK_KEY)
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pylingo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDataOpsMessage('Respaldo exportado correctamente.');
    } catch {
      setDataOpsMessage('No fue posible exportar el respaldo.');
    }
  };

  const importUserData = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        profile?: string | null;
        progress?: string | null;
        usageStreak?: string | null;
      };

      if (typeof parsed !== 'object' || parsed === null) {
        setDataOpsMessage('El archivo de respaldo no es valido.');
        return;
      }

      if (typeof parsed.profile === 'string') localStorage.setItem(PROFILE_KEY, parsed.profile);
      if (typeof parsed.progress === 'string') localStorage.setItem(PROGRESS_KEY, parsed.progress);
      if (typeof parsed.usageStreak === 'string') localStorage.setItem(USAGE_STREAK_KEY, parsed.usageStreak);

      setDataOpsMessage('Respaldo importado. Recargando plataforma...');
      window.location.reload();
    } catch {
      setDataOpsMessage('No se pudo importar el archivo seleccionado.');
    }
  };

  const clearAllUserData = () => {
    const approved = window.confirm('Esto eliminara tu perfil y progreso local. Deseas continuar?');
    if (!approved) return;

    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(USAGE_STREAK_KEY);
    resetAllProgress();
    setProfile(null);
    setSection('map');
    setDataOpsMessage('Datos eliminados. Configura nuevamente tu cuenta.');
  };

  const renderChallenge = (challenge: Challenge) => {
    if (challenge.kind === 'choice') {
      return (
        <div className={`choice-grid ${status === 'error' ? 'animate-shake' : ''}`}>
          {challenge.choices?.map((choice) => (
            <button
              key={choice}
              type="button"
              className={`choice-btn ${selectedChoice === choice ? 'active' : ''}`}
              onClick={() => setSelectedChoice(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      );
    }

    if (challenge.kind === 'arrange') {
      const bag = challenge.fragments ?? [];

      return (
        <div className={`arrange-wrap ${status === 'error' ? 'animate-shake' : ''}`}>
          <div className="arrange-target">
            {arrangedFragments.length ? arrangedFragments.join(' ') : 'Selecciona fragmentos para construir el codigo'}
          </div>

          <div className="fragment-bag">
            {bag.map((fragment, idx) => (
              <button
                key={`${fragment}-${idx}`}
                type="button"
                className="fragment-chip"
                onClick={() => setArrangedFragments((prev) => [...prev, fragment])}
              >
                {fragment}
              </button>
            ))}
          </div>

          <div className="arrange-actions">
            <button
              type="button"
              className="mini-btn"
              onClick={() => setArrangedFragments((prev) => prev.slice(0, -1))}
            >
              Deshacer
            </button>
            <button type="button" className="mini-btn" onClick={() => setArrangedFragments([])}>
              Limpiar
            </button>
          </div>
        </div>
      );
    }

    if (challenge.kind === 'debug') {
      return (
        <div className={`debug-wrap ${status === 'error' ? 'animate-shake' : ''}`}>
          <div className="buggy-block">
            <p className="question-meta">Codigo con error (estilo Python)</p>
            <pre>{challenge.buggyCode}</pre>
          </div>
          <CodeEditor
            value={userInput}
            onChange={setUserInput}
            onEnter={() => {
              if (status === 'success') {
                handleContinue();
              } else {
                handleCheck();
              }
            }}
            isError={status === 'error'}
            starterCode=""
          />
        </div>
      );
    }

    return (
      <CodeEditor
        value={userInput}
        onChange={setUserInput}
        onEnter={() => {
          if (status === 'success') {
            handleContinue();
          } else {
            handleCheck();
          }
        }}
        isError={status === 'error'}
        starterCode={challenge.starterCode ?? ''}
      />
    );
  };

  const dashboardContent = (
    <>
      {section === 'map' && (
        <>
          <div className="mobile-hero">
            <img src={logo} alt="Logo PyLingo" className="mobile-hero-logo" />
            <div>
              <h2>Experiencia movil</h2>
              <p>Interfaz optimizada para estudio desde telefono.</p>
            </div>
          </div>
          <section className="usage-streak-panel">
            <p className="question-meta">Racha de uso</p>
            <h3>{usageStreak} dias seguidos usando la app</h3>
          </section>
          <section className="focus-strip">
            <article className="focus-card">
              <p className="focus-label">Momentum</p>
              <strong>{momentumScore}%</strong>
              <small>Ritmo actual de aprendizaje</small>
            </article>
            <article className="focus-card">
              <p className="focus-label">Meta siguiente</p>
              <strong>{nextMilestoneXp} XP</strong>
              <small>{xpToMilestone} XP para desbloquearla</small>
            </article>
            <article className="focus-card">
              <p className="focus-label">Logros</p>
              <strong>{completedAchievements}/{achievements.length}</strong>
              <small>Insignias activadas</small>
            </article>
          </section>
          <LevelMap
            levels={pythonLevels.map((level, idx) => ({
              id: level.id,
              unit: level.unit,
              label: `Dia ${level.id}: ${level.title} (14)`,
              isLocked: !unlockedLevelIds.includes(level.id),
              isCompleted: completedLevelIds.includes(level.id),
              isCurrent: idx === currentLevelIdx
            }))}
            onSelectLevel={openLevel}
          />
        </>
      )}

      {section === 'stats' && (
        <section className={`stats-page ${statsBoost ? 'stats-boost' : ''}`}>
          <header className="panel-head">
            <h2>Estadisticas</h2>
            <p>Panel exclusivo con progreso visual.</p>
          </header>
          {statsBoost && (
            <div className="boost-banner">
              <TrophyIcon className="quest-icon" /> Reto completado! Revisa tu progreso.
            </div>
          )}
                    <section className="stats-kpi-row">
            <article className="stats-kpi">
              <span>Combo recomendado</span>
              <strong>{Math.max(combo, 3)}x</strong>
            </article>
            <article className="stats-kpi">
              <span>Precision objetivo</span>
              <strong>85%</strong>
            </article>
            <article className="stats-kpi">
              <span>Adrenalina ideal</span>
              <strong>70%</strong>
            </article>
          </section>
          <div className="ring-grid">
            {statCards.map((stat) => {
              const radius = 40;
              const circumference = 2 * Math.PI * radius;
              const dashOffset = circumference * (1 - stat.percent / 100);
              return (
                <article key={stat.id} className="ring-card">
                  <svg className="ring-chart" viewBox="0 0 100 100" aria-hidden="true">
                    <circle className="ring-track" cx="50" cy="50" r={radius} />
                    <circle
                      className="ring-progress"
                      cx="50"
                      cy="50"
                      r={radius}
                      style={{
                        stroke: stat.tone,
                        strokeDasharray: circumference,
                        strokeDashoffset: dashOffset
                      }}
                    />
                  </svg>
                  <p className="ring-label">{stat.label}</p>
                  <p className="ring-value">{stat.value}</p>
                  <p className="ring-meta">{stat.meta}</p>
                </article>
              );
            })}
          </div>
          <section className="insights-card">
            <h3>Rango actual: {playerRank}</h3>
            <p>
              {accuracy < 60
                ? 'Enfocate en leer pistas y revisar errores del simulador para subir precision.'
                : 'Buen ritmo. Manten la consistencia para desbloquear los rangos superiores.'}
            </p>
          </section>
          <section className="achievements-card">
            <h3>Logros</h3>
            <div className="achievements-grid">
              {achievements.map((badge) => (
                <article key={badge.id} className={`achievement ${badge.unlocked ? 'unlocked' : 'locked'}`}>
                  <p className="achievement-title">{badge.title}</p>
                  <p className="achievement-desc">{badge.description}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {section === 'missions' && (
        <section className="missions-page">
          <header className="panel-head">
            <h2>Misiones del dia</h2>
            <p>Panel dedicado para objetivos diarios.</p>
          </header>
          <div className="mission-list">
            <article className="mission-item">
              <TargetIcon className="quest-icon" />
              <div>
                <h3>Completa 1 leccion</h3>
                <p>{completedLessons > 0 ? 'Completada hoy' : 'Pendiente'}</p>
              </div>
            </article>
            <article className="mission-item">
              <TrophyIcon className="quest-icon" />
              <div>
                <h3>Alcanza {todayGoalXp} XP</h3>
                <p>{xp >= todayGoalXp ? 'Meta alcanzada' : `${todayGoalXp - xp} XP restantes`}</p>
              </div>
            </article>
            <article className="mission-item">
              <BookIcon className="quest-icon" />
              <div>
                <h3>Manten la racha activa</h3>
                <p>{usageStreak > 0 ? `Racha actual: ${usageStreak}` : 'Inicia una racha hoy'}</p>
              </div>
            </article>
            <article className="mission-item">
              <PuzzleIcon className="quest-icon" />
              <div>
                <h3>Carga adrenalina al 100%</h3>
                <p>{adrenaline >= 100 ? 'Carga completa lista' : `${100 - adrenaline}% restante`}</p>
              </div>
            </article>
          </div>
          <section className="missions-progress">
            <h3>Progreso de misiones</h3>
            <div className="mission-progress-row">
              <span>Leccion diaria</span>
              <div className="mission-progress-track">
                <div style={{ width: `${missionLessonProgress}%` }} />
              </div>
              <strong>{missionLessonProgress}%</strong>
            </div>
            <div className="mission-progress-row">
              <span>Meta XP</span>
              <div className="mission-progress-track">
                <div style={{ width: `${missionXpProgress}%` }} />
              </div>
              <strong>{missionXpProgress}%</strong>
            </div>
            <div className="mission-progress-row">
              <span>Racha semanal</span>
              <div className="mission-progress-track">
                <div style={{ width: `${missionStreakProgress}%` }} />
              </div>
              <strong>{missionStreakProgress}%</strong>
            </div>
            <div className="mission-progress-row">
              <span>Adrenalina</span>
              <div className="mission-progress-track">
                <div style={{ width: `${missionAdrenalineProgress}%` }} />
              </div>
              <strong>{missionAdrenalineProgress}%</strong>
            </div>
          </section>
          <section className="mission-reward-panel">
            <h3>Recompensas del dia</h3>
            <div className="reward-grid">
              <article className="reward-item">
                <p>XP extra</p>
                <strong>+25</strong>
              </article>
              <article className="reward-item">
                <p>Escudo</p>
                <strong>1 uso</strong>
              </article>
              <article className="reward-item">
                <p>Bonus racha</p>
                <strong>+1 dia</strong>
              </article>
            </div>
          </section>
        </section>
      )}

      {section === 'session' && (
        <section className="session-page">
          <header className="panel-head">
            <h2>Siguiente sesion</h2>
            <p>Acceso rapido al proximo reto recomendado.</p>
          </header>
          <article className="session-card">
            <p className="question-meta">Proxima leccion</p>
            <h3>Dia {currentLevel.id}: {currentLevel.title}</h3>
            <p>{currentLevel.challenges.length} retos practicos con teoria guiada.</p>
            <button
              type="button"
              className="primary-btn session-cta"
              onClick={() => openLevel(currentLevel.id)}
            >
              <PlayIcon className="dock-icon" /> Continuar
            </button>
          </article>
          <section className="session-prep">
            <h3>Checklist de preparacion</h3>
            <div className="session-prep-grid">
              <p>1. Lee teoria y ejemplo base.</p>
              <p>2. Identifica el tipo de reto.</p>
              <p>3. Ejecuta con Ctrl+Enter y valida salida.</p>
            </div>
          </section>
        </section>
      )}

      {section === 'profile' && (
        <section className="profile-card">
          <h2>Perfil de aprendizaje</h2>
          <p><strong>Usuario:</strong> @{profile!.username}</p>
          <p><strong>Nivel inicial detectado:</strong> {profile!.experience}</p>
          <p><strong>Puntuacion de diagnostico:</strong> {profile!.placementScore}/{placementQuestions.length}</p>
          <p><strong>Lecciones completadas:</strong> {completedLevelIds.length}/{pythonLevels.length}</p>
          <p><strong>Intentos totales:</strong> {attempts}</p>
          <p><strong>Aciertos:</strong> {correctAnswers}</p>
          <p><strong>Plan diario:</strong> 1 leccion por dia.</p>
          <div className="profile-actions">
            <button type="button" className="secondary-btn" onClick={exportUserData}>
              Exportar respaldo
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => importInputRef.current?.click()}
            >
              Importar respaldo
            </button>
            <button type="button" className="secondary-btn" onClick={clearAllUserData}>
              Borrar datos locales
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importUserData(file);
              event.target.value = '';
            }}
          />
          {dataOpsMessage && <p className="profile-message">{dataOpsMessage}</p>}
        </section>
      )}
    </>
  );

  if (!profile) {
    return (
      <div className="onboarding-shell">
        <section className="onboarding-card">
          <div className="brand">
            <img src={logo} alt="Logo de la plataforma" className="brand-mark" />
            <div>
              <p className="brand-kicker">PyLingo Studio</p>
              <h1>Configura tu cuenta</h1>
            </div>
          </div>
          <p>Completa tu perfil y test inicial para personalizar tu ruta de aprendizaje.</p>

          <div className="form-grid">
            <label>
              Nombre completo
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej: Ana Lopez" />
            </label>
            <label>
              Usuario
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: anacode" />
            </label>
            <label>
              Meta diaria (minutos)
              <select value={dailyGoalMinutes} onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={25}>25 minutos</option>
                <option value={40}>40 minutos</option>
              </select>
            </label>
            <label>
              Nivel percibido
              <select value={experience} onChange={(e) => setExperience(e.target.value as ExperienceLevel)}>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </label>
          </div>

          <h2>Test de nivel</h2>
          <div className="placement-list">
            {placementQuestions.map((q) => (
              <article key={q.id} className="placement-item">
                <h3>{q.id}. {q.question}</h3>
                <div className="placement-options">
                  {q.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`placement-option ${placementAnswers[q.id] === option ? 'active' : ''}`}
                      onClick={() => setPlacementAnswers((prev) => ({ ...prev, [q.id]: option }))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {onboardingError && <p className="error-text">{onboardingError}</p>}

          <button type="button" className="primary-btn" onClick={createAccount}>
            Crear cuenta y comenzar
          </button>
        </section>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="game-over minimalist">
        <h1>Sin vidas</h1>
        <p>Recupera vidas para continuar tu ruta.</p>
        <div className="game-over-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              restoreHearts();
              setStatus('idle');
              setView('map');
            }}
          >
            Recuperar vidas
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              resetAllProgress();
              setStatus('idle');
              setView('map');
            }}
          >
            Reiniciar progreso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell minimal-ui ${isMobile ? 'is-mobile' : 'is-desktop'} section-${section}`}>
      {view === 'map' ? (
        isMobile ? (
          <MobileShell
            profileName={profile!.fullName}
            usageStreak={usageStreak}
            section={section}
            dockTabs={mobileDockTabs}
            onSectionChange={setSection}
          >
            {dashboardContent}
          </MobileShell>
        ) : (
          <DesktopShell
            profileName={profile!.fullName}
            section={section}
            tabs={dashboardTabs}
            onSectionChange={setSection}
          >
            {dashboardContent}
          </DesktopShell>
        )
      ) : (
        <>
          <ProgressBar
            progress={progressPercent}
            hearts={hearts}
            xp={xp}
            streak={streak}
            adrenaline={adrenaline}
            lessonLabel={`${currentLevel.title} - ${questionIdx + 1}/${currentLevel.challenges.length}`}
            onBackToMap={() => {
              setView('map');
              setStatus('idle');
            }}
          />

          {stage === 'theory' ? (
            <main className="lesson-main">
              <section className="theory-card minimal-card">
                <p className="question-meta">Pregunta {questionIdx + 1}/{currentLevel.challenges.length}</p>
                <h2>
                  <BookIcon className="theory-icon" /> {currentLevel.title}
                </h2>
                <p className="micro-theory-text">{currentQuestion.microTheory}</p>

                <div className="theory-badges">
                  <span className="challenge-pill">Nivel: {currentQuestion.difficulty}</span>
                  <span className="challenge-pill">Tipo: {currentQuestion.kind}</span>
                  <span className="challenge-pill">Contexto: {currentQuestion.realContext}</span>
                </div>

                <div className="theory-section">
                  <h3>Objetivo de esta leccion</h3>
                  <p>{currentLevel.lesson.objective}</p>
                </div>

                <div className="theory-section">
                  <h3>Conceptos clave</h3>
                  <ul className="theory-list">
                    {currentLevel.lesson.theory.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="theory-section">
                  <h3>Ejemplo base</h3>
                  <pre className="theory-code">{currentLevel.lesson.example}</pre>
                </div>

                <div className="theory-section">
                  <h3>Aplicacion real</h3>
                  <p>{currentLevel.lesson.realWorldUse}</p>
                </div>

                <div className="lesson-example">
                  <strong>Reto actual:</strong> {currentQuestion.prompt}
                </div>

                <div className="theory-section">
                  <h3>Checklist antes de comenzar</h3>
                  <ul className="theory-list">
                    {theoryChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setStage('challenge');
                    resetChallengeState(currentQuestion.kind === 'code' ? currentQuestion.starterCode ?? '' : '');
                  }}
                >
                  Empezar reto
                </button>
              </section>
            </main>
          ) : (
            <>
              <main className="lesson-main">
                <section className="challenge-panel minimal-card">
                  <header className="challenge-head compact">
                    <h3>{currentQuestion.prompt}</h3>
                    <span className="challenge-combo">+{currentQuestion.xpReward ?? 5} XP</span>
                  </header>
                  <div className="challenge-meta-inline">
                    <span>{currentQuestion.kind}</span>
                    <span>{currentQuestion.difficulty}</span>
                    <span>{currentQuestion.realContext}</span>
                  </div>
                  <div className="challenge-workspace">
                    <section className="challenge-editor">
                      {renderChallenge(currentQuestion)}
                    </section>
                    {(currentQuestion.kind === 'code' || currentQuestion.kind === 'debug') && (
                      <section className="runner-panel">
                        <p className="question-meta">Salida</p>
                        {runnerStderr ? (
                          <pre className="runner-error">{runnerStderr}</pre>
                        ) : (
                          <pre className="runner-ok">{runnerStdout || '(sin salida por ahora)'}</pre>
                        )}
                      </section>
                    )}
                  </div>
                </section>
              </main>

              <FeedbackBanner
                status={status}
                hint={currentQuestion.hint}
                adrenalineMessage={adrenalineFeedback}
                onCheck={() => {
                  handleCheck();
                }}
                onNext={handleContinue}
                questionIndex={questionIdx + 1}
                totalQuestions={currentLevel.challenges.length}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}







