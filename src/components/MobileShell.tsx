import type { ReactNode } from 'react';
import type { DashboardSection } from '../types';
import type { DashboardTabConfig } from './DesktopShell';
import logo from '../assets/images/logo.png';
import { APP_VERSION } from '../config/release';

interface Props {
  profileName: string;
  usageStreak: number;
  section: DashboardSection;
  dockTabs: DashboardTabConfig[];
  onSectionChange: (section: DashboardSection) => void;
  children: ReactNode;
}

export const MobileShell = ({
  profileName,
  usageStreak,
  section,
  dockTabs,
  onSectionChange,
  children
}: Props) => {
  return (
    <div className="mobile-shell">
      <header className="mobile-shell-header">
        <div className="mobile-shell-hero">
          <div className="brand-inline">
            <img src={logo} alt="Logo de la plataforma" className="brand-mark small" />
            <div>
              <p className="eyebrow">Hola, {profileName}</p>
              <h1>Aprende jugando</h1>
              <p className="brand-version">{APP_VERSION}</p>
            </div>
          </div>
          <span className="mobile-streak-pill">Racha {usageStreak}</span>
        </div>
      </header>

      <main className="mobile-shell-content">{children}</main>

      <nav className="mobile-dock" aria-label="Navegación móvil">
        {dockTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`dock-btn ${section === tab.key ? 'active' : ''}`}
            onClick={() => onSectionChange(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
