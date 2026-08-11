import type { ImgHTMLAttributes } from 'react';
import { withBasePath } from '../lib/assets';

type ImageVariant = {
  src: string;
  width: number;
};

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  src: string;
  variants?: ImageVariant[];
  mobileVariants?: ImageVariant[];
  sizes?: string;
};

export function ResponsiveImage({
  src,
  variants = [],
  mobileVariants = [],
  sizes,
  alt = '',
  ...imageProps
}: ResponsiveImageProps) {
  const webpSrcSet = variants
    .map((variant) => `${withBasePath(variant.src)} ${variant.width}w`)
    .join(', ');
  const mobileWebpSrcSet = mobileVariants
    .map((variant) => `${withBasePath(variant.src)} ${variant.width}w`)
    .join(', ');

  return (
    <picture className="contents">
      {mobileWebpSrcSet && (
        <source
          media="(max-width: 767px)"
          type="image/webp"
          srcSet={mobileWebpSrcSet}
          sizes={sizes}
        />
      )}
      {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
      <img src={withBasePath(src)} alt={alt} sizes={sizes} {...imageProps} />
    </picture>
  );
}
