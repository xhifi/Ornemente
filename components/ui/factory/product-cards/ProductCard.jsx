import Image from "next/image";
import Link from "next/link";
import { SpinningText } from "../../spinning-text";

const ProductCard = ({ product }) => {
  const disabled = product.total_stock < 1;
  return (
    <div className="group overflow-hidden border-1 border-primary">
      <div className="w-full relative">
        <Image
          src={product.images[0].path}
          width={500}
          height={700}
          alt={`${product.name}-${product.id}`}
          className="border-primary border-b w-full aspect-[9/13] object-cover object-center"
        />
        {disabled && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <p className="text-red-600 text-center absolute bottom-13 right-0 inline-block bg-white/75 text-base md:text-2xl font-semibold leading-tight font-mono px-4 py-2 -rotate-45">
              Sold Out
            </p>
          </div>
        )}
        {/* <ProductCardCartButton product={product} /> */}
        {product.discount > 0 && !disabled && (
          <div className="absolute top-11 right-11 inline-block text-red-600">
            <SpinningText
              radius={5}
              fontSize={0.7}
              className="font-bold leading-none font-mono absolute top-1/2 left-1/2 -translate-x-1/5 -translate-y-1/2"
              duration={15}
            >
              {`DISCOUNTED ★ DISCOUNTED ★ `}
            </SpinningText>
            <span className="text-xl font-medium leading-none font-mono absolute z-10 top-1/2 left-1/2 -translate-x-1/5 -translate-y-1/2 -ms-3">
              {`${product.discount}%`}
            </span>
          </div>
        )}
      </div>
      <Link href={`/shop/women/products/${product.id}`} className={`px-3 block py-2 ${disabled ? "opacity-50" : ""}`} disabled={disabled}>
        <h3 className="text-primary font-medium">{`2 Piece - ${product.name} - ${product.id}`}</h3>
        <p className="font-bold text-primary/75 tracking-wide">
          {product.brand} - {product.type}
        </p>
        {disabled ? (
          <p className="text-primary/75 leading-none">Out of Stock</p>
        ) : (
          <p className="text-primary/75">
            {product.discount > 0 ? (
              <>
                <span className="line-through text-sm text-red-600">Rs {product.original_price.toLocaleString()}</span> ₨
                {product.finalPrice.toLocaleString()}
              </>
            ) : (
              <>Rs {product.original_price.toLocaleString()}</>
            )}
          </p>
        )}
      </Link>
    </div>
  );
};

export default ProductCard;
