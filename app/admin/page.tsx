'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import {
  Report, ReportStatus, Role, Profile, AuditLogEntry, Announcement, Hashtag, ReportFlag, ModerationAppeal, CommentRow
} from '@/lib/types';
import { timeAgo } from '@/lib/reportUtils';
import { statusLabel, statusClasses } from '@/lib/statusLabel';

interface Stats {
  users: number;
  reports: number;
  cities: number;
  confirmations: number;
  pendingFlags: number;
  pendingAppeals: number;
}

const TABS = [
  { id: 'overview', label: "Vue d'ensemble", min: 'support' },
  { id: 'users', label: 'Utilisateurs', min: 'support' },
  { id: 'content', label: 'Signalements (photo/vidéo)', min: 'moderator' },
  { id: 'comments', label: 'Commentaires', min: 'moderator' },
  { id: 'flags', label: 'Contenu signalé', min: 'support' },
  { id: 'appeals', label: 'Appels', min: 'moderator' },
  { id: 'hashtags', label: 'Hashtags', min: 'moderator' },
  { id: 'announcements', label: 'Annonces', min: 'moderator' },
  { id: 'audit', label: "Journal d'audit", min: 'support' }
] as const;
type TabId = typeof TABS[number]['id'];

const RANK: Record<Role, number> = { user: 0, support: 1, moderator: 2, super_admin: 3 };

export default function AdminPage() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<TabId>('overview');

  if (loading) return null;

  if (!profile || profile.role === 'user') {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Accès réservé</h1>
        <p className="mt-3 text-sm text-dim">Cette page est réservée à l&apos;équipe MBOA LIVE.</p>
      </div>
    );
  }

  const myRank = RANK[profile.role];
  const visibleTabs = TABS.filter(t => myRank >= RANK[t.min as Role]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Tableau de bord admin</h1>
        <span className="rounded-full border border-line px-3 py-1 font-display text-xs font-bold text-dim">
          {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'moderator' ? 'Modérateur' : 'Support'}
        </span>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 font-display text-xs font-semibold transition ${
              tab === t.id ? 'border-red bg-red/15 text-red' : 'border-line text-dim hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab myRole={profile.role} />}
        {tab === 'content' && <ContentTab />}
        {tab === 'comments' && <CommentsTab />}
        {tab === 'flags' && <FlagsTab canResolve={myRank >= RANK.support} />}
        {tab === 'appeals' && <AppealsTab />}
        {tab === 'hashtags' && <HashtagsTab />}
        {tab === 'announcements' && <AnnouncementsTab />}
        {tab === 'audit' && <AuditTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [{ count: users }, { count: reports }, { count: confirmations }, { count: pendingFlags }, { count: pendingAppeals }] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('confirmations').select('*', { count: 'exact', head: true }),
          supabase.from('report_flags').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('moderation_appeals').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
      setStats({
        users: users || 0,
        reports: reports || 0,
        cities: 2,
        confirmations: confirmations || 0,
        pendingFlags: pendingFlags || 0,
        pendingAppeals: pendingAppeals || 0
      });
    }
    load();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <StatCard label="Utilisateurs" value={stats?.users} />
      <StatCard label="Signalements" value={stats?.reports} />
      <StatCard label="Villes actives" value={stats?.cities} />
      <StatCard label="Confirmations" value={stats?.confirmations} />
      <StatCard label="Contenus signalés en attente" value={stats?.pendingFlags} highlight={!!stats?.pendingFlags} />
      <StatCard label="Appels en attente" value={stats?.pendingAppeals} highlight={!!stats?.pendingAppeals} />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? 'border-red/40 bg-red/5' : 'border-line bg-surface'}`}>
      <p className="font-display text-3xl font-bold text-red">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-dim">{label}</p>
    </div>
  );
}

function UsersTab({ myRole }: { myRole: Role }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = myRole === 'super_admin';

  async function search() {
    setLoading(true);
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(30);
    if (query.trim()) q = q.or(`full_name.ilike.%${query.trim()}%,username.ilike.%${query.trim()}%`);
    const { data } = await q;
    setUsers((data as Profile[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
    const reason = prompt(`Raison (${status}) :`) || undefined;
    const { error } = await supabase.rpc('admin_set_account_status', {
      target_user_id: userId, new_status: status, reason
    });
    if (error) {
      alert(error.message);
      return;
    }
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, account_status: status } : u)));
  }

  async function setRole(userId: string, role: Role) {
    const reason = prompt(`Raison du changement de rôle vers ${role} :`) || undefined;
    const { error } = await supabase.rpc('admin_set_role', { target_user_id: userId, new_role: role, reason });
    if (error) {
      alert(error.message);
      return;
    }
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role } : u)));
  }

  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); search(); }} className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un nom ou @pseudo..."
          className="flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-red"
        />
        <button type="submit" className="rounded-full bg-red px-4 py-2 font-display text-xs font-bold text-ink">
          Chercher
        </button>
      </form>

      {loading && <p className="mt-4 text-sm text-dim">Chargement...</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-dim">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Inscrit</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">{u.full_name || 'Utilisateur MBOA'}</td>
                <td className="px-4 py-3">
                  {isSuperAdmin ? (
                    <select
                      value={u.role}
                      onChange={e => setRole(u.id, e.target.value as Role)}
                      className="rounded-lg border border-line bg-surface2 px-2 py-1 text-xs text-ink"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="support">Support</option>
                      <option value="moderator">Modérateur</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <span className="text-dim">{u.role}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    u.account_status === 'active' ? 'bg-green/15 text-green'
                    : u.account_status === 'suspended' ? 'bg-amber/15 text-amber' : 'bg-red/15 text-red'
                  }`}>
                    {u.account_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-dim">{timeAgo(u.created_at)}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {u.account_status !== 'active' && (
                    <button onClick={() => setStatus(u.id, 'active')} className="font-display text-xs font-bold text-green hover:underline">
                      Réactiver
                    </button>
                  )}
                  {u.account_status !== 'suspended' && (
                    <button onClick={() => setStatus(u.id, 'suspended')} className="font-display text-xs font-bold text-amber hover:underline">
                      Suspendre
                    </button>
                  )}
                  {isSuperAdmin && u.account_status !== 'banned' && (
                    <button onClick={() => setStatus(u.id, 'banned')} className="font-display text-xs font-bold text-red hover:underline">
                      Bannir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CYCLE: Record<ReportStatus, ReportStatus> = {
  active: 'in_progress', in_progress: 'resolved', resolved: 'removed', removed: 'active'
};

function ContentTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [deletionRequests, setDeletionRequests] = useState<
    { id: string; full_name: string | null; deletion_requested_at: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      const [{ data: reportRows }, { data: deletions }] = await Promise.all([
        supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(150),
        supabase.from('profiles').select('id, full_name, deletion_requested_at')
          .not('deletion_requested_at', 'is', null).order('deletion_requested_at', { ascending: true })
      ]);
      setReports((reportRows as Report[]) || []);
      setDeletionRequests(deletions || []);
    }
    load();
  }, []);

  async function cycleStatus(report: Report) {
    const nextStatus = CYCLE[report.status];
    const reason = nextStatus === 'removed' ? (prompt('Raison du retrait :') || undefined) : undefined;
    const { error } = await supabase.rpc('admin_set_report_status', {
      target_report_id: report.id, new_status: nextStatus, reason
    });
    if (error) {
      alert(error.message);
      return;
    }
    setReports(prev => prev.map(r => (r.id === report.id ? { ...r, status: nextStatus } : r)));
  }

  const filtered = reports.filter(r => mediaFilter === 'all' || r.media_type === mediaFilter);

  return (
    <div>
      {deletionRequests.length > 0 && (
        <>
          <h2 className="font-display text-lg font-bold text-ink">Demandes de suppression de compte</h2>
          <div className="mt-4 space-y-2">
            {deletionRequests.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-red/30 bg-red/5 px-4 py-3">
                <div>
                  <p className="font-display text-sm font-bold text-ink">{d.full_name || 'Utilisateur MBOA'}</p>
                  <p className="text-xs text-dim">Demandé {timeAgo(d.deletion_requested_at)}</p>
                </div>
                <p className="font-mono text-[10px] text-dim">{d.id}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-dim">
            Pour supprimer un compte définitivement : Supabase → Authentication → Users → cherche cet ID → Delete user.
          </p>
        </>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">Signalements</h2>
        <div className="flex gap-2">
          {(['all', 'photo', 'video'] as const).map(f => (
            <button
              key={f}
              onClick={() => setMediaFilter(f)}
              className={`rounded-full border px-3 py-1 font-display text-xs font-semibold ${
                mediaFilter === f ? 'border-red bg-red/15 text-red' : 'border-line text-dim'
              }`}
            >
              {f === 'all' ? 'Tout' : f === 'photo' ? '📷 Photos' : '🎥 Vidéos'}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-dim">Clique sur le statut d&apos;un signalement pour le faire avancer à l&apos;étape suivante.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-dim">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Média</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Publié</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                <td className="px-4 py-3 text-dim">{r.media_type === 'video' ? '🎥 Vidéo' : r.media_type === 'photo' ? '📷 Photo' : '—'}</td>
                <td className="px-4 py-3 text-dim">{r.city_id === 'douala' ? 'Douala' : 'Yaoundé'}</td>
                <td className="px-4 py-3 text-dim">{timeAgo(r.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => cycleStatus(r)}
                    className={`rounded-full border px-3 py-1 font-display text-[11px] font-bold transition ${statusClasses(r.status)}`}
                  >
                    {statusLabel(r.status)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommentsTab() {
  const [comments, setComments] = useState<CommentRow[]>([]);

  async function load() {
    const { data } = await supabase
      .from('comments')
      .select('id, report_id, user_id, content, parent_id, edited, hidden, created_at, author:profiles!user_id(full_name, username)')
      .order('created_at', { ascending: false })
      .limit(100);
    setComments((data as unknown as CommentRow[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleHide(c: CommentRow) {
    const reason = !c.hidden ? (prompt('Raison du masquage :') || undefined) : undefined;
    const { error } = await supabase.rpc('admin_set_comment_hidden', {
      target_comment_id: c.id, hide: !c.hidden, reason
    });
    if (error) {
      alert(error.message);
      return;
    }
    setComments(prev => prev.map(x => (x.id === c.id ? { ...x, hidden: !c.hidden } : x)));
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Commentaires récents</h2>
      <p className="mt-1 text-xs text-dim">Masquer un commentaire le cache pour tout le monde, sans le supprimer définitivement.</p>
      <div className="mt-4 space-y-2">
        {comments.map(c => (
          <div key={c.id} className={`rounded-xl border px-4 py-3 ${c.hidden ? 'border-red/30 bg-red/5' : 'border-line bg-surface'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xs font-bold text-ink">
                  {c.author?.username ? `@${c.author.username}` : c.author?.full_name || 'Utilisateur MBOA'}
                  {c.hidden && <span className="ml-2 rounded-full bg-red/20 px-2 py-0.5 text-[10px] text-red">masqué</span>}
                </p>
                <p className="mt-1 text-sm text-ink">{c.content}</p>
                <p className="mt-1 text-[11px] text-dim">{timeAgo(c.created_at)}</p>
              </div>
              <button
                onClick={() => toggleHide(c)}
                className={`shrink-0 rounded-full border px-3 py-1 font-display text-[11px] font-bold ${
                  c.hidden ? 'border-green/40 text-green' : 'border-red/40 text-red'
                }`}
              >
                {c.hidden ? 'Restaurer' : 'Masquer'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const REASON_LABEL: Record<string, string> = {
  spam: 'Spam ou publicité', harcelement: 'Harcèlement', violence: 'Violence',
  inapproprie: 'Contenu inapproprié', autre: 'Autre raison'
};

function FlagsTab({ canResolve }: { canResolve: boolean }) {
  const [flags, setFlags] = useState<ReportFlag[]>([]);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');

  async function load() {
    const { data } = await supabase
      .from('report_flags')
      .select('*, report:reports(title, media_urls)')
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(100);
    setFlags((data as unknown as ReportFlag[]) || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function resolve(flag: ReportFlag, resolution: 'resolved' | 'dismissed') {
    const note = prompt('Note de résolution (optionnel) :') || undefined;
    const { error } = await supabase.rpc('admin_resolve_flag', { target_flag_id: flag.id, resolution, note });
    if (error) {
      alert(error.message);
      return;
    }
    setFlags(prev => prev.filter(f => f.id !== flag.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">Contenu signalé</h2>
        <div className="flex gap-2">
          {(['pending', 'resolved', 'dismissed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 font-display text-xs font-semibold ${
                filter === f ? 'border-red bg-red/15 text-red' : 'border-line text-dim'
              }`}
            >
              {f === 'pending' ? 'En attente' : f === 'resolved' ? 'Résolus' : 'Rejetés'}
            </button>
          ))}
        </div>
      </div>

      {flags.length === 0 && <p className="mt-6 text-sm text-dim">Rien ici pour l&apos;instant.</p>}

      <div className="mt-4 space-y-3">
        {flags.map(f => (
          <div key={f.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold text-red">{REASON_LABEL[f.reason] || f.reason}</span>
              <span className="text-[11px] text-dim">{timeAgo(f.created_at)}</span>
            </div>
            <p className="mt-2 text-sm text-ink">
              {f.report_id ? `Signalement : "${f.report?.title || f.report_id}"` : 'Un commentaire spécifique'}
            </p>
            {f.details && <p className="mt-1 text-sm text-dim">{f.details}</p>}
            {canResolve && filter === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => resolve(f, 'resolved')}
                  className="rounded-full bg-red px-4 py-1.5 font-display text-xs font-bold text-ink"
                >
                  Traiter (contenu masqué)
                </button>
                <button
                  onClick={() => resolve(f, 'dismissed')}
                  className="rounded-full border border-line px-4 py-1.5 font-display text-xs font-bold text-dim"
                >
                  Rejeter le signalement
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppealsTab() {
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([]);

  async function load() {
    const { data } = await supabase
      .from('moderation_appeals')
      .select('*, user:profiles!user_id(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setAppeals((data as unknown as ModerationAppeal[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(appeal: ModerationAppeal, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('moderation_appeals')
      .update({ status, resolved_by: (await supabase.auth.getUser()).data.user?.id, resolved_at: new Date().toISOString() })
      .eq('id', appeal.id);
    if (error) {
      alert(error.message);
      return;
    }
    setAppeals(prev => prev.filter(a => a.id !== appeal.id));
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Appels en attente</h2>
      <p className="mt-1 text-xs text-dim">Une personne conteste une décision de modération prise sur son contenu.</p>
      {appeals.length === 0 && <p className="mt-6 text-sm text-dim">Aucun appel en attente.</p>}
      <div className="mt-4 space-y-3">
        {appeals.map(a => (
          <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-display text-xs font-bold text-ink">{a.user?.full_name || 'Utilisateur MBOA'}</p>
            <p className="mt-1 text-sm text-ink">{a.message}</p>
            <p className="mt-1 text-[11px] text-dim">{timeAgo(a.created_at)}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => resolve(a, 'approved')} className="rounded-full bg-green px-4 py-1.5 font-display text-xs font-bold text-ink">
                Accepter l&apos;appel
              </button>
              <button onClick={() => resolve(a, 'rejected')} className="rounded-full border border-line px-4 py-1.5 font-display text-xs font-bold text-dim">
                Rejeter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HashtagsTab() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [newTag, setNewTag] = useState('');

  async function load() {
    const { data } = await supabase.from('hashtags').select('*').order('created_at', { ascending: false });
    setHashtags((data as Hashtag[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!tag) return;
    const { error } = await supabase.from('hashtags').insert({ tag });
    if (!error) {
      setNewTag('');
      load();
    }
  }

  async function toggleBan(h: Hashtag) {
    await supabase.from('hashtags').update({ is_banned: !h.is_banned }).eq('id', h.id);
    setHashtags(prev => prev.map(x => (x.id === h.id ? { ...x, is_banned: !h.is_banned } : x)));
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Registre de hashtags</h2>
      <p className="mt-1 text-xs text-dim">
        Un hashtag banni ici reste un simple marqueur — ton app ne relie pas encore chaque contenu à des hashtags
        (ils sont détectés dans le texte des commentaires). C&apos;est une liste de référence pour le staff.
      </p>

      <form onSubmit={addTag} className="mt-4 flex gap-2">
        <input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          placeholder="nouveauhashtag"
          className="flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-red"
        />
        <button type="submit" className="rounded-full bg-red px-4 py-2 font-display text-xs font-bold text-ink">
          Ajouter
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {hashtags.map(h => (
          <button
            key={h.id}
            onClick={() => toggleBan(h)}
            className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold ${
              h.is_banned ? 'border-red bg-red/15 text-red' : 'border-line text-ink'
            }`}
          >
            #{h.tag} {h.is_banned && '🚫'}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('announcements').insert({
      title: title.trim(), body: body.trim(), created_by: user?.id
    });
    if (!error) {
      setTitle('');
      setBody('');
      load();
    }
  }

  async function toggleActive(a: Announcement) {
    await supabase.from('announcements').update({ active: !a.active }).eq('id', a.id);
    setAnnouncements(prev => prev.map(x => (x.id === a.id ? { ...x, active: !a.active } : x)));
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Annonces plateforme</h2>
      <form onSubmit={create} className="mt-4 space-y-2 rounded-2xl border border-line bg-surface p-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre de l'annonce"
          className="w-full rounded-xl border border-line bg-surface2 px-4 py-2 text-sm text-ink outline-none focus:border-red"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Message..."
          rows={3}
          className="w-full rounded-xl border border-line bg-surface2 px-4 py-2 text-sm text-ink outline-none focus:border-red"
        />
        <button type="submit" className="rounded-full bg-red px-4 py-2 font-display text-xs font-bold text-ink">
          Publier
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {announcements.map(a => (
          <div key={a.id} className={`rounded-xl border px-4 py-3 ${a.active ? 'border-green/30 bg-green/5' : 'border-line bg-surface'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-bold text-ink">{a.title}</p>
                <p className="mt-1 text-sm text-dim">{a.body}</p>
                <p className="mt-1 text-[11px] text-dim">{timeAgo(a.created_at)}</p>
              </div>
              <button
                onClick={() => toggleActive(a)}
                className="shrink-0 rounded-full border border-line px-3 py-1 font-display text-[11px] font-bold text-dim"
              >
                {a.active ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('admin_audit_log')
        .select('*, admin:profiles!admin_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(150);
      setLogs((data as unknown as AuditLogEntry[]) || []);
    }
    load();
  }, []);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Journal d&apos;audit</h2>
      <p className="mt-1 text-xs text-dim">Chaque action sensible du staff est journalisée automatiquement, sans exception.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-dim">
            <tr>
              <th className="px-4 py-3">Qui</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Cible</th>
              <th className="px-4 py-3">Raison</th>
              <th className="px-4 py-3">Quand</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{l.admin?.full_name || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-dim">{l.action}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-dim">{l.target_type} · {l.target_id?.slice(0, 8)}</td>
                <td className="px-4 py-3 text-dim">{l.reason || '—'}</td>
                <td className="px-4 py-3 text-dim">{timeAgo(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
