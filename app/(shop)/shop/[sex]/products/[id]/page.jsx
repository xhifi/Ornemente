import ImageSlideshow from "@/components/ui/factory/image-slideshow";
import AddToCartButton from "@/components/ui/factory/product-cards/AddToCartButton";
import getProductById from "@/data/dal/shop/products/get-product-by-id";

const SKUPage = async ({ params }) => {
  const id = (await params).id;
  const { product } = await getProductById(id);
  const discount = product?.discount > 0 && (product?.discount / 100) * product?.original_price;
  const discountedPrice = parseInt(discount && product?.original_price - discount);

  console.log(product);

  return (
    <div className="px-6 py-12 max-w-screen-xl mx-auto">
      <div className="flex gap-12 flex-nowrap flex-col md:flex-row">
        <div className="md:w-1/2 w-full">
          <div className="h-full relative">
            {/* <Image src={product.coverImage} width={700} height={700} alt="" className="w-auto h-full block" /> */}
            <ImageSlideshow images={product.images} />

            <span className="bg-destructive text-secondary absolute top-6 right-6 px-3 py-1.5 text-sm rounded-full">
              Off <span className="text-base font-bold">{product.discount}%</span>
            </span>
          </div>
        </div>
        <div className="md:w-1/2 w-full">
          <div className="flex flex-col space-y-3 h-full">
            <h1>
              {product?.pieces?.length} Piece - {product.brand_name + " " + product.name} - {product.id}
            </h1>
            <p>
              {product.discount > 0 ? (
                <>
                  <span className="line-through text-xl text-black">Rs {product.original_price.toLocaleString()}</span>
                  <span className="text-3xl text-destructive ms-2">Rs {discountedPrice.toLocaleString()}</span>
                </>
              ) : (
                <span className="text-foreground/75 text-3xl">Rs {product.original_price.toLocaleString()}</span>
              )}
            </p>
            <p>SKU: {product.sku}</p>

            <AddToCartButton product={product} />

            <p className="text-destructive animate-pulse">Only {product.remainingStock} left in stock</p>
            {product.tagline && product.tagline !== "" && <p>{product.tagline}</p>}

            <div>
              <h2 className="font-bold">Product Description:</h2>
              <p>{product.description}</p>
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
                        <span className="ms-2">{piece.fabric_name}</span>
                      </p>
                      <p>
                        <b>Color:</b>
                        <span className="ms-2">{piece.color_name}</span>
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
