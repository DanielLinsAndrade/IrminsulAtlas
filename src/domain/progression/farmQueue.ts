/**
 * Irminsul Atlas - Farm Queue Domain Logic
 * Funções puras de manipulação e reordenação determinística da fila de Farm.
 */

/**
 * Reordena uma fila de identificadores de farm deslocando um elemento
 * da posição de origem (sourceIndex) para a posição de destino (targetIndex).
 * Função pura e determinística: não altera o array original e preserva identidades.
 *
 * @param ids Array de IDs dos personagens na ordem atual
 * @param sourceIndex Índice do elemento a ser movido
 * @param targetIndex Índice da nova posição desejada
 * @returns Novo array com a ordem resultante
 */
export function reorderFarmQueue(
  ids: string[],
  sourceIndex: number,
  targetIndex: number
): string[] {
  if (
    !Array.isArray(ids) ||
    sourceIndex < 0 ||
    sourceIndex >= ids.length ||
    targetIndex < 0 ||
    targetIndex >= ids.length ||
    sourceIndex === targetIndex
  ) {
    return [...(ids ?? [])];
  }

  const result = [...ids];
  const [moved] = result.splice(sourceIndex, 1);
  result.splice(targetIndex, 0, moved);
  return result;
}
