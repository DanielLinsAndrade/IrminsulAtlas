import React, { useRef, useState } from 'react';
import { useShell } from '../../../app/providers';
import { Badge, Button, Modal, ModalBody, ModalFooter } from '../../../components';
import {
  buildSeelieImportPreview,
  parseSeeliePayload,
  type SeelieImportPreview,
} from '../../../domain/achievements';
import { achievementsRepository } from '../../../infrastructure/db';
import { previewAchievementHistory } from '../../../domain/achievements/history';

export interface SeelieImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

interface ModalContentProps {
  profileId: string;
  onClose: () => void;
  onImportSuccess?: () => void;
}

const SeelieImportModalContent: React.FC<ModalContentProps> = ({
  profileId,
  onClose,
  onImportSuccess,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<SeelieImportPreview | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<string | null>(null);
  const [showUnknownDetails, setShowUnknownDetails] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeJson = async (content: string, name?: string) => {
    setIsAnalyzing(true);
    setError(null);
    setSuccessReport(null);
    setPreview(null);

    try {
      const parsed: unknown = JSON.parse(content);
      const [knownIds, currentAchievements] = await Promise.all([
        achievementsRepository.getAllAchievementIds(),
        achievementsRepository.getAchievementsWithStatus(profileId),
      ]);

      const currentStatusMap = new Map<string, boolean>();
      for (const ach of currentAchievements) {
        currentStatusMap.set(ach.id, ach.completed);
      }

      const generatedPreview = parsed && typeof parsed === 'object' && 'format' in parsed
        ? previewAchievementHistory(parsed, currentAchievements) : buildSeelieImportPreview(
        parseSeeliePayload(content),
        knownIds,
        currentStatusMap
      );

      setPreview(generatedPreview);
      if (name) setFileName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao analisar arquivo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setJsonText(text);
      void analyzeJson(text, file.name);
    };
    reader.onerror = () => {
      setError('Erro ao ler arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleApply = async () => {
    if (!preview || preview.entriesToApply.length === 0) return;

    setIsApplying(true);
    setError(null);

    try {
      const res = await achievementsRepository.importAchievementsBatch(
        profileId,
        preview.entriesToApply
      );

      setSuccessReport(
        `Importação concluída com sucesso! ${res.insertedOrUpdated} conquistas foram sincronizadas no seu perfil.`
      );
      setPreview(null);
      setJsonText('');
      setFileName(null);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao persistir conquistas importadas.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {successReport && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '14px',
                color: '#6ee7b7',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '18px' }}>✓</span>
              <span>{successReport}</span>
            </div>
          )}

          {/* Seleção de arquivo ou colagem */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '8px',
              }}
            >
              Arquivo de Backup do Seelie (.json)
            </label>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing || isApplying}
              >
                Selecionar Arquivo JSON
              </Button>
              {fileName && (
                <span style={{ fontSize: '13px', color: '#38bdf8' }}>
                  {fileName}
                </span>
              )}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '6px',
              }}
            >
              Ou cole o JSON de backup diretamente aqui:
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setFileName(null);
              }}
              rows={4}
              placeholder='{"achievements": {"80001": {"done": true}, ...}}'
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '10px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
            {jsonText && !preview && (
              <div style={{ marginTop: '8px' }}>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void analyzeJson(jsonText)}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analisando...' : 'Analisar Conteúdo Colado'}
                </Button>
              </div>
            )}
          </div>

          {/* Painel de Preview de Importação */}
          {preview && (
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                  Relatório Pré-Importação (Preview)
                </span>
                <Badge variant="primary" size="sm">
                  {preview.totalFound} no arquivo
                </Badge>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Reconhecidas</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>
                    {preview.recognizedCount}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Já Concluídas</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#94a3b8' }}>
                    {preview.alreadyDoneCount}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#34d399' }}>Novas a Marcar</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>
                    +{preview.toMarkDoneCount}
                  </div>
                </div>

                {preview.toUnmarkCount > 0 && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#f59e0b' }}>A Desmarcar</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>
                      -{preview.toUnmarkCount}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#fca5a5' }}>IDs Desconhecidos</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fca5a5' }}>
                    {preview.unknownIds.length}
                  </div>
                </div>
              </div>

              {preview.unknownIds.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowUnknownDetails(!showUnknownDetails)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    {showUnknownDetails
                      ? 'Ocultar lista de IDs desconhecidos'
                      : `Ver ${preview.unknownIds.length} IDs não mapeados no catálogo`}
                  </button>

                  {showUnknownDetails && (
                    <div
                      style={{
                        marginTop: '8px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#cbd5e1',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {preview.unknownIds.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                <em>Campos fora de conquistas (como inventário e metas) são ignorados. A prévia informa apenas as alterações necessárias.</em>
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isApplying}>
          {successReport ? 'Fechar' : 'Cancelar'}
        </Button>
        {preview && (
          <Button
            variant="primary"
            onClick={() => void handleApply()}
            disabled={isApplying || preview.entriesToApply.length === 0}
          >
            {isApplying
              ? 'Aplicando...'
              : preview.entriesToApply.length === 0
              ? 'Nenhuma alteração necessária'
              : `Confirmar e Aplicar (${preview.entriesToApply.length} alterações)`}
          </Button>
        )}
      </ModalFooter>
    </>
  );
};

export const SeelieImportModal: React.FC<SeelieImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { activeProfile } = useShell();
  const profileId = activeProfile?.id;

  if (!isOpen || !profileId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Conquistas do Seelie"
      maxWidth="640px"
    >
      <SeelieImportModalContent
        key={profileId}
        profileId={profileId}
        onClose={onClose}
        onImportSuccess={onImportSuccess}
      />
    </Modal>
  );
};
