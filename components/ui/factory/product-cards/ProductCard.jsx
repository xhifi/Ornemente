import Image from "next/image";
import Link from "next/link";
import ProductCardCartButton from "./ProductCardCartButton";

const ProductCard = ({ product }) => {
  const discount = product?.discount > 0 && (product?.discount / 100) * product?.original_price;
  const discountedPrice = parseInt(discount && product?.original_price - discount);

  return (
    <div className="group border-background/25">
      <div className="w-full relative">
        <Image
          src={product.images[0].path}
          width={500}
          height={700}
          alt={`${product.name}-${product.id}`}
          className="border-primary w-full aspect-[9/13] object-cover object-center"
        />
        <ProductCardCartButton product={product} />
        {product.discount > 0 && (
          <span className="bg-destructive text-destructive-foreground rounded-full absolute top-3 right-3 flex items-center justify-center text-sm font-bold px-3 py-1">
            OFF {product.discount}%
          </span>
        )}
      </div>
      <Link href={`/shop/women/products/${product.id}`} className="px-3 block py-2">
        <h3 className="text-background font-medium">{`2 Piece - ${product.name} - ${product.id}`}</h3>
        <p className="font-bold text-secondary/75 tracking-wide">
          {product.brand} - {product.type}
        </p>
        {product.discount > 0 ? (
          <p className="text-secondary/75">
            <span className="line-through text-sm">Rs {product.original_price.toLocaleString()}</span> ₨{discountedPrice.toLocaleString()}
          </p>
        ) : (
          <p className="text-secondary/75">Rs {product.original_price.toLocaleString()}</p>
        )}
      </Link>
    </div>
  );
};

export default ProductCard;
