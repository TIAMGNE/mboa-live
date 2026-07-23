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
  is_emergency: boolean;
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

export type Role = 'user' | 'support' | 'moderator' | 'super_admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: CityId | null;
  trust_score: number;
  interests: string[];
  onboarded: boolean;
  deletion_requested_at: string | null;
  is_admin: boolean;
  role: Role;
  account_status: AccountStatus;
  suspended_until: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin?: { full_name: string | null } | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Hashtag {
  id: string;
  tag: string;
  is_banned: boolean;
  created_at: string;
}

export interface ReportFlag {
  id: string;
  report_id: string;
  user_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  report?: { title: string; media_urls: string[] } | null;
}

export interface ModerationAppeal {
  id: string;
  flag_id: string | null;
  report_id: string | null;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  user?: { full_name: string | null } | null;
}

export interface CommentRow {
  id: string;
  report_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  edited: boolean;
  hidden: boolean;
  created_at: string;
  author?: { full_name: string | null; username: string | null } | null;
}

export interface Notification {
  id: string;
  type: 'comment' | 'status' | 'like' | 'system' | 'new_post' | 'reminder';
  title: string;
  body: string | null;
  related_report_id: string | null;
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
