export type CityId = 'douala' | 'yaounde';

export interface City {
  id: CityId;
  name: string;
  lat: number;
  lng: number;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export type ReportStatus = 'active' | 'resolved' | 'removed';

export interface Report {
  id: string;
  user_id: string | null;
  category_id: string;
  title: string;
  description: string | null;
  city_id: CityId;
  lat: number;
  lng: number;
  media_urls: string[];
  status: ReportStatus;
  confirmations_up: number;
  confirmations_down: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: CityId | null;
  trust_score: number;
  is_admin: boolean;
  created_at: string;
}
