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

export type ReportStatus = 'active' | 'in_progress' | 'resolved' | 'removed';

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
  media_type: 'photo' | 'video' | null;
  status: ReportStatus;
  confirmations_up: number;
  confirmations_down: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  /** Ajouté côté client quand on joint le profil de l'auteur (voir useReports). */
  author?: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: CityId | null;
  trust_score: number;
  is_admin: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'comment' | 'status' | 'like' | 'system';
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface ConversationParticipant {
  user_id: string;
  last_read_at: string;
  muted: boolean;
  profile?: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  title: string | null;
  created_at: string;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  participants: ConversationParticipant[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'audio' | null;
  created_at: string;
  deleted_at: string | null;
}
