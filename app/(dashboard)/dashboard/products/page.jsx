import Link from "next/link";
import getShopSexes from "@/data/dal/shop/get-shop-sexes";
import AddProductDialog from "@/components/forms/AddProductDialog";
import DeleteProductDialog from "@/components/forms/DeleteProductDialog";
import Image from "next/image";
import getProductsPaginated from "@/data/dal/shop/products/get-all-products-paginated";
import PublishButton from "@/components/ui/factory/form/publish-button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit } from "lucide-react";

// Server Component - async function to fetch data
export default async function ProductsPage() {
  // Fetch data on the server
  const { products } = await getProductsPaginated({}); // Pass empty object for default values
  const sexes = await getShopSexes();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <AddProductDialog sexes={sexes} />
      </div>

      {products.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No products found</p>
          <AddProductDialog sexes={sexes} buttonText="Add Your First Product" />
        </div>
      ) : (
        <Table>
          <TableCaption>Available Products</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Publish</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-20 w-12 bg-gray-100 rounded overflow-hidden">
                      {product?.images?.length > 0 ? (
                        <Image
                          src={`/api/cdn/images/${product.images[0].key}`}
                          placeholder="blur"
                          blurDataURL={product.images[0].resized_thumb}
                          alt={product.name}
                          width={100}
                          height={150}
                          className="object-cover h-full w-full object-center"
                        />
                      ) : null}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">
                        <Link href={`/dashboard/products/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[300px]">{product.description || "No description"}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{product.sex_name || "Unspecified"}</TableCell>
                <TableCell>
                  <div>{product.original_price ? `₨${product.original_price.toLocaleString()}` : "N/A"}</div>
                  {product.discount > 0 && <div className="text-xs text-green-600">{product.discount}% off</div>}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      product.publish_status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {product.publish_status === "published" ? "Published" : "Draft"}
                  </span>
                </TableCell>
                <TableCell>
                  <PublishButton status={product.publish_status} id={product.id} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center space-x-2">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="text-info hover:underline mr-2">
                      <Edit size={16} />
                    </Link>
                    <DeleteProductDialog productId={product.id} productName={product.name} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
