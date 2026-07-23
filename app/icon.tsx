import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1210',
          borderRadius: 8
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5F3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 19l6-10 4 6 2-3 6 7" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
