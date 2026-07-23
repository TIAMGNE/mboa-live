import { ReportStatus } from './types';

export function statusLabel(status: ReportStatus): string {
  if (status === 'in_progress') return 'En cours';
  if (status === 'resolved') return 'Résolu';
  if (status === 'removed') return 'Retiré';
  return 'En attente';
}

// Icône discrète en plus du texte, pour que le sens du statut soit clair au
// premier coup d'œil (ex : ⏳ = pas encore traité par les autorités).
export function statusIcon(status: ReportStatus): string {
  if (status === 'in_progress') return '🔧';
  if (status === 'resolved') return '✅';
  if (status === 'removed') return '⛔';
  return '⏳';
}

export function statusClasses(status: ReportStatus): string {
  if (status === 'in_progress') return 'border-blue-400/40 bg-blue-400/15 text-blue-300';
  if (status === 'resolved') return 'border-green/40 bg-green/15 text-green';
  if (status === 'removed') return 'border-line bg-surface2 text-dim';
  return 'border-amber/40 bg-amber/15 text-amber';
}
