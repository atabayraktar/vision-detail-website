import Image from 'next/image';

// D2 (design architecture): one full-width poster shot below the info block, per product.
export default function ProductPoster({ src, alt }) {
  return (
    <div className="product-poster" data-reveal>
      <Image src={src} alt={alt} fill sizes="100vw" style={{ objectFit: 'cover' }} />
    </div>
  );
}
