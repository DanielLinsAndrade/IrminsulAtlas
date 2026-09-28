import React from "react";
import { ShellProvider, useShell } from "./app/providers";
import { AppShell } from "./app/shell";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardSubtitle,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
} from "./components";
import { SettingsView } from "./features/settings";
import { DashboardView } from "./features/dashboard";
import { ResourcesInventoryView } from "./features/inventory";
import { CharactersView } from "./features/characters";
import { WeaponsView } from "./features/weapons";
import { BuildsView } from "./features/builds";
import { FarmView } from "./features/farm";
import { WishesView, StatisticsView } from "./features/wishes";
import { WishPlannerView } from "./features/wish-planner";
import { AchievementsView } from "./features/achievements";
import { ArtsView } from './features/arts/ArtsView';
import { AboutView } from './features/about/AboutView';
import { BrandMark } from './components/BrandMark';

const RouteView: React.FC = () => {
  const { currentRoute, currentRouteMeta, navigateTo, navigationTarget, isLoadingProfiles, dbError, reloadProfiles } = useShell();

  // Informações legais devem continuar acessíveis mesmo se o banco falhar.
  if (currentRoute === 'about') return <AboutView />;

  if (isLoadingProfiles) {
    return (
      <Card>
        <CardBody>
          <BrandMark size={56} decorative />
          <LoadingState
            title="Inicializando banco de dados local..."
            description="Conectando ao SQLite e verificando migrações."
          />
        </CardBody>
      </Card>
    );
  }

  if (dbError) {
    return (
      <Card>
        <CardBody>
          <ErrorState
            title="Falha no Banco de Dados SQLite"
            error={dbError}
            retryLabel="Tentar reconectar"
            onRetry={() => void reloadProfiles()}
          />
        </CardBody>
      </Card>
    );
  }

  if (currentRoute === "dashboard") {
    return <DashboardView />;
  }

  if (currentRoute === 'arts') return <ArtsView />;

  if (currentRoute === "wishes") {
    return <WishesView />;
  }

  if (currentRoute === "banners") {
    return <WishPlannerView key={navigationTarget?.sequence} />;
  }

  if (currentRoute === "statistics") {
    return <StatisticsView />;
  }

  if (currentRoute === "characters") {
    return <CharactersView key={navigationTarget?.sequence} />;
  }

  if (currentRoute === "weapons") {
    return <WeaponsView key={navigationTarget?.sequence} />;
  }

  if (currentRoute === "inventory") {
    return <ResourcesInventoryView key={navigationTarget?.sequence} />;
  }

  if (currentRoute === "builds") {
    return <BuildsView />;
  }

  if (currentRoute === "farm") {
    return <FarmView />;
  }

  if (currentRoute === "achievements") {
    return <AchievementsView key={navigationTarget?.sequence} />;
  }

  if (currentRoute === "settings") {
    return <SettingsView />;
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{currentRouteMeta?.label || "Módulo"}</CardTitle>
          <CardSubtitle>{currentRouteMeta?.description}</CardSubtitle>
        </div>
        {currentRouteMeta?.roadmapStage && (
          <Badge variant="primary" size="sm">
            {currentRouteMeta.roadmapStage}
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        <EmptyState
          title={`Módulo de ${currentRouteMeta?.label || ""}`}
          description={`Este módulo será implementado na ${currentRouteMeta?.roadmapStage || "etapa correspondente do ROADMAP.md"}. O shell desktop, os tokens visuais em azul-marinho/violeta e os componentes básicos já estão integrados e prontos.`}
          actionLabel="Retornar ao Início"
          onAction={() => navigateTo("dashboard")}
        />
      </CardBody>
    </Card>
  );
};

function ProfileScopedRoutes() {
  const { activeProfile } = useShell();
  return <RouteView key={activeProfile?.id ?? 'no-profile'} />;
}

export default function App(): React.JSX.Element {
  return (
    <ShellProvider initialRoute="dashboard">
      <AppShell>
        <ProfileScopedRoutes />
      </AppShell>
    </ShellProvider>
  );
}
