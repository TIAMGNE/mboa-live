'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/lib/types';
import VoiceRecorder from './VoiceRecorder';

export default function MessageComposer({
  userId,
  onSend
}: {
  userId: string;
  onSend: (content: string | null, mediaUrl: string | null, mediaType: Message['media_type']) => void;
}) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadAndSend(file: Blob, name: string, mediaType: Message['media_type']) {
    setUploading(true);
    setError(null);
    const path = `${userId}/${Date.now()}-${name}`;
    const { error: uploadError } = await supabase.storage.from('messages-media').upload(path, file);
    setUploading(false);
    if (uploadError) {
      setError(`Envoi impossible : ${uploadError.message}`);
      return;
    }
    const { data } = supabase.storage.from('messages-media').getPublicUrl(path);
    onSend(null, data.publicUrl, mediaType);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaType: Message['media_type'] = file.type.startsWith('video') ? 'video' : 'image';
    uploadAndSend(file, file.name, mediaType);
    e.target.value = '';
  }

  function handleSendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text, null, null);
    setText('');
  }

  return (
    <div className="border-t border-line bg-surface px-4 py-3">
      {error && <p className="mb-2 text-xs text-red-light">{error}</p>}
      {uploading && <p className="mb-2 text-xs text-dim">Envoi en cours...</p>}

      {showRecorder ? (
        <VoiceRecorder
          onRecorded={blob => {
            setShowRecorder(false);
            uploadAndSend(blob, 'note-vocale.webm', 'audio');
          }}
          onCancel={() => setShowRecorder(false)}
        />
      ) : (
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-lg text-ink"
            aria-label="Ajouter une photo ou vidéo"
          >
            📎
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 rounded-full border border-line bg-surface2 px-4 py-2.5 text-sm text-ink outline-none focus:border-red"
          />

          {text.trim() ? (
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red text-ink"
              aria-label="Envoyer"
            >
              ➤
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowRecorder(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-lg text-ink"
              aria-label="Enregistrer une note vocale"
            >
              🎤
            </button>
          )}
        </form>
      )}
    </div>
  );
}
