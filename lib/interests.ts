export interface Interest {
  id: string;
  label: string;
  icon: string;
}

export const INTERESTS: Interest[] = [
  { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
  { id: 'traffic', label: 'Circulation', icon: '🚗' },
  { id: 'events', label: 'Événements', icon: '🎉' },
  { id: 'jobs', label: 'Emplois', icon: '💼' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'promos', label: 'Promotions', icon: '🏷️' },
  { id: 'emergencies', label: 'Urgences', icon: '🚨' },
  { id: 'health', label: 'Santé', icon: '🏥' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'gaming', label: 'Jeux vidéo', icon: '🎮' },
  { id: 'music', label: 'Musique', icon: '🎵' },
  { id: 'universities', label: 'Universités', icon: '🎓' },
  { id: 'realestate', label: 'Immobilier', icon: '🏠' },
  { id: 'culture', label: 'Culture', icon: '🎭' }
];
