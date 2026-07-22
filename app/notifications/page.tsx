'use client';

import { useAuth } from '@/lib/useAuth';
import { useNotifications } from '@/lib/useNotifications';
import { timeAgo } from '@/lib/reportUtils';
import { Notification } from '@/lib/types';

const TYPE_ICON: Record<Notification['type'], string> = {
  status: '⏱️',
  comment: '💬',
  like: '❤️',
  system: '🔔'
};

const TYPE_COLOR: Record<Notification['type'], string> = {
  status: 'text-amber',
  comment: 'text-blue-400',
  like: 'text-red',
  system: 'text-dim'
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const hasUnread = notifications.some(n => !n.read);

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Pas encore connecté</h1>
        <p className="mt-3 text-sm text-dim">Connecte-toi pour voir tes notifications.</p>
        <a href="/login" className="mt-6 inline-block rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink">
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Notifications</h1>
        {hasUnread && (
          <button onClick={markAllAsRead} className="font-display text-xs font-semibold text-red">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading && <p className="mt-6 text-sm text-dim">Chargement...</p>}

      {!loading && notifications.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-bold text-ink">Aucune notification</p>
          <p className="mt-2 text-sm text-dim">Tu seras prévenu ici des réactions à tes signalements.</p>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {notifications.map(n => (
          <button
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              n.read ? 'border-line bg-surface' : 'border-red/40 bg-red/5'
            }`}
          >
            <span className={`text-lg ${TYPE_COLOR[n.type]}`}>{TYPE_ICON[n.type]}</span>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-ink">{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm text-dim">{n.body}</p>}
              <p className="mt-1 font-mono text-[11px] text-dim">{timeAgo(n.created_at)}</p>
            </div>
            {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red" />}
          </button>
        ))}
      </div>
    </div>
  );
}
