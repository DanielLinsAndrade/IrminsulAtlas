import React, { useState } from 'react';
import { useShell } from '../../../app/providers';
import { Badge, Button, Card, CardBody, ErrorState, Modal, Select } from '../../../components';
import {
  buildBackupPreview,
  type BackupImportPreview,
  type RestoreConflictStrategy,
  type WishLogBackup,
  validateBackupPayload,
} from '../../../domain/backup';
import { backupRepository } from '../../../infrastructure/db';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <BackupModalContent onClose={onClose} />;
};

const BackupModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { profiles, activeProfile, reloadProfiles } = useShell();

  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');

  // Export states
  const [exportScope, setExportScope] = useState<'all' | string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Restore states
  const [parsedBackup, setParsedBackup] = useState<WishLogBackup | null>(null);
  const [preview, setPreview] = useState<BackupImportPreview | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<RestoreConflictStrategy>('create_copy');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    setExportError(null);
    try {
      const targetIds = exportScope === 'all' ? undefined : [exportScope];
      const backup = await backupRepository.exportFullBackup(targetIds);

      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `irminsul-atlas-backup-${dateStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMsg(`Backup exportado com sucesso! Arquivo "${filename}" baixado.`);
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      setExportError(err instanceof Error ? err.message : 'Não foi possível ler os dados para exportar o backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccessMsg(null);
    setParsedBackup(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const valRes = validateBackupPayload(parsed);

        if (!valRes.valid || !valRes.backup) {
          setRestoreError(valRes.errors.join(' '));
          return;
        }

        const prev = buildBackupPreview(valRes.backup, profiles);
        setParsedBackup(valRes.backup);
        setPreview(prev);
      } catch {
        setRestoreError('Falha ao interpretar o arquivo JSON. Certifique-se de que é um arquivo válido.');
      }
    };
    reader.onerror = () => setRestoreError('Não foi possível ler o arquivo de backup. Nenhum dado foi alterado.');
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccessMsg(null);

    try {
      const res = await backupRepository.restoreBackup(parsedBackup, conflictStrategy);

      if (!res.success && res.errors.length > 0) {
        setRestoreError(res.errors.join(' '));
      } else {
        await reloadProfiles();
        const createdCount = res.profiles.filter((p) => p.action === 'created').length;
        const overwrittenCount = res.profiles.filter((p) => p.action === 'overwritten').length;
        const skippedCount = res.profiles.filter((p) => p.action === 'skipped').length;

        setRestoreSuccessMsg(
          `Restauração concluída! ${createdCount} criados, ${overwrittenCount} atualizados, ${skippedCount} ignorados.`
        );
        setParsedBackup(null);
        setPreview(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao restaurar backup.';
      setRestoreError(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Backup & Restauração do Irminsul Atlas" maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {exportError && <p role="alert" className="ui-error">{exportError}</p>}
        {/* Seletor de Abas */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'export' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'export' ? '#f8fafc' : '#94a3b8',
              fontWeight: activeTab === 'export' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Exportar Backup (.json)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'restore' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'restore' ? '#f8fafc' : '#94a3b8',
              fontWeight: activeTab === 'restore' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Restaurar Backup (.json)
          </button>
        </div>

        {/* ABA EXPORTAR */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Gere uma cópia lógica versionada dos seus perfis locais. O arquivo inclui todos os desejos, contadores de pity, armas, personagens, planos de build, metas e conquistas.
            </p>

            <Select
              label="Escopo da Exportação"
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value)}
              options={[
                { value: 'all', label: `Todos os Perfis (${profiles.length})` },
                ...profiles.map((p) => ({
                  value: p.id,
                  label: `${p.name} ${p.uid ? `(UID ${p.uid})` : ''} ${p.id === activeProfile?.id ? '★ Ativo' : ''}`,
                })),
              ]}
            />

            {exportSuccessMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: '#34d399',
                  fontSize: '13px',
                }}
              >
                ✓ {exportSuccessMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Fechar
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isExporting}
                onClick={() => void handleExport()}
              >
                Gerar & Baixar Backup
              </Button>
            </div>
          </div>
        )}

        {/* ABA RESTAURAR */}
        {activeTab === 'restore' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Selecione um arquivo de backup exportado anteriormente pelo Irminsul Atlas (.json).
            </p>

            <div>
              <label
                htmlFor="backup-file-input"
                style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}
              >
                Arquivo de Backup (.json)
              </label>
              <input
                id="backup-file-input"
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13px',
                }}
              />
            </div>

            {restoreError && (
              <ErrorState
                title="Não foi possível carregar o backup"
                error={restoreError}
              />
            )}

            {restoreSuccessMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: '#34d399',
                  fontSize: '13px',
                }}
              >
                ✓ {restoreSuccessMsg}
              </div>
            )}

            {/* Preview do Conteúdo */}
            {preview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                    Perfis encontrados no arquivo ({preview.totalProfiles})
                  </span>
                  <Badge variant="primary" size="sm">
                    {preview.totalWishes} desejos no total
                  </Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {preview.profiles.map((p) => (
                    <Card key={p.profileId}>
                      <CardBody>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{p.profileName}</strong>
                              {p.alreadyExists && (
                                <Badge variant="warning" size="sm">
                                  Conflito com perfil local
                                </Badge>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                              UID: {p.uid || '--'} • Servidor: {p.server || '--'} • {p.wishesCount} tiros • {p.charactersCount} personagens • {p.weaponsCount} armas
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {/* Estratégia de Conflito */}
                <div>
                  <Select
                    label="Estratégia de Resolução para Perfis Existentes"
                    value={conflictStrategy}
                    onChange={(e) => setConflictStrategy(e.target.value as RestoreConflictStrategy)}
                    options={[
                      { value: 'create_copy', label: 'Criar como cópia (adiciona "(Cópia)" e preserva ambos)' },
                      { value: 'overwrite', label: 'Substituir perfil existente (sobrescreve histórico e recursos)' },
                      { value: 'skip', label: 'Pular existentes (restaura apenas perfis novos)' },
                    ]}
                    helperText="Define o comportamento caso um perfil do backup já exista no seu aplicativo."
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Fechar
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="primary"
                  isLoading={isRestoring}
                  onClick={() => void handleConfirmRestore()}
                >
                  Restaurar Perfis
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
