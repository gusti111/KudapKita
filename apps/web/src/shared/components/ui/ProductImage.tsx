import { useState } from 'react';

type ProductImageProps = {
  name: string;
  category?: string;
  src?: string | null;
  className?: string;
  fit?: 'cover' | 'contain';
};

function productGlyph(name: string, category = '') {
  const value = `${name} ${category}`.toLocaleLowerCase('id-ID');
  if (value.includes('risol') || value.includes('risoles')) return '🥟';
  if (value.includes('onde')) return '🍡';
  if (value.includes('dadar')) return '🥞';
  if (value.includes('apam') || value.includes('doko') || value.includes('bugis')) return '🍰';
  if (value.includes('mayo')) return '🥐';
  return '🍪';
}

export function ProductImage({ name, category, src, className = '', fit = 'cover' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(src && !failed);

  return (
    <div className={`product-image-frame ${className}`}>
      {hasImage ? (
        <img
          src={src ?? undefined}
          alt={`Foto ${name}`}
          loading="lazy"
          decoding="async"
          className={`product-image product-image--${fit}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="product-image-fallback" role="img" aria-label={`Foto ${name} belum ditambahkan`}>
          <span className="product-image-fallback__glyph" aria-hidden="true">{productGlyph(name, category)}</span>
          <span className="product-image-fallback__label">Foto produk belum tersedia</span>
        </div>
      )}
    </div>
  );
}
