'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';
import { timeAgo } from '@/lib/reportUtils';

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  edited: boolean;
  profiles: { full_name: string | null; username: string | null } | null;
}

const QUICK_REACTIONS = ['🔥', '👏', '❤️', '😮', '😢', '💯', '🙏', '😂'];
const SELECT_COLUMNS = 'id, content, created_at, user_id, parent_id, edited, profiles!user_id(full_name, username)';

function renderContent(content: string, onHashtagClick: (tag: string) => void) {
  const parts = content.split(/(@[a-z0-9_]+|#[\p{L}0-9_]+)/giu);
  return parts.map((part, i) => {
    if (/^@[a-z0-9_]+$/i.test(part)) {
      return (
        <span key={i} className="font-semibold text-red">
          {part}
        </span>
      );
    }
    if (/^#[\p{L}0-9_]+$/iu.test(part)) {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onHashtagClick(part.slice(1))}
          className="font-semibold text-blue-300 hover:underline"
        >
          {part}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function CommentRow({
  comment,
  isReply,
  onReply,
  onUpdated,
  onDeleted,
  onHashtagClick
}: {
  comment: CommentRow;
  isReply: boolean;
  onReply: (comment: CommentRow) => void;
  onUpdated: (c: CommentRow) => void;
  onDeleted: (id: string) => void;
  onHashtagClick: (tag: string) => void;
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const isOwn = user?.id === comment.user_id;

  async function saveEdit() {
    if (!editText.trim()) return;
    setBusy(true);
    setRowError(null);
    const { data, error } = await supabase
      .from('comments')
      .update({ content: editText.trim(), edited: true })
      .eq('id', comment.id)
      .select(SELECT_COLUMNS)
      .single();
    setBusy(false);
    if (error || !data) {
      setRowError("La modification n'a pas pu être enregistrée. Réessaie.");
      return;
    }
    onUpdated(data as unknown as CommentRow);
    setEditing(false);
  }

  async function remove() {
    if (!confirm('Supprimer ce commentaire ?')) return;
    setBusy(true);
    setRowError(null);
    const { error } = await supabase.from('comments').delete().eq('id', comment.id);
    setBusy(false);
    if (error) {
      setRowError('La suppression a échoué. Réessaie.');
      return;
    }
    onDeleted(comment.id);
  }

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface2 font-display text-xs font-bold text-ink">
        {(comment.profiles?.full_name || 'U').charAt(0).toUpperCase()}
      </span>
      <div className="flex-1">
        <p className="font-display text-xs font-bold text-ink">
          {comment.profiles?.username ? `@${comment.profiles.username}` : comment.profiles?.full_name || 'Utilisateur MBOA'}
        </p>

        {editing ? (
          <div className="mt-1 flex gap-2">
            <input
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="flex-1 rounded-full border border-line bg-surface2 px-3 py-1.5 text-sm text-ink outline-none focus:border-red"
            />
            <button onClick={saveEdit} disabled={busy} className="font-display text-xs font-bold text-red">OK</button>
            <button onClick={() => setEditing(false)} className="font-display text-xs text-dim">Annuler</button>
          </div>
        ) : (
          <p className="text-sm text-ink">{renderContent(comment.content, onHashtagClick)}</p>
        )}

        {rowError && <p className="mt-1 text-[11px] text-red-light">{rowError}</p>}

        <div className="mt-1 flex items-center gap-3 text-[10px] text-dim">
          <span className="font-mono">{timeAgo(comment.created_at)}</span>
          {comment.edited && <span>modifié</span>}
          {!isReply && (
            <button onClick={() => onReply(comment)} className="font-display font-bold text-dim hover:text-ink">
              Répondre
            </button>
          )}
          {isOwn && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="hover:text-ink">Modifier</button>
              <button onClick={remove} disabled={busy} className="hover:text-red">Supprimer</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSheet({
  reportId,
  onClose
}: {
  reportId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from('comments')
      .select(SELECT_COLUMNS)
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('MBOA LIVE — erreur de chargement des commentaires :', error.message);
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    setLoadError(null);
    setComments((data as unknown as CommentRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();

    // Temps réel : tout commentaire publié, modifié ou supprimé par
    // N'IMPORTE QUI sur ce signalement apparaît instantanément chez tout le
    // monde qui a cette fenêtre ouverte — pas seulement chez l'auteur.
    const channel = supabase
      .channel(`comments-${reportId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `report_id=eq.${reportId}` },
        async payload => {
          // On ne connaît pas encore le profil de l'auteur depuis l'événement
          // realtime brut : on va chercher la ligne complète avec sa jointure.
          const { data } = await supabase.from('comments').select(SELECT_COLUMNS).eq('id', payload.new.id).single();
          if (data) {
            setComments(prev => (prev.some(c => c.id === data.id) ? prev : [...prev, data as unknown as CommentRow]));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `report_id=eq.${reportId}` },
        async payload => {
          const { data } = await supabase.from('comments').select(SELECT_COLUMNS).eq('id', payload.new.id).single();
          if (data) {
            setComments(prev => prev.map(c => (c.id === data.id ? (data as unknown as CommentRow) : c)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `report_id=eq.${reportId}` },
        payload => {
          const deletedId = payload.old.id as string;
          setComments(prev => prev.filter(c => c.id !== deletedId && c.parent_id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim() || sending) return;
    setSending(true);
    setSendError(null);
    const content = replyTo?.profiles?.username && !text.includes(`@${replyTo.profiles.username}`)
      ? `@${replyTo.profiles.username} ${text.trim()}`
      : text.trim();

    const { data, error } = await supabase
      .from('comments')
      .insert({
        report_id: reportId,
        user_id: user.id,
        content,
        parent_id: replyTo?.parent_id ?? replyTo?.id ?? null
      })
      .select(SELECT_COLUMNS)
      .single();

    setSending(false);

    if (error || !data) {
      setSendError(error?.code === 'P0001' ? error.message : "Le commentaire n'a pas pu être publié. Réessaie.");
      return;
    }

    // Affichage instantané chez l'auteur, sans attendre l'aller-retour du
    // canal temps réel (celui-ci arrivera juste après pour les AUTRES
    // utilisateurs ; le "dédoublonnage par id" plus haut évite un doublon ici).
    setComments(prev => (prev.some(c => c.id === data.id) ? prev : [...prev, data as unknown as CommentRow]));
    setText('');
    setReplyTo(null);
  }

  function goToHashtag(tag: string) {
    onClose();
    router.push(`/feed?q=${encodeURIComponent(tag)}`);
  }

  function handleUpdated(updated: CommentRow) {
    setComments(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  }

  function handleDeleted(id: string) {
    setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
  }

  const topLevel = comments.filter(c => !c.parent_id);
  const repliesOf = (id: string) => comments.filter(c => c.parent_id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-line bg-surface"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-sm font-bold text-ink">Commentaires ({comments.length})</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-dim hover:text-ink">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-dim">Chargement...</p>}

          {!loading && loadError && (
            <div className="rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-sm text-red-light">
              Impossible de charger les commentaires : {loadError}
              <button onClick={load} className="mt-2 block font-display text-xs font-bold text-red">
                Réessayer
              </button>
            </div>
          )}

          {!loading &&
            !loadError &&
            topLevel.map(c => (
              <div key={c.id} className="space-y-3">
                <CommentRow
                  comment={c}
                  isReply={false}
                  onReply={setReplyTo}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                  onHashtagClick={goToHashtag}
                />
                {repliesOf(c.id).map(r => (
                  <CommentRow
                    key={r.id}
                    comment={r}
                    isReply
                    onReply={setReplyTo}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                    onHashtagClick={goToHashtag}
                  />
                ))}
              </div>
            ))}
          {!loading && !loadError && comments.length === 0 && (
            <p className="text-sm text-dim">Aucun commentaire pour l&apos;instant.</p>
          )}
        </div>

        {user ? (
          <form onSubmit={submitComment} className="border-t border-line px-5 py-3">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5 text-xs text-dim">
                <span>
                  Réponse à {replyTo.profiles?.username ? `@${replyTo.profiles.username}` : replyTo.profiles?.full_name}
                </span>
                <button type="button" onClick={() => setReplyTo(null)} className="text-dim hover:text-ink">✕</button>
              </div>
            )}
            {sendError && <p className="mb-2 text-xs text-red-light">{sendError}</p>}
            {showEmojis && (
              <div className="mb-2 flex flex-wrap gap-2">
                {QUICK_REACTIONS.map(emoji => (
                  <button type="button" key={emoji} onClick={() => setText(t => `${t}${emoji}`)} className="text-lg">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojis(v => !v)}
                aria-label="Emojis"
                className="text-lg"
              >
                😊
              </button>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Ajouter un commentaire... (@pseudo, #motclé)"
                className="flex-1 rounded-full border border-line bg-surface2 px-4 py-2 text-sm text-ink outline-none focus:border-red"
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-red px-4 py-2 font-display text-xs font-bold text-ink disabled:opacity-60"
              >
                ➤
              </button>
            </div>
          </form>
        ) : (
          <p className="border-t border-line px-5 py-3 text-xs text-dim">Connecte-toi pour commenter.</p>
        )}
      </div>
    </div>
  );
}
