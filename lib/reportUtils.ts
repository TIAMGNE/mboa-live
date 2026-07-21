import { Report } from './types';

/** Affiche un temps relatif court, ex. "5 min", "2 h", "3 j" */
export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

/**
 * Niveau de fiabilité d'un signalement, de 0 à 100, basé sur :
 * - le ratio de confirmations positives / négatives
 * - une décroissance dans le temps (l'info perd en fiabilité si elle vieillit
 *   sans être reconfirmée)
 */
export function reliability(report: Report): number {
  const total = report.confirmations_up + report.confirmations_down;
  const ratio = total > 0 ? report.confirmations_up / total : 0.6; // neutre par défaut
  const ageHours = (Date.now() - new Date(report.created_at).getTime()) / 3_600_000;

  // Les catégories "événement/promo/commerce" décroissent plus lentement
  // que "embouteillage/accident" qui deviennent vite obsolètes.
  const isFast = ['traffic', 'accident', 'road', 'incident', 'power', 'water', 'flood'].includes(report.category_id);
  const halfLife = isFast ? 3 : 24; // heures avant que la fiabilité perde ~50%
  const decay = Math.pow(0.5, ageHours / halfLife);

  const score = Math.round(ratio * 100 * decay + (1 - decay) * 20);
  return Math.max(0, Math.min(100, score));
}

/** Un signalement doit-il rester visible en avant, ou est-il trop vieux ? */
export function isStillVisible(report: Report): boolean {
  if (report.status !== 'active') return false;
  return reliability(report) > 12;
}
