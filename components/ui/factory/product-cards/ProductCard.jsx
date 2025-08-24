import Image from "next/image";
import Link from "next/link";
import { SpinningText } from "../../spinning-text";

const ProductCard = ({ product }) => {
  const discount = product?.discount > 0 && (product?.discount / 100) * product?.original_price;
  const discountedPrice = parseInt(discount && product?.original_price - discount);
  console.log(product);
  return (
    <div className="group border-background overflow-hidden border-1">
      <div className="w-full relative">
        <Image
          src={product.images[0].path}
          width={500}
          height={700}
          alt={`${product.name}-${product.id}`}
          className="border-background border-b w-full aspect-[9/13] object-cover object-center"
        />
        {/* <ProductCardCartButton product={product} /> */}
        {product.discount > 0 && (
          // <span className="bg-destructive text-destructive-foreground rounded-full absolute top-3 right-3 flex items-center justify-center text-sm font-bold px-3 py-1">
          //   OFF {product.discount}%
          // </span>
          <div className="absolute top-12 right-12 inline-block text-red-600">
            <SpinningText
              radius={6}
              fontSize={0.7}
              className="font-light leading-none font-mono absolute top-1/2 left-1/2 -translate-x-1/5 -translate-y-1/2"
              duration={15}
            >
              {`DISCOUNTED ★ DISCOUNTED ★ `}
            </SpinningText>
            <span className="text-2xl font-medium leading-none font-mono absolute z-10 top-1/2 left-1/2 -translate-x-1/5 -translate-y-1/2 -ms-2.5">
              {`${product.discount}%`}
            </span>
          </div>
        )}
      </div>
      <Link href={`/shop/women/products/${product.id}`} className="px-3 block py-2">
        <h3 className="text-background font-medium">{`2 Piece - ${product.name} - ${product.id}`}</h3>
        <p className="font-bold text-secondary/75 tracking-wide">
          {product.brand} - {product.type}
        </p>
        {product.discount > 0 ? (
          <p className="text-secondary/75">
            <span className="line-through text-sm text-red-600">Rs {product.original_price.toLocaleString()}</span> ₨
            {product.finalPrice.toLocaleString()}
          </p>
        ) : (
          <p className="text-secondary/75">Rs {product.original_price.toLocaleString()}</p>
        )}
      </Link>
    </div>
  );
};

export default ProductCard;
