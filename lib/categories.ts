import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'traffic', label: 'Embouteillage', icon: '🚗', color: '#E8B33D' },
  { id: 'accident', label: 'Accident', icon: '🚨', color: '#E2453D' },
  { id: 'road', label: 'Route bloquée', icon: '🚧', color: '#E2453D' },
  { id: 'event', label: 'Événement', icon: '🎉', color: '#2E9E6D' },
  { id: 'concert', label: 'Concert', icon: '🎤', color: '#2E9E6D' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️', color: '#F4C862' },
  { id: 'business', label: 'Commerce', icon: '🏪', color: '#F4C862' },
  { id: 'promo', label: 'Promotion', icon: '🏷️', color: '#2E9E6D' },
  { id: 'flood', label: 'Inondation', icon: '🌊', color: '#E2453D' },
  { id: 'power', label: 'Coupure électricité', icon: '💡', color: '#E8B33D' },
  { id: 'water', label: "Problème d'eau", icon: '🚰', color: '#E8B33D' },
  { id: 'incident', label: 'Incident', icon: '⚠️', color: '#E2453D' },
  { id: 'other', label: 'Autre', icon: '📍', color: '#9CA6A0' }
];

export function getCategory(id: string): Category {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export const CITIES = [
  { id: 'douala' as const, name: 'Douala', lat: 4.0511, lng: 9.7679 },
  { id: 'yaounde' as const, name: 'Yaoundé', lat: 3.848, lng: 11.5021 }
];
