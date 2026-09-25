import { withBasePath } from '../lib/assets';

type BrandMarkProps = {
  compact?: boolean;
  variant?: 'color' | 'white' | 'black';
  className?: string;
};

const horizontalLogoByVariant = {
  color: '/brand/kyrgyz-tours-logo-header-color.png',
  white: '/brand/kyrgyz-tours-logo-horizontal-white.png',
  black: '/brand/kyrgyz-tours-logo-horizontal-black.png',
} as const;

const symbolByVariant = {
  color: '/brand/kyrgyz-tours-symbol-color.png',
  white: '/brand/kyrgyz-tours-symbol-white.png',
  black: '/brand/kyrgyz-tours-symbol-black.png',
} as const;

export function BrandMark({ compact = false, variant = 'color', className = '' }: BrandMarkProps) {
  const source = compact ? symbolByVariant[variant] : horizontalLogoByVariant[variant];

  return (
    <img
      src={withBasePath(source)}
      alt="kyrgyz.tours"
      width={compact ? 724 : 2172}
      height={724}
      className={`site-brand__logo ${compact ? 'site-brand__logo--symbol' : ''} ${className}`.trim()}
      decoding="async"
    />
  );
}
