import ImageSlideshow from "@/components/ui/factory/image-slideshow";
import AddToCartButton from "@/components/ui/factory/product-cards/AddToCartButton";
import products from "@/data/products";
import Image from "next/image";

import Nishat1 from "@/data/placeholder/nishat-1.jpg";
import Nishat2 from "@/data/placeholder/nishat-2.jpg";
import Nishat3 from "@/data/placeholder/nishat-3.jpg";
import Nishat4 from "@/data/placeholder/nishat-4.jpg";
import Alkaram1 from "@/data/placeholder/alkaram-1.jpg";
import Alkaram2 from "@/data/placeholder/alkaram-2.jpg";
import Alkaram3 from "@/data/placeholder/alkaram-3.jpg";
import Alkaram4 from "@/data/placeholder/alkaram-4.jpg";

const images = [Nishat1, Nishat2, Nishat3, Nishat4, Alkaram1, Alkaram2, Alkaram3, Alkaram4];

const SKUPage = async ({ params }) => {
  const id = (await params).id;
  const product = products.find((product) => product.id === +id);
  const discountedPrice = product.discount
    ? Math.round(product.originalPrice - (product.discount * product.originalPrice) / 100)
    : product.originalPrice;

  return (
    <div className="px-6 py-12 max-w-screen-xl mx-auto">
      <div className="flex gap-12 flex-nowrap flex-col md:flex-row">
        <div className="md:w-1/2 w-full">
          <div className="h-full relative">
            {/* <Image src={product.coverImage} width={700} height={700} alt="" className="w-auto h-full block" /> */}
            <ImageSlideshow images={images} />

            <span className="bg-destructive text-secondary absolute top-6 right-6 px-3 py-1.5 text-sm rounded-full">
              Discounted <span className="text-base font-bold">15%</span>
            </span>
          </div>
        </div>
        <div className="md:w-1/2 w-full">
          <div className="flex flex-col space-y-3 h-full">
            <h1>
              {product?.pieces?.length} Piece - {product.brand + " " + product.name} - {product.id}
            </h1>
            <p>
              <span className="line-through text-xl">Rs. {product.originalPrice}</span>
              <span className="text-3xl text-destructive ms-2">Rs. {discountedPrice}</span>
            </p>
            <p>SKU: {product.sku}</p>

            <AddToCartButton product={product} />

            <p className="text-destructive animate-pulse">Only {product.remainingStock} left in stock</p>
            <p>{product.description}</p>

            <div>
              <h2 className="font-bold">Product Description:</h2>
              <p>{product.tagline}</p>
            </div>

            <div>
              {product.pieces && product.pieces.length > 0 && (
                <ul className="space-y-3">
                  {product.pieces.map((piece, index) => (
                    <li key={index} className="border-b pb-3">
                      <h2 className="font-bold">{piece.name}:</h2>
                      <p>{piece.description}</p>
                      <p>
                        <b>Fabric:</b>
                        <span className="ms-2">{piece.fabric}</span>
                      </p>
                      <p>
                        <b>Color:</b>
                        <span className="ms-2">{piece.color}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="font-bold">Note:</h2>
              <p>Product color may slightly vary due to photographic lighting sources or your device settings.</p>
              <p>{product.note}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SKUPage;
