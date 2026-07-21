'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';
import { timeAgo } from '@/lib/reportUtils';

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
}

export default function Comments({ reportId }: { reportId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from('comments')
      .select('id, content, created_at, user_id, profiles(full_name)')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active && data) setComments(data as unknown as CommentRow[]);
      });
    return () => {
      active = false;
    };
  }, [reportId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim() || sending) return;
    setSending(true);
    const { data } = await supabase
      .from('comments')
      .insert({ report_id: reportId, user_id: user.id, content: text.trim() })
      .select('id, content, created_at, user_id, profiles(full_name)')
      .single();
    setSending(false);
    if (data) {
      setComments(prev => [...prev, data as unknown as CommentRow]);
      setText('');
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-bold text-ink">Commentaires ({comments.length})</h3>

      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="rounded-lg border border-line bg-surface2 px-3 py-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-display text-xs font-bold text-ink">
                {c.profiles?.full_name || 'Utilisateur MBOA'}
              </span>
              <span className="font-mono text-[10px] text-dim">{timeAgo(c.created_at)}</span>
            </div>
            <p className="text-sm text-dim">{c.content}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-dim">Aucun commentaire pour l&apos;instant.</p>}
      </div>

      {user ? (
        <form onSubmit={submitComment} className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-gold px-4 py-2 font-display text-xs font-bold text-bg disabled:opacity-60"
          >
            Envoyer
          </button>
        </form>
      ) : (
        <p className="text-xs text-dim">Connecte-toi pour commenter.</p>
      )}
    </div>
  );
}
