'use client';

import { Message } from '@/lib/types';
import { timeAgo } from '@/lib/reportUtils';

export default function MessageBubble({
  message,
  isMine,
  isRead
}: {
  message: Message;
  isMine: boolean;
  isRead: boolean;
}) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
          isMine ? 'rounded-br-sm bg-red text-ink' : 'rounded-bl-sm bg-surface2 text-ink'
        }`}
      >
        {message.media_type === 'image' && message.media_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.media_url} alt="Photo" className="mb-1 max-h-64 rounded-xl object-cover" />
        )}
        {message.media_type === 'video' && message.media_url && (
          <video src={message.media_url} controls className="mb-1 max-h-64 rounded-xl" />
        )}
        {message.media_type === 'audio' && message.media_url && (
          <audio src={message.media_url} controls className="mb-1 w-56" />
        )}
        {message.content && <p className="whitespace-pre-wrap text-sm">{message.content}</p>}

        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine ? 'text-ink/70' : 'text-dim'}`}>
          <span className="font-mono">{timeAgo(message.created_at)}</span>
          {isMine && <span>{isRead ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  );
}
