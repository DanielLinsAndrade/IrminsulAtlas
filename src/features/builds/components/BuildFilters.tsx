import React from 'react';
import type { Element, WeaponType } from '../../../domain/catalog';
import type { BuildFilterOptions, BuildStatus } from '../../../domain/builds/types';
import { BUILD_STATUS_LABELS } from '../../../domain/builds/validation';
import { Button, Input, Select } from '../../../components';

interface BuildFiltersProps {
  filters: BuildFilterOptions;
  onChange: (filters: BuildFilterOptions) => void;
  onReset: () => void;
}

const ELEMENT_OPTIONS: Array<{ value: Element | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os Elementos' },
  { value: 'pyro', label: 'Pyro' },
  { value: 'hydro', label: 'Hydro' },
  { value: 'anemo', label: 'Anemo' },
  { value: 'electro', label: 'Electro' },
  { value: 'dendro', label: 'Dendro' },
  { value: 'cryo', label: 'Cryo' },
  { value: 'geo', label: 'Geo' },
];

const WEAPON_TYPE_OPTIONS: Array<{ value: WeaponType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os Tipos de Arma' },
  { value: 'sword', label: 'Espada' },
  { value: 'claymore', label: 'Espadão' },
  { value: 'polearm', label: 'Lança' },
  { value: 'bow', label: 'Arco' },
  { value: 'catalyst', label: 'Catalisador' },
];

const STATUS_OPTIONS: Array<{ value: BuildStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os Estados' },
  { value: 'completa', label: BUILD_STATUS_LABELS.completa },
  { value: 'utilizavel', label: BUILD_STATUS_LABELS.utilizavel },
  { value: 'precisa_melhorar', label: BUILD_STATUS_LABELS.precisa_melhorar },
  { value: 'incompleta', label: BUILD_STATUS_LABELS.incompleta },
  { value: 'sem_build', label: BUILD_STATUS_LABELS.sem_build },
];

const FARM_OPTIONS: Array<{ value: 'all' | 'active' | 'paused'; label: string }> = [
  { value: 'all', label: 'Farm: Todos' },
  { value: 'active', label: 'Farm: Apenas Ativos' },
  { value: 'paused', label: 'Farm: Pausados' },
];

export const BuildFilters: React.FC<BuildFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Busca por texto */}
      <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
        <Input
          placeholder="Buscar personagem ou arma..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Filtro por Farm Ativo / Pausado */}
      <div style={{ flex: '1 0 200px', minWidth: 'min(200px, 100%)' }}>
        <Select
          options={FARM_OPTIONS}
          value={filters.farmStatus || 'all'}
          onChange={(e) => onChange({ ...filters, farmStatus: e.target.value as 'all' | 'active' | 'paused' })}
        />
      </div>

      {/* Filtro por Estado da Build */}
      <div style={{ flex: '1 0 200px', minWidth: 'min(200px, 100%)' }}>
        <Select
          options={STATUS_OPTIONS}
          value={filters.status || 'all'}
          onChange={(e) => onChange({ ...filters, status: e.target.value as BuildStatus | 'all' })}
        />
      </div>

      {/* Filtro por Elemento */}
      <div style={{ flex: '1 0 220px', minWidth: 'min(220px, 100%)' }}>
        <Select
          options={ELEMENT_OPTIONS}
          value={filters.element || 'all'}
          onChange={(e) => onChange({ ...filters, element: e.target.value as Element | 'all' })}
        />
      </div>

      {/* Filtro por Tipo de Arma */}
      <div style={{ flex: '1 0 220px', minWidth: 'min(220px, 100%)' }}>
        <Select
          options={WEAPON_TYPE_OPTIONS}
          value={filters.weaponType || 'all'}
          onChange={(e) => onChange({ ...filters, weaponType: e.target.value as WeaponType | 'all' })}
        />
      </div>

      {/* Botão Limpar Filtros */}
      <Button
        variant="secondary"
        size="md"
        onClick={onReset}
        style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
      >
        Limpar Filtros
      </Button>
    </div>
  );
};
