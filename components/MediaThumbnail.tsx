'use client';

interface MediaThumbnailProps {
  url: string;
  mediaType: 'photo' | 'video' | null;
  alt: string;
  className?: string;
}

function looksLikeVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

/** Affiche la première image d'un signalement — gère aussi bien une photo qu'une
 * vidéo (dans ce cas, la première image de la vidéo sert de vignette statique). */
export default function MediaThumbnail({ url, mediaType, alt, className }: MediaThumbnailProps) {
  const isVideo = mediaType === 'video' || (!mediaType && looksLikeVideo(url));

  if (isVideo) {
    return <video src={url} className={className} muted playsInline preload="metadata" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}
