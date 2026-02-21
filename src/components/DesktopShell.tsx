import type { ReactNode } from 'react';
import type { DashboardSection } from '../types';
import logo from '../assets/images/logo.png';
import { APP_VERSION } from '../config/release';

export interface DashboardTabConfig {
  key: DashboardSection;
  label: string;
  icon: ReactNode;
}

interface Props {
  profileName: string;
  section: DashboardSection;
  tabs: DashboardTabConfig[];
  onSectionChange: (section: DashboardSection) => void;
  children: ReactNode;
}

export const DesktopShell = ({ profileName, section, tabs, onSectionChange, children }: Props) => {
  return (
    <div className="desktop-shell">
      <header className="desktop-shell-header">
        <div className="brand-inline">
          <img src={logo} alt="Logo de la plataforma" className="brand-mark small" />
          <div>
            <p className="eyebrow">Bienvenido, {profileName}</p>
            <h1>Plan de 30 dias de Python</h1>
            <p className="brand-version">{APP_VERSION}</p>
          </div>
        </div>
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab ${section === tab.key ? 'active' : ''}`}
              onClick={() => onSectionChange(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>
      <main className="map-screen clean-layout">{children}</main>
    </div>
  );
};
