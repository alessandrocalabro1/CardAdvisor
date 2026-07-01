import { useState, useEffect } from 'react';

interface CardArtworkProps {
  src?: string | null;
  name?: string;
  game?: string;
  cardNumber?: string;
  setName?: string;
  size?: 'thumb' | 'medium' | 'large';
  /** Extra styles for the outer container (e.g. width overrides). */
  style?: React.CSSProperties;
}

const SIZE_PRESETS: Record<NonNullable<CardArtworkProps['size']>, React.CSSProperties> = {
  thumb: { width: 40, minWidth: 40, aspectRatio: '11 / 15', borderRadius: 4 },
  medium: { width: '100%', aspectRatio: '11 / 15', borderRadius: 8 },
  large: { width: '100%', aspectRatio: '11 / 16', borderRadius: 12 },
};

function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('');
}

/**
 * Card image with a safe fallback.
 * - Renders the image only if a src is provided.
 * - On load error, switches permanently to a placeholder (no 404 loops,
 *   no broken image icons).
 * - Never invents or constructs image URLs.
 */
export default function CardArtwork({ src, name, game, cardNumber, size = 'medium', style }: CardArtworkProps) {
  const [failed, setFailed] = useState(false);

  // A new src gets a fresh chance (e.g. user picks a different search result).
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const hasImage = Boolean(src) && !failed;
  const preset = SIZE_PRESETS[size];

  const containerStyle: React.CSSProperties = {
    ...preset,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'linear-gradient(160deg, var(--bg-surface) 0%, var(--bg-raised) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...style,
  };

  if (hasImage) {
    return (
      <div style={containerStyle}>
        <img
          src={src!}
          alt={name || 'Carta'}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  // Placeholder — premium dark card-like surface, no broken requests.
  if (size === 'thumb') {
    return (
      <div style={containerStyle} title={name ? `${name} — immagine non disponibile` : 'Immagine non disponibile'}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          {initials(name)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, flexDirection: 'column', gap: 6, padding: 14, textAlign: 'center' }}>
      {game && (
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
          {game}
        </span>
      )}
      <span style={{
        fontSize: size === 'large' ? 15 : 12.5,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        lineHeight: 1.35,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {name || initials(name)}
      </span>
      {cardNumber && (
        <span className="num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{cardNumber}</span>
      )}
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
        Immagine non disponibile
      </span>
    </div>
  );
}
