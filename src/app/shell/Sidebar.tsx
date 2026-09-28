import React from "react";
import { PRODUCT } from '../../config/product';
import { BrandMark } from '../../components/BrandMark';
import { MAIN_ROUTES, RouteId } from "../routes/routes";
import { useShell } from "../providers";
import { UI_ASSETS, getSidebarCharacterIconUrl } from "../../infrastructure/providers";

interface RenderIconProps {
  routeId: string;
  iconName: string;
  isActive: boolean;
  gender?: string | null;
}

function renderSidebarIcon({ routeId, iconName, isActive, gender }: RenderIconProps): React.JSX.Element {
  if (routeId === 'about') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></svg>;
  if (routeId === 'arts') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 3-3 5 5"/></svg>;
  if (routeId === "settings" || iconName === "settings") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }

  let src: string;
  let alt: string;
  let imgStyle: React.CSSProperties = {
    width: "22px",
    height: "22px",
    objectFit: "contain",
    display: "block",
  };

  switch (routeId) {
    case "dashboard":
      src = UI_ASSETS.sidebar.home;
      alt = "Início";
      imgStyle = {
        ...imgStyle,
        width: "24px",
        height: "24px",
        filter: isActive
          ? "brightness(1.15) contrast(1.1)"
          : "grayscale(100%) brightness(0.85) contrast(1.15)",
        opacity: isActive ? 1 : 0.8,
        transition: "filter 0.2s ease, opacity 0.2s ease",
      };
      break;
    case "wishes":
      src = UI_ASSETS.sidebar.wishes;
      alt = "Tiros";
      break;
    case "banners":
      src = UI_ASSETS.sidebar.banners;
      alt = "Banners";
      break;
    case "characters":
      src = getSidebarCharacterIconUrl(gender);
      alt = "Personagens";
      imgStyle = {
        ...imgStyle,
        width: "20px",
        height: "22px",
      };
      break;
    case "weapons":
      src = UI_ASSETS.sidebar.weapons;
      alt = "Armas";
      break;
    case "inventory":
      src = UI_ASSETS.sidebar.inventory;
      alt = "Recursos";
      break;
    case "builds":
      src = UI_ASSETS.sidebar.builds;
      alt = "Builds";
      break;
    case "farm":
      src = UI_ASSETS.sidebar.farm;
      alt = "Farm";
      break;
    case "statistics":
    case "stats":
      src = UI_ASSETS.sidebar.stats;
      alt = "Estatísticas";
      break;
    case "achievements":
      src = UI_ASSETS.sidebar.achievements;
      alt = "Conquistas";
      break;
    default:
      src = UI_ASSETS.sidebar.home;
      alt = "Navegação";
  }

  return (
    <img
      src={src}
      alt={alt}
      style={imgStyle}
      draggable={false}
      onError={(e) => {
        // Fallback defensivo para não quebrar a UI
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export const Sidebar: React.FC = () => {
  const { currentRoute, navigateTo, isSidebarCollapsed, toggleSidebar, activeProfile } = useShell();

  const travelerGender =
    activeProfile?.travelerGender ||
    (activeProfile?.avatarCharacterId === "character_lumine" ? "lumine" : "aether");

  return (
    <aside
      className={`shell-sidebar ${isSidebarCollapsed ? "shell-sidebar--collapsed" : ""}`}
      aria-label="Navegação Principal"
    >
      {/* Identidade própria do produto */}
      <div className="sidebar-brand-wrapper">
        <div className="sidebar-emblem">
          <BrandMark size={isSidebarCollapsed ? 40 : 72} />
        </div>
        <span className="sidebar-brand-name">{PRODUCT.name}</span>
        <span className="sidebar-brand-tagline">{PRODUCT.tagline}</span>
      </div>

      {/* Lista de Navegação */}
      <nav className="sidebar-nav">
        {MAIN_ROUTES.map((route) => {
          const isActive = currentRoute === route.id;
          return (
            <button
              key={route.id}
              type="button"
              className={`nav-item ${isActive ? "nav-item--active" : ""}`}
              onClick={() => navigateTo(route.id as RouteId)}
              title={isSidebarCollapsed ? route.label : route.description}
              aria-current={isActive ? "page" : undefined}
              aria-label={route.label}
            >
              <span className="nav-item-icon">
                {renderSidebarIcon({
                  routeId: route.id,
                  iconName: route.iconName,
                  isActive,
                  gender: travelerGender,
                })}
              </span>
              <span className="nav-item-label">{route.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-toggle-footer">
        <button
          type="button"
          className="sidebar-collapse-trigger"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!isSidebarCollapsed}
        >
          <span>{isSidebarCollapsed ? "»" : "«"}</span>
          <span>{isSidebarCollapsed ? "" : "Recolher"}</span>
        </button>
      </div>
    </aside>
  );
};
