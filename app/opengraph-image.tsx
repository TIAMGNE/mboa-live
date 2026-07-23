import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1210',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 110,
            height: 110,
            borderRadius: 999,
            border: '3px solid #F5F3EE',
            marginBottom: 32
          }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#F5F3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 19l6-10 4 6 2-3 6 7" />
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 76, fontWeight: 700, color: '#F5F3EE' }}>
          MBOA&nbsp;
          <span style={{ background: '#E2453D', padding: '4px 20px', borderRadius: 16 }}>LIVE</span>
        </div>
        <div style={{ marginTop: 20, fontSize: 32, color: '#9CA6A0' }}>Informer. Alerter. Agir.</div>
      </div>
    ),
    { ...size }
  );
}
