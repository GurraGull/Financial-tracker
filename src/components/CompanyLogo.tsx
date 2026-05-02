'use client';

import { useState } from 'react';

interface Props {
  name: string;
  color: string;
  domain: string;
  size?: number;
}

export default function CompanyLogo({ name, color, domain, size = 32 }: Props) {
  const [failed, setFailed] = useState(false);
  const r = Math.round(size * 0.28);
  return (
    <div
      className="pm-co-av"
      style={{
        background: failed || !domain ? color : 'rgba(255,255,255,0.07)',
        width: size,
        height: size,
        borderRadius: r,
        border: failed || !domain ? 'none' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {domain && !failed ? (
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt=""
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          style={{ objectFit: 'contain', borderRadius: 3, display: 'block' }}
          onError={() => setFailed(true)}
        />
      ) : (
        name[0]
      )}
    </div>
  );
}
