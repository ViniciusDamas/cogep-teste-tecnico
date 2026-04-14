/**
 * Gera iniciais a partir de um nome completo. Usa a primeira letra do primeiro
 * e último termo não vazios. Retorna "?" se a entrada for inutilizável.
 *
 * Exemplos:
 *   "Vinicius Lima" → "VL"
 *   "Maria das Graças Silva" → "MS"
 *   "Ana" → "AN"
 *   "" → "?"
 */
export function initialsFor(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
