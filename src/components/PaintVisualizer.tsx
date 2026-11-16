import React from 'react';
import { Product } from '../types';

interface PaintVisualizerProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PaintVisualizer: React.FC<PaintVisualizerProps> = ({
  product,
  size = 'md',
  className = '',
}) => {
  const isLightColor = (hex: string) => {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return true;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65;
  };

  const isLight = isLightColor(product.colorHex);
  const color = product.colorHex || '#CBD5E1';

  const dimensions = {
    sm: { width: 140, height: 130 },
    md: { width: 220, height: 180 },
    lg: { width: 340, height: 280 },
  }[size];

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-100/90 to-slate-200/90 p-4 transition-transform duration-300 group-hover:scale-[1.02] ${className}`}
      style={{ minHeight: `${dimensions.height}px` }}
    >
      {/* Background subtle radial glow reflecting paint color */}
      <div
        className="absolute inset-0 opacity-20 blur-xl pointer-events-none transition-opacity duration-300 group-hover:opacity-35"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`,
        }}
      />

      {/* Modern architectural paint container SVG */}
      <svg
        viewBox="0 0 200 190"
        className="w-full h-full max-h-[170px] drop-shadow-md select-none transition-transform duration-300 group-hover:-translate-y-1"
        style={{ maxWidth: `${dimensions.width}px` }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Can body metallic gradient */}
          <linearGradient id={`can-body-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="15%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Lid metallic gradient */}
          <linearGradient id={`can-lid-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Color band shine */}
          <linearGradient id={`shine-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </linearGradient>

          <filter id={`shadow-${product.id}`} x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Can shadow */}
        <ellipse cx="100" cy="178" rx="65" ry="8" fill="#0F172A" fillOpacity="0.15" />

        {/* Handle wire */}
        <path
          d="M 40 75 C 40 20, 160 20, 160 75"
          stroke="#94A3B8"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Handle rubber grip */}
        <path
          d="M 85 24 C 95 22, 105 22, 115 24"
          stroke="#1E293B"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Can main cylindrical body */}
        <path
          d="M 45 60 L 155 60 L 150 170 C 150 176, 50 176, 50 170 Z"
          fill={`url(#can-body-${product.id})`}
          filter={`url(#shadow-${product.id})`}
        />

        {/* Colored central branding label */}
        <path
          d="M 47 88 L 153 88 L 151 146 C 151 150, 49 150, 49 146 Z"
          fill={color}
        />
        {/* Label gloss overlay */}
        <path
          d="M 47 88 L 153 88 L 151 146 C 151 150, 49 150, 49 146 Z"
          fill={`url(#shine-${product.id})`}
        />

        {/* Paint dripping detail */}
        <path
          d="M 75 88 C 75 97, 83 97, 83 88 C 83 95, 90 95, 90 88"
          fill={color}
          opacity="0.9"
        />

        {/* Pintuco Color Link Brand Typography inside the can */}
        <g transform="translate(100, 112)">
          <text
            textAnchor="middle"
            fill={isLight ? '#0F172A' : '#FFFFFF'}
            fontSize="10"
            fontWeight="800"
            fontFamily="'Outfit', sans-serif"
            letterSpacing="0.08em"
          >
            PINTUCO
          </text>
          <text
            y="11"
            textAnchor="middle"
            fill={isLight ? '#334155' : '#E2E8F0'}
            fontSize="6.5"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            COLOR LINK
          </text>
          <text
            y="21"
            textAnchor="middle"
            fill={isLight ? '#1E3A8A' : '#FDE047'}
            fontSize="6"
            fontWeight="700"
          >
            {product.category}
          </text>
        </g>

        {/* Metallic top rim / lid */}
        <ellipse
          cx="100"
          cy="60"
          rx="56"
          ry="11"
          fill={`url(#can-lid-${product.id})`}
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />
        <ellipse
          cx="100"
          cy="60"
          rx="52"
          ry="9"
          fill="#E2E8F0"
          stroke="#94A3B8"
          strokeWidth="1"
        />

        {/* Small paint dollop on the lid matching the paint */}
        <ellipse cx="100" cy="60" rx="14" ry="4" fill={color} opacity="0.9" />

        {/* Handle brackets on sides */}
        <circle cx="44" cy="74" r="3.5" fill="#64748B" />
        <circle cx="156" cy="74" r="3.5" fill="#64748B" />
      </svg>

      {/* Clean unboxed color tag and finish */}
      <div className="mt-2.5 flex items-center justify-between w-full px-2 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <span
            className="inline-block w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs shrink-0"
            style={{ backgroundColor: color }}
            title={`Tono: ${product.colorName} (${product.colorHex})`}
          />
          <span className="font-medium text-slate-700 truncate">{product.colorName}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-normal shrink-0">{product.finish}</span>
      </div>
    </div>
  );
};
