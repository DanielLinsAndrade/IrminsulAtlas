import React from "react";
import { PRODUCT } from '../../config/product';
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useShell } from '../providers';
import { ScreenArt } from '../../components/ScreenArt';
import { WindowTitleBar } from './WindowTitleBar';
import { isTauri } from '@tauri-apps/api/core';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { currentRoute, navigateTo } = useShell();
  return (
    <div className={`app-shell${isTauri() ? ' app-shell--desktop' : ''}`}>
      <WindowTitleBar />
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <Sidebar />
      <div className="shell-main">
        <Header />
        <main id="main-content" className="shell-content" tabIndex={-1}>
          <ScreenArt route={currentRoute} />
          <div className="content-inner">
            {children}
          </div>
        </main>
        <footer className="shell-footer-bar">
          <div>
            <span>{PRODUCT.name} v{PRODUCT.version}</span>
            <span style={{ margin: "0 8px" }}>|</span>
            <span>Projeto não oficial feito por fãs.</span>
          </div>
          <div>
            <button type="button" className="footer-about-link" onClick={() => navigateTo('about')}>Sobre & Legal</button>
          </div>
        </footer>
      </div>
    </div>
  );
};
