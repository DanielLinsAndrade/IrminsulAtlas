import { lazy, Suspense, useState } from 'react';
import { PRODUCT } from '../../config/product';
import { BrandMark } from '../../components/BrandMark';
import { ExternalLink } from '../../components/ExternalLink';
import { useShell } from '../../app/providers';
import content from './legalContent.json';
import copyrightFile from '../../../legal/COPYRIGHT.md?url';
import privacyFile from '../../../legal/PRIVACY.md?url';
import disclaimerFile from '../../../legal/DISCLAIMER.md?url';
import './AboutView.css';

const LicensesView = lazy(() => import('./LicensesView'));
const sections = { about: 'Sobre', privacy: 'Privacidade', services: 'Serviços e créditos', legal: 'Informações legais', licenses: 'Licenças de terceiros' };
type Section = keyof typeof sections;

export function AboutView() {
  const [section, setSection] = useState<Section>('about');
  const { navigateTo } = useShell();
  return <div className="ui-page about-page">
    <header className="about-hero ui-panel">
      <div className="about-mark"><BrandMark size={104} /></div>
      <div><p className="about-eyebrow">Sobre & Legal · Desktop · v{PRODUCT.version}</p>
        <h1>{PRODUCT.name}</h1><p>{PRODUCT.tagline}</p>
        <span className="about-unofficial">Projeto comunitário não oficial para Genshin Impact</span>
      </div>
    </header>
    <nav className="about-nav" aria-label="Seções de Sobre e Legal">{Object.entries(sections).map(([id,label]) =>
      <button type="button" key={id} aria-pressed={section===id} onClick={()=>setSection(id as Section)}>{label}</button>)}</nav>
    <section aria-label={sections[section]} className="about-content">
      {(section === 'about' || section === 'privacy' || section === 'legal') && content[section].map(card =>
        <article className="ui-panel about-card" key={card.title}><h2>{card.title}</h2>{card.paragraphs.map(p=><p key={p}>{p}</p>)}</article>)}
      {section === 'about' && <article className="ui-panel about-card"><h2>Acompanhe o projeto</h2><p>Versão {PRODUCT.version} · React, TypeScript, Vite, Tauri, Rust e SQLite.</p><div className="about-actions"><ExternalLink href={PRODUCT.repository}>GitHub do projeto</ExternalLink><ExternalLink href={`${PRODUCT.repository}/commits/main`}>Histórico de mudanças</ExternalLink></div><p className="ui-muted">Repositório oficial do aplicativo desktop. Abrir links externos acessa o navegador.</p></article>}
      {section === 'privacy' && <article className="ui-panel about-card"><h2>Gerenciar seus dados</h2><p>Abra Configurações → Backup & Restauração para exportar ou restaurar seus perfis.</p><button type="button" className="about-action" onClick={()=>navigateTo('settings',{id:'backup',query:''})}>Abrir Backup & Restauração</button><p><a href={privacyFile} download="PRIVACY.md">Baixar política de privacidade</a></p></article>}
      {section === 'services' && <><article className="ui-panel about-card"><h2>Serviços externos e créditos</h2><p>Algumas funcionalidades podem consultar serviços externos independentes. Esses serviços possuem suas próprias políticas e condições e não são operados pelo Irminsul Atlas.</p><p>As menções representam uso como fonte, referência ou integração técnica e não implicam parceria, patrocínio ou endosso.</p></article><div className="about-grid">{content.services.map(service=><article className="ui-panel about-card" key={service.name}><h2><ExternalLink href={service.url}>{service.name}</ExternalLink></h2><p>{service.role}</p></article>)}</div><article className="ui-panel about-card"><h2>Tecnologias</h2><p>React · TypeScript · Vite · Tauri · Rust · SQLite. Versões, expressões de licença e avisos fornecidos pelos pacotes estão na seção Licenças de terceiros.</p><p>A marca do aplicativo utiliza o logo fornecido e aprovado para o Irminsul Atlas. As imagens do jogo permanecem separadas da identidade do produto.</p></article></>}
      {section === 'legal' && <article className="ui-panel about-card"><h2>Documentos locais</h2><div className="about-actions"><a href={copyrightFile} download="COPYRIGHT.md">Copyright</a><a href={disclaimerFile} download="DISCLAIMER.md">Aviso legal</a><a href={privacyFile} download="PRIVACY.md">Privacidade</a></div></article>}
      {section === 'licenses' && <Suspense fallback={<p role="status">Carregando licenças locais…</p>}><LicensesView /></Suspense>}
    </section>
  </div>;
}
