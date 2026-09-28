import { PRODUCT } from '../config/product';

/** Approved source artwork, contained without cropping or distortion. */
export function BrandMark({ size = 64, decorative = false }: { size?: number; decorative?: boolean }) {
  return <img src={PRODUCT.logo} width={size} height={size} alt={decorative ? '' : `Logo ${PRODUCT.name}`} draggable={false} className="brand-mark" style={{objectFit:'contain',display:'block',flexShrink:0}} />;
}
