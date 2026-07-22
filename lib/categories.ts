import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'voirie', label: 'Voirie', icon: '🛣️', color: '#E8B33D' },
  { id: 'eclairage', label: 'Éclairage', icon: '💡', color: '#3B82F6' },
  { id: 'eau', label: 'Eau', icon: '🚰', color: '#2E9E6D' },
  { id: 'environnement', label: 'Environnement', icon: '🌳', color: '#8B5CF6' },
  { id: 'autre', label: 'Autre', icon: '📍', color: '#9CA6A0' }
];

export function getCategory(id: string): Category {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export const CITIES = [
  { id: 'douala' as const, name: 'Douala', lat: 4.0511, lng: 9.7679 },
  { id: 'yaounde' as const, name: 'Yaoundé', lat: 3.848, lng: 11.5021 }
];
