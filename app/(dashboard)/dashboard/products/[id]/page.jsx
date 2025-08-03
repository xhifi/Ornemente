import getProductById from "@/data/dal/shop/products/get-product-by-id";

export const dynamic = "force-dynamic"; // Force dynamic rendering for this page

const ProductViewPage = async ({ params }) => {
  const { id } = await params;
  const { product } = await getProductById(id);

  return (
    <div>
      <ul>
        <li>Product ID: {product.id}</li>
        <li>Product Name: {product.name}</li>
        <li>Product Description: {product.description}</li>
        <li>Product Price: {product.price}</li>
        <li>Product Stock: {product.stock}</li>
        <li>Product Category: {product.category}</li>
        <li>Product Created At: {product.created_at}</li>
        <li>Product Updated At: {product.updated_at}</li>
      </ul>
      <div>
        <h2>Product Designs</h2>
        {product.designs && product.designs.length > 0 && (
          <ul>
            {product.designs.map((design) => (
              <li key={design.id}>{design.name}</li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2>Product Sizes</h2>
        {product.sizes && product.sizes.length > 0 && (
          <ul>
            {product.sizes.map((size) => (
              <li key={size.id}>
                {size.code}: {size.stock}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2>Product Images</h2>
        {product.images && product.images.length > 0 ? (
          <ul>
            {product.images.map((image) => (
              <li key={image.id}>
                <img src={image.path} alt={image.name} className="w-32 h-32 object-cover" />
              </li>
            ))}
          </ul>
        ) : (
          <p>No images available for this product.</p>
        )}
      </div>
      <div>
        <h2>Product Pieces</h2>
        {product.pieces && product.pieces.length > 0 ? (
          <ul>
            {product.pieces.map((piece) => (
              <li key={piece.id}>{piece.name}</li>
            ))}
          </ul>
        ) : (
          <p>No pieces available for this product.</p>
        )}
      </div>
    </div>
  );
};

export default ProductViewPage;
