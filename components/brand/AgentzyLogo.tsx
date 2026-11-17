import React from 'react';

interface AgentzyLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export function AgentzyLogo({
  variant = 'light',
  size = 'md',
  showWordmark = true,
}: AgentzyLogoProps) {
  const iconDim = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-8 w-8';
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const textColor = variant === 'dark' ? 'text-white' : 'text-[#17324D]';

  return (
    <span className="inline-flex items-center gap-2.5 shrink-0 whitespace-nowrap select-none">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className={iconDim}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="azLogoGrad" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="55%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        <rect
          width="40"
          height="40"
          rx="10"
          fill={variant === 'dark' ? '#1E3F60' : '#E6F4F9'}
        />
        <path
          d="M20 7L9.5 32H14.8L20 19.2L25.2 32H30.5L20 7Z"
          fill="url(#azLogoGrad)"
        />
        <path
          d="M15.2 24.5H24.8L23.2 28.2H16.8L15.2 24.5Z"
          fill={variant === 'dark' ? '#FFFFFF' : '#17324D'}
        />
      </svg>
      {showWordmark && (
        <span className={`font-bold tracking-tight ${textSize} ${textColor}`}>
          Agentzy
        </span>
      )}
    </span>
  );
}
