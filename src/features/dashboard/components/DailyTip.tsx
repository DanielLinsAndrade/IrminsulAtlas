import React from 'react';

export interface DailyTipProps {
  hasGoals: boolean;
  hasFarm: boolean;
  currentPity5Star: number;
  softPityThreshold: number;
  hasWishes: boolean;
}

const GENERAL_TIPS = [
  "O soft pity do banner de personagem comeca no tiro 74. A partir desse ponto, a taxa base de 0,6% sobe progressivamente.",
  "Destinos Familiares funcionam apenas na Invocacao do Mochileiro. Nao gaste Destinos Entrelacados nesse banner.",
  "O Brilho Estelar pode ser trocado por Destinos na loja. Cada 5 unidades equivalem a 1 Destino.",
  "Lembre-se de verificar o reset mensal da loja de Poeira Estelar para garantir ate 5 Destinos extras.",
  "O Caminho Divino no banner de armas garante a arma escolhida apos 2 desvios, resetando ao obter o item.",
  "Mantenha suas conquistas atualizadas para rastrear o total de Primogemas coletaveis pendentes.",
  "Faca backup regular do seu perfil para nao perder dados. Acesse Configuracoes para exportar.",
  "A consolidacao de recursos no Dashboard reflete o estado mais recente do seu banco de dados local."
];

export const DailyTip: React.FC<DailyTipProps> = ({
  hasGoals,
  hasFarm,
  currentPity5Star,
  softPityThreshold,
  hasWishes,
}) => {
  let tipText: string;

  if (currentPity5Star >= softPityThreshold) {
    tipText = `Voce esta na zona de soft pity! A partir do tiro ${softPityThreshold}, a probabilidade de obter um 5 estrelas aumenta significativamente a cada tentativa.`;
  } else if (!hasGoals) {
    tipText = "Defina metas de oracao para organizar seus proximos objetivos. Acesse a aba Banners para criar alvos com reserva de tiros.";
  } else if (!hasFarm) {
    tipText = "Adicione personagens a fila de farm para calcular automaticamente os materiais necessarios para evolucao.";
  } else if (!hasWishes) {
    tipText = "Registre seus tiros na aba Historico para acompanhar pity, estatisticas e tendencias.";
  } else {
    // Deterministic rotation based on day of year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    tipText = GENERAL_TIPS[dayOfYear % GENERAL_TIPS.length];
  }

  return (
    <div className="dashboard-tip">
      <img src="/icons/Icon_Paimon_Menu.png" alt="Paimon" className="dashboard-tip__icon" />
      <div className="dashboard-tip__content">
        <h3 className="dashboard-tip__title">Dica do Dia</h3>
        <p className="dashboard-tip__text">{tipText}</p>
      </div>
    </div>
  );
};
