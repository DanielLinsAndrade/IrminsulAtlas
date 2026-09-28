export type RouteId =
  | "dashboard"
  | "wishes"
  | "banners"
  | "characters"
  | "weapons"
  | "inventory"
  | "builds"
  | "farm"
  | "statistics"
  | "achievements"
  | "arts"
  | "settings"
  | "about";

export interface NavRoute {
  id: RouteId;
  label: string;
  iconName: string;
  roadmapStage?: string;
  description?: string;
}

export const MAIN_ROUTES: NavRoute[] = [
  {
    id: "dashboard",
    label: "Início",
    iconName: "home",
    description: "Visão consolidada da conta, pity e atalhos rápidos",
  },
  {
    id: "wishes",
    label: "Tiros",
    iconName: "sparkles",
    roadmapStage: "Etapa 11 & 12",
    description: "Registro de desejos, histórico e motor de pity",
  },
  {
    id: "banners",
    label: "Banners",
    iconName: "target",
    roadmapStage: "Etapa 14",
    description: "Planejamento de banners futuros e metas de tiros",
  },
  {
    id: "characters",
    label: "Personagens",
    iconName: "users",
    roadmapStage: "Etapa 8",
    description: "Coleção de personagens obtidos e constelações (C0-C6)",
  },
  {
    id: "weapons",
    label: "Armas",
    iconName: "sword",
    roadmapStage: "Etapa 9",
    description: "Arsenal de armas, refinamentos e equipamentos",
  },
  {
    id: "inventory",
    label: "Recursos",
    iconName: "archive",
    roadmapStage: "Etapa 7",
    description: "Inventário de materiais e recursos de evolução",
  },
  {
    id: "builds",
    label: "Builds",
    iconName: "layers",
    roadmapStage: "Etapa 10",
    description: "Status de evolução de builds e progresso de artefatos",
  },
  {
    id: "farm",
    label: "Farm",
    iconName: "hammer",
    roadmapStage: "Etapa 15 & 16",
    description: "Fila de prioridade de farm e consolidação de materiais pendentes",
  },
  {
    id: "statistics",
    label: "Estatísticas",
    iconName: "bar-chart",
    roadmapStage: "Etapa 13",
    description: "Médias de pity, distribuição 50/50 e gráficos de histórico",
  },
  {
    id: "achievements",
    label: "Conquistas",
    iconName: "award",
    roadmapStage: "Conquistas",
    description: "Catálogo de conquistas, progresso e recompensas em Gemas Essenciais",
  },
  { id: 'arts', label: 'Artes', iconName: 'image', description: 'Biblioteca local de artes e enquadramentos' },
  {
    id: "settings",
    label: "Configurações",
    iconName: "settings",
    roadmapStage: "Etapa 4 & 20",
    description: "Perfis locais, backup, cache da HoYoWiki e aparência",
  },
  { id: 'about', label: 'Sobre', iconName: 'info', description: 'Sobre o Irminsul Atlas, privacidade, créditos e informações legais' },
];

export function findRouteById(routeId: RouteId): NavRoute | undefined {
  return MAIN_ROUTES.find((r) => r.id === routeId);
}
