import { BoltIcon, FlameIcon, HeartIcon } from './Icons';

interface Props {
  progress: number;
  hearts: number;
  xp: number;
  streak: number;
  adrenaline: number;
  lessonLabel: string;
  onBackToMap: () => void;
}

export const ProgressBar = ({ progress, hearts, xp, streak, adrenaline, lessonLabel, onBackToMap }: Props) => {
  return (
    <nav className="game-nav">
      <button className="close-btn" type="button" aria-label="Volver al mapa" onClick={onBackToMap}>
        ←
      </button>

      <div className="progress-col">
        <div className="progress-track" aria-label="Progreso total">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <small>{lessonLabel}</small>
      </div>

      <div className="stats-box" aria-label="Estadisticas del jugador">
        <span className="stat-chip">
          <HeartIcon className="stat-icon" /> {hearts}
        </span>
        <span className="stat-chip">
          <BoltIcon className="stat-icon" /> {xp}
        </span>
        <span className="stat-chip streak">
          <FlameIcon className="stat-icon" /> {streak}
        </span>
        <span className="stat-chip adrenaline">
          <FlameIcon className="stat-icon" /> ADR {adrenaline}%
        </span>
      </div>
    </nav>
  );
};
