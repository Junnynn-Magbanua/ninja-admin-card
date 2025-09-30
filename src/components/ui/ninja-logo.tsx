import React from 'react';

interface NinjaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NinjaLogo: React.FC<NinjaLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <img
      src="/Ninja.png"
      alt="Ninja Logo"
      className={`${sizeClasses[size]} ${className} object-contain`}
    />
  );
};