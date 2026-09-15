import React from 'react';

interface BrandLogoProps {
  brand: string;
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  className = 'w-6 h-6',
  size,
}) => {
  const normalized = brand.trim().toLowerCase();
  const dimension = size || 32;

  // 1. TOYOTA (Iconic overlapping chrome ovals)
  if (normalized.includes('toyota')) {
    return (
      <svg
        viewBox="0 0 100 70"
        width={dimension}
        height={dimension * 0.7}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Toyota Logo"
      >
        <defs>
          <linearGradient id="toyota-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <filter id="toyota-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>
        {/* Outer Oval */}
        <ellipse
          cx="50"
          cy="35"
          rx="45"
          ry="31"
          fill="none"
          stroke="url(#toyota-chrome)"
          strokeWidth="6.5"
          filter="url(#toyota-glow)"
        />
        {/* Inner Vertical Oval */}
        <ellipse
          cx="50"
          cy="35"
          rx="14"
          ry="24"
          fill="none"
          stroke="url(#toyota-chrome)"
          strokeWidth="5.5"
        />
        {/* Inner Horizontal Top Oval */}
        <ellipse
          cx="50"
          cy="26"
          rx="27"
          ry="12.5"
          fill="none"
          stroke="url(#toyota-chrome)"
          strokeWidth="5.5"
        />
      </svg>
    );
  }

  // 2. NISSAN (Silver circle with horizontal chrome badge & text)
  if (normalized.includes('nissan')) {
    return (
      <svg
        viewBox="0 0 100 85"
        width={dimension}
        height={dimension * 0.85}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Nissan Logo"
      >
        <defs>
          <linearGradient id="nissan-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="nissan-bar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        {/* Outer Ring */}
        <circle
          cx="50"
          cy="42.5"
          r="36"
          fill="none"
          stroke="url(#nissan-chrome)"
          strokeWidth="7"
        />
        {/* Inner Ring cutout border */}
        <circle
          cx="50"
          cy="42.5"
          r="28"
          fill="none"
          stroke="#475569"
          strokeWidth="1.5"
          opacity="0.5"
        />
        {/* Horizontal Bar */}
        <rect
          x="6"
          y="30"
          width="88"
          height="25"
          rx="3.5"
          fill="url(#nissan-bar)"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        {/* NISSAN Text */}
        <text
          x="50"
          y="47.5"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="14"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="2.5"
        >
          NISSAN
        </text>
      </svg>
    );
  }

  // 3. HONDA (Square rounded chrome frame with bold 'H')
  if (normalized.includes('honda')) {
    return (
      <svg
        viewBox="0 0 100 85"
        width={dimension}
        height={dimension * 0.85}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Honda Logo"
      >
        <defs>
          <linearGradient id="honda-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        {/* Rounded Trapezoid Outer Frame */}
        <path
          d="M 16,10 L 84,10 C 93,10 96,16 93,28 L 86,70 C 84,79 78,82 70,82 L 30,82 C 22,82 16,79 14,70 L 7,28 C 4,16 7,10 16,10 Z"
          fill="none"
          stroke="url(#honda-chrome)"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Iconic Honda H */}
        <path
          d="M 28,21 L 39,21 L 43,47 C 45,46 48,45 50,45 C 52,45 55,46 57,47 L 61,21 L 72,21 L 64,74 L 54,74 L 53,55 C 52,54 51,54 50,54 C 49,54 48,54 47,55 L 46,74 L 36,74 Z"
          fill="url(#honda-chrome)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
      </svg>
    );
  }

  // 4. BMW (Roundel with black outer ring, BMW letters, quartered blue & white inner circle)
  if (normalized.includes('bmw')) {
    return (
      <svg
        viewBox="0 0 100 100"
        width={dimension}
        height={dimension}
        className={`inline-block shrink-0 ${className}`}
        aria-label="BMW Logo"
      >
        <defs>
          <linearGradient id="bmw-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        {/* Outer Silver Rim */}
        <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="url(#bmw-silver)" strokeWidth="3" />
        
        {/* Inner Circle Outer Border */}
        <circle cx="50" cy="50" r="31" fill="none" stroke="url(#bmw-silver)" strokeWidth="2.5" />
        
        {/* Quartered Sectors */}
        {/* Top-Right: White */}
        <path d="M 50,50 L 50,20 A 30,30 0 0,1 80,50 Z" fill="#ffffff" />
        {/* Bottom-Right: Blue */}
        <path d="M 50,50 L 80,50 A 30,30 0 0,1 50,80 Z" fill="#0066b1" />
        {/* Bottom-Left: White */}
        <path d="M 50,50 L 50,80 A 30,30 0 0,1 20,50 Z" fill="#ffffff" />
        {/* Top-Left: Blue */}
        <path d="M 50,50 L 20,50 A 30,30 0 0,1 50,20 Z" fill="#0066b1" />

        {/* Quarter dividers */}
        <line x1="20" y1="50" x2="80" y2="50" stroke="#0f172a" strokeWidth="1" />
        <line x1="50" y1="20" x2="50" y2="80" stroke="#0f172a" strokeWidth="1" />

        {/* Letters: B M W */}
        <text x="31" y="24" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">B</text>
        <text x="50" y="16" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">M</text>
        <text x="69" y="24" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">W</text>
      </svg>
    );
  }

  // 5. PORSCHE (Gold crest shield with Stuttgart horse and stripes)
  if (normalized.includes('porsche')) {
    return (
      <svg
        viewBox="0 0 80 100"
        width={dimension * 0.8}
        height={dimension}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Porsche Crest"
      >
        <defs>
          <linearGradient id="porsche-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
        {/* Crest Shield Base */}
        <path
          d="M 10,12 Q 40,8 70,12 C 73,38 72,60 40,94 C 8,60 7,38 10,12 Z"
          fill="url(#porsche-gold)"
          stroke="#713f12"
          strokeWidth="2.5"
        />
        {/* Header Black Arch Bar */}
        <path d="M 12,14 Q 40,11 68,14 L 68,24 Q 40,21 12,24 Z" fill="#1e1e1e" />
        <text x="40" y="21" fill="url(#porsche-gold)" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="1.2">
          PORSCHE
        </text>

        {/* Quadrant Borders */}
        <line x1="14" y1="52" x2="66" y2="52" stroke="#713f12" strokeWidth="1.5" />
        <line x1="40" y1="24" x2="40" y2="82" stroke="#713f12" strokeWidth="1.5" />

        {/* Red / Black Bars Top-Right & Bottom-Left */}
        <rect x="42" y="27" width="22" height="5" fill="#dc2626" />
        <rect x="42" y="34" width="22" height="5" fill="#18181b" />
        <rect x="42" y="41" width="22" height="5" fill="#dc2626" />

        <rect x="16" y="56" width="22" height="5" fill="#dc2626" />
        <rect x="16" y="63" width="22" height="5" fill="#18181b" />
        <rect x="16" y="70" width="18" height="5" fill="#dc2626" />

        {/* Antlers representation in Top-Left & Bottom-Right */}
        <path d="M 18,32 Q 26,28 34,32 M 19,40 Q 28,36 34,40 M 20,47 Q 27,44 33,47" stroke="#18181b" strokeWidth="1.5" fill="none" />
        <path d="M 46,60 Q 54,57 60,60 M 47,68 Q 53,65 58,68" stroke="#18181b" strokeWidth="1.5" fill="none" />

        {/* Central Escutcheon (Stuttgart horse shield) */}
        <path
          d="M 32,40 Q 40,38 48,40 C 49,52 48,58 40,65 C 32,58 31,52 32,40 Z"
          fill="url(#porsche-gold)"
          stroke="#18181b"
          strokeWidth="1.2"
        />
        {/* Horse silhouette */}
        <path
          d="M 40,44 C 42,44 43,46 43,48 C 43,51 41,53 42,56 C 41,57 39,57 38,55 C 37,53 38,50 38,48 Z"
          fill="#18181b"
        />
      </svg>
    );
  }

  // 6. MAZDA (Silver chrome oval with winged dynamic 'M')
  if (normalized.includes('mazda')) {
    return (
      <svg
        viewBox="0 0 100 70"
        width={dimension}
        height={dimension * 0.7}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Mazda Logo"
      >
        <defs>
          <linearGradient id="mazda-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        {/* Outer Oval */}
        <ellipse
          cx="50"
          cy="35"
          rx="44"
          ry="30"
          fill="none"
          stroke="url(#mazda-chrome)"
          strokeWidth="6"
        />
        {/* Dynamic Soaring Wings (M) */}
        <path
          d="M 18,22 Q 40,46 50,53 Q 60,46 82,22 Q 62,38 50,38 Q 38,38 18,22 Z"
          fill="url(#mazda-chrome)"
        />
      </svg>
    );
  }

  // 7. LAMBORGHINI (Gold & black shield with charging bull)
  if (normalized.includes('lamborghini')) {
    return (
      <svg
        viewBox="0 0 85 100"
        width={dimension * 0.85}
        height={dimension}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Lamborghini Shield"
      >
        <defs>
          <linearGradient id="lambo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        {/* Triangular Shield */}
        <path
          d="M 10,12 L 75,12 L 67,64 Q 63,80 42.5,95 Q 22,80 18,64 Z"
          fill="#0a0a0f"
          stroke="url(#lambo-gold)"
          strokeWidth="4"
        />
        {/* Brand Banner */}
        <rect x="13" y="15" width="59" height="13" fill="#000000" />
        <text
          x="42.5"
          y="24.5"
          fill="url(#lambo-gold)"
          fontSize="6.2"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          LAMBORGHINI
        </text>

        {/* Charging Bull Silhouette */}
        <path
          d="M 28,45 C 32,42 42,40 47,43 C 51,45 55,47 58,45 C 55,50 51,52 53,58 C 50,60 48,68 45,71 C 43,68 41,60 38,62 C 34,65 31,69 29,66 C 31,62 33,56 32,54 C 29,53 26,50 28,45 Z"
          fill="url(#lambo-gold)"
        />
        {/* Tail whip */}
        <path d="M 47,43 Q 54,35 56,38" stroke="url(#lambo-gold)" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  // 8. FORD (Deep blue oval with signature script)
  if (normalized.includes('ford')) {
    return (
      <svg
        viewBox="0 0 100 62"
        width={dimension}
        height={dimension * 0.62}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Ford Oval"
      >
        <defs>
          <linearGradient id="ford-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
          <linearGradient id="ford-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        {/* Outer Silver Trim */}
        <ellipse
          cx="50"
          cy="31"
          rx="47"
          ry="28"
          fill="url(#ford-blue)"
          stroke="url(#ford-silver)"
          strokeWidth="3.5"
        />
        {/* Thin Inner White Ring */}
        <ellipse
          cx="50"
          cy="31"
          rx="41"
          ry="23"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Script Ford Text */}
        <text
          x="49"
          y="39"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="24"
          fontWeight="900"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          letterSpacing="-0.5"
        >
          Ford
        </text>
      </svg>
    );
  }

  // Default fallback badge
  return (
    <div
      className={`rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-[10px] text-white tracking-widest uppercase ${className}`}
    >
      {brand.slice(0, 3)}
    </div>
  );
};
