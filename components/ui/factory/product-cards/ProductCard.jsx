import Image from "next/image";
import Link from "next/link";
import ProductCardCartButton from "./ProductCardCartButton";

const ProductCard = ({ product }) => {
  const discountedPrice = product.discount
    ? Math.round(product.originalPrice - (product.discount * product.originalPrice) / 100)
    : product.originalPrice;

  return (
    <div className="group border border-background/25">
      <div className="w-full relative">
        <Image src={product.coverImage} width={500} height={700} alt={""} className="border-primary w-full object-cover" />
        <ProductCardCartButton product={product} />
        <span className="bg-destructive text-destructive-foreground rounded-full absolute top-3 right-3 flex items-center justify-center text-sm font-bold px-3 py-1">
          Flat {product.discount}%
        </span>
      </div>
      <Link href={`/shop/women/products/${product.id}`} className="px-3 block py-2">
        <p className="text-sm text-secondary/75">2 Piece - Embroidered Un-Stitched - 123456789</p>
        <p className="font-bold text-secondary/75 tracking-wide">Nishat - Pret</p>
        <p className="text-secondary tracking-wide">
          <span className="line-through text-destructive/75 me-2">Rs. {product.originalPrice}</span>
          Rs. {discountedPrice}
        </p>
      </Link>
    </div>
  );
};

export default ProductCard;
