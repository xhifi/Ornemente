import getProductById from "@/data/dal/shop/products/get-product-by-id";
import { getProductImages } from "@/data/dal/shop/file-system/image-actions";
import getShopSexes from "@/data/dal/shop/get-shop-sexes";
import getShopTypes from "@/data/dal/shop/get-shop-types";
import getShopBrands from "@/data/dal/shop/get-shop-brands";
import getShopSizes from "@/data/dal/shop/get-shop-sizes";
import getShopDesigns from "@/data/dal/shop/get-shop-designs";
import getShopFabrics from "@/data/dal/shop/get-shop-fabrics";
import getShopColors from "@/data/dal/shop/get-shop-colors";
import UpdateProductForm from "@/components/forms/UpdateProduct";
import { notFound } from "next/navigation";
import saveProductImage from "@/data/dal/shop/products/save-product-image";
import deleteProductImage from "@/data/dal/shop/products/delete-product-image";
import updateProductAction from "@/data/dal/shop/products/actions/update-product.action";

export const dynamic = "force-dynamic"; // Force dynamic rendering for this page

// Server Component - async function to fetch data
export default async function EditProductPage({ params }) {
  const { id } = await params;

  // Fetch all data in parallel
  const [productResult, sexesResult, typesResult, brandsResult, sizesResult, designsResult, fabricsResult, colorsResult, imagesResult] =
    await Promise.all([
      getProductById(id),
      getShopSexes(),
      getShopTypes(),
      getShopBrands(),
      getShopSizes(),
      getShopDesigns(),
      getShopFabrics(),
      getShopColors(),
      getProductImages(id),
    ]);

  // Handle not found case
  if (productResult.error) {
    notFound();
  }

  // Extract data
  const product = productResult.product;
  const images = imagesResult?.success ? imagesResult.images : [];

  // Extract product's existing designs, sizes and images from the product result
  const existingDesigns = product.designs || [];
  const existingSizes = product.sizes || [];

  return (
    <div className="max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold tracking-tight">Edit Product: {product.name}</h1>

      <UpdateProductForm
        product={product}
        images={images}
        uploadImage={saveProductImage}
        deleteImage={deleteProductImage}
        existingDesigns={existingDesigns}
        existingSizes={existingSizes}
        sexes={sexesResult}
        types={typesResult}
        brands={brandsResult}
        sizes={sizesResult}
        designs={designsResult}
        fabrics={fabricsResult}
        colors={colorsResult}
        action={updateProductAction}
      />
    </div>
  );
}
