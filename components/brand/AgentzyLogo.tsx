import React from 'react';
import Image from 'next/image';

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
  if (!showWordmark) {
    const iconSizeClass =
      size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-24 w-24' : 'h-12 w-12';

    return (
      <span className="inline-flex shrink-0 items-center justify-center select-none">
        <Image
          src="/images/agentzy-icon.png"
          alt="Agent-zy App Icon"
          width={1225}
          height={1225}
          priority
          referrerPolicy="no-referrer"
          className={`${iconSizeClass} object-contain`}
        />
      </span>
    );
  }

  const logoHeightClass =
    size === 'sm'
      ? 'h-8 sm:h-9 w-auto'
      : size === 'lg'
        ? 'h-11 sm:h-12 w-auto'
        : 'h-9 sm:h-10 w-auto';

  const wrapperClass =
    variant === 'dark'
      ? size === 'lg'
        ? 'inline-flex shrink-0 items-center rounded-[12px] bg-white/95 px-3 py-1.5 shadow-xs ring-1 ring-white/20 select-none'
        : 'inline-flex shrink-0 items-center rounded-[10px] bg-white/95 px-2.5 py-1 shadow-xs ring-1 ring-white/20 select-none'
      : 'inline-flex shrink-0 items-center select-none';

  return (
    <span className={wrapperClass}>
      <Image
        src="/images/agentzy-logo.png"
        alt="Agent-zy — Smarter Workforce Powered by Human & AI"
        width={2040}
        height={632}
        priority
        referrerPolicy="no-referrer"
        className={`${logoHeightClass} object-contain`}
      />
    </span>
  );
}
